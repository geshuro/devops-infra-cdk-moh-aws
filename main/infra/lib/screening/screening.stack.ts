import { Inject, Injectable, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiStack } from '@aws-ee/core-rest-api-infra';
import { PostDeploymentStack } from '@aws-ee/core-post-deployment-infra';
import { OpenSearchStack } from '@aws-ee/opensearch-api-infra';
import {
  CoreStage,
  CoreConfig,
  EnvType,
  Stack,
  CoreStack,
  setLogicalId,
  StackOutputService,
  MainVpc,
} from '@aws-ee/core-infra';

import {
  Function as LambdaFunction,
  StartingPosition,
  Runtime,
  FunctionProps,
} from '@aws-cdk/aws-lambda';
import { Construct, RemovalPolicy, Duration } from '@aws-cdk/core';
import { DynamoEventSource } from '@aws-cdk/aws-lambda-event-sources';
import { Bucket } from '@aws-cdk/aws-s3';
import {
  FlowLogTrafficType,
  FlowLogDestination,
  SubnetType,
} from '@aws-cdk/aws-ec2';

import { codeFromPkg } from '../utils/path-utils';
import { ScreeningsTable } from './screenings.table';
import { ArticleTable } from './article.table';
import { DocumentInput } from './input';

@Injectable()
export class ScreeningStack extends Stack {
  public readonly screeningsTable: ScreeningsTable;
  public readonly articleTable: ArticleTable;
  public readonly processedMetadataBucket: Bucket;
  public readonly rawPdfBucket: Bucket;
  public readonly processedPdfBucket: Bucket;

  constructor(
    configService: ConfigService,
    coreStack: CoreStack,
    @Inject(CoreStage) stage: Construct,
    apiStack: ApiStack,
    postDeploymentStack: PostDeploymentStack,
    openSearchStack: OpenSearchStack,
    stackOutputService: StackOutputService,
    @Optional() @Inject(MainVpc) mainVpc: MainVpc
  ) {
    const coreConfig = configService.get<CoreConfig>(CoreConfig.KEY)!;
    super(stage, 'screening', {
      description:
        'Contains resources related to tracking and updating a single screening process',
      envName: coreConfig.envName,
      solutionName: coreConfig.solutionName,
    });
    const removalPolicy =
      coreConfig.envType === EnvType.Dev
        ? RemovalPolicy.DESTROY
        : RemovalPolicy.RETAIN;

    apiStack.apiHandler.addEnvironment(
      'APP_OPENSEARCH_REPLICAS_SCREENING_INDEX',
      coreConfig.envType === EnvType.Dev ? '0' : '1'
    );

    let vpcOptions: Partial<FunctionProps> = {};
    if (mainVpc) {
      mainVpc.vpc.addFlowLog(`${coreConfig.globalNamespace}-flow-log`, {
        trafficType: FlowLogTrafficType.REJECT,
        destination: FlowLogDestination.toS3(
          coreStack.loggingBucket,
          'vpc-flow-logs-rejected'
        ),
      });
      vpcOptions = {
        vpc: mainVpc.vpc,
        vpcSubnets: { subnetType: SubnetType.PRIVATE },
        securityGroups: [mainVpc.defaultSecurityGroup],
      };
    }

    this.screeningsTable = new ScreeningsTable(this, {
      namespace: coreConfig.globalNamespace,
      dbPrefix: coreConfig.dbPrefix,
      removalPolicy,
    });

    this.articleTable = new ArticleTable(this, {
      namespace: coreConfig.globalNamespace,
      dbPrefix: coreConfig.dbPrefix,
      removalPolicy,
    });

    const articlesStreamSource = new DynamoEventSource(
      this.articleTable.table,
      {
        startingPosition: StartingPosition.LATEST,
        batchSize: 100,
        parallelizationFactor: 5,
        // default value is 0 seconds, but this is to emphasize we need updates as close to live as possible
        // as technicians making decisions need to be streamed to OpenSearch ASAP to keep UI consistent
        maxBatchingWindow: Duration.seconds(0),
      }
    );

    const articlesStreamer = new LambdaFunction(this, 'ArticlesStreamer', {
      functionName: `${coreConfig.namespace}-articlesStreamHandler`,
      description: 'Streams articles in a screening from DDB to OpenSearch',
      runtime: Runtime.NODEJS_14_X,
      code: codeFromPkg('@aws-ee/backend-streamer'),
      handler: 'index.articlesStreamHandler',
      events: [articlesStreamSource],
      timeout: Duration.minutes(5),
      environment: {
        APP_DB_PREFIX: coreConfig.dbPrefix,
        APP_OPENSEARCH_VERSION: openSearchStack.openSearchVersion.version,
        APP_OPENSEARCH_ENDPOINT: openSearchStack.domain.domainEndpoint,
      },
      ...vpcOptions,
    });
    this.articleTable.table.grantStreamRead(articlesStreamer);
    openSearchStack.domain.grantWrite(articlesStreamer);
    setLogicalId(articlesStreamer, 'articlesStreamHandler');

    const screeningsStreamSource = new DynamoEventSource(
      this.screeningsTable.table,
      {
        startingPosition: StartingPosition.LATEST,
        batchSize: 100,
        parallelizationFactor: 5,
        // default value is 0 seconds, but this is to emphasize we need updates as close to live as possible
        // as technicians making decisions need to be streamed to OpenSearch ASAP to keep UI consistent
        maxBatchingWindow: Duration.seconds(0),
      }
    );

    const screeningsStreamer = new LambdaFunction(this, 'ScreeningsStreamer', {
      functionName: `${coreConfig.namespace}-screeningsStreamHandler`,
      description: 'Streams articles in a screening from DDB to OpenSearch',
      runtime: Runtime.NODEJS_14_X,
      code: codeFromPkg('@aws-ee/backend-streamer'),
      handler: 'index.screeningsStreamHandler',
      events: [screeningsStreamSource],
      timeout: Duration.minutes(5),
      environment: {
        APP_DB_PREFIX: coreConfig.dbPrefix,
        APP_OPENSEARCH_VERSION: openSearchStack.openSearchVersion.version,
        APP_OPENSEARCH_ENDPOINT: openSearchStack.domain.domainEndpoint,
      },
      ...vpcOptions,
    });
    this.screeningsTable.table.grantStreamRead(screeningsStreamer);
    openSearchStack.domain.grantWrite(screeningsStreamer);
    setLogicalId(screeningsStreamer, 'screeningsStreamHandler');

    [
      apiStack.apiHandler,
      postDeploymentStack.postDeploymentLambda,
      articlesStreamer,
      screeningsStreamer,
    ].forEach((lambda: LambdaFunction) => {
      this.screeningsTable.table.grant(lambda, 'dynamodb:DescribeTable'); // Needed for Dynamoose
      this.screeningsTable.table.grantReadWriteData(lambda);
      this.screeningsTable.key.grantEncryptDecrypt(lambda);
      this.articleTable.table.grant(lambda, 'dynamodb:DescribeTable'); // Needed for Dynamoose
      this.articleTable.table.grantReadWriteData(lambda);
      this.articleTable.table.encryptionKey?.grantEncryptDecrypt(lambda);
    });

    const input = new DocumentInput(this, {
      namespace: coreConfig.globalNamespace,
      dbPrefix: coreConfig.dbPrefix,
      removalPolicy,
      loggingBucket: coreStack.loggingBucket,
      articleTable: this.articleTable.table,
      screeningsTable: this.screeningsTable.table,
      websiteUrl: stackOutputService.get({
        stack: apiStack,
        outputName: 'WebsiteUrl',
        defaultValue: `https://example.com/This+is+a+first+deployment+or+something+went+wrong++Try+re-deploying.`,
      }),
    });
    apiStack.apiHandler.addEnvironment(
      'RAW_METADATA_BUCKET',
      input.rawMetadataBucket.bucketName
    );
    apiStack.apiHandler.addEnvironment(
      'RAW_PDF_BUCKET',
      input.rawPdfBucket.bucketName
    );
    // access for presigned upload urls to work
    apiStack.apiHandler.addEnvironment(
      'PROCESSED_PDF_BUCKET',
      input.processedPdf.bucketName
    );
    input.rawMetadataBucket.grantPut(apiStack.apiHandler);
    input.rawPdfBucket.grantRead(apiStack.apiHandler);
    input.processedPdf.grantWrite(apiStack.apiHandler);
    this.rawPdfBucket = input.rawPdfBucket;
    this.processedMetadataBucket = input.processedMetadata;
    this.processedPdfBucket = input.processedPdf;
  }
}
