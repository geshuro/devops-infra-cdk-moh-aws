import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { Construct, RemovalPolicy, Duration } from '@aws-cdk/core';
import {
  Role,
  ServicePrincipal,
  PolicyStatement,
  PolicyDocument,
} from '@aws-cdk/aws-iam';
import { Key } from '@aws-cdk/aws-kms';
import { BlockPublicAccess, Bucket, BucketEncryption } from '@aws-cdk/aws-s3';
import { StateMachine } from '@aws-cdk/aws-stepfunctions';
import { DynamoEventSource } from '@aws-cdk/aws-lambda-event-sources';
import {
  Function as LambdaFunction,
  StartingPosition,
  Runtime,
} from '@aws-cdk/aws-lambda';

import {
  CoreStage,
  CoreConfig,
  Stack,
  EnvType,
  CoreStack,
} from '@aws-ee/core-infra';
import { OpenSearchStack } from '@aws-ee/opensearch-api-infra';

import { ScreeningStack } from '../screening/screening.stack';
import { WorkflowDefinition } from './workflow';
import { codeFromPkg } from '../utils/path-utils';

@Injectable()
export class MLProcessingStack extends Stack {
  constructor(
    configService: ConfigService,
    screeningStack: ScreeningStack,
    coreStack: CoreStack,
    @Inject(CoreStage) stage: Construct,
    openSearchStack: OpenSearchStack
  ) {
    const coreConfig = configService.get<CoreConfig>(CoreConfig.KEY)!;
    super(stage, 'MLProcessingStack', {
      description:
        'Contains resources related to tracking and updating a single screening process',
      envName: coreConfig.envName,
      solutionName: coreConfig.solutionName,
    });
    const removalPolicy =
      coreConfig.envType === EnvType.Dev
        ? RemovalPolicy.DESTROY
        : RemovalPolicy.RETAIN;

    const mlResultsKey = new Key(this, 'mlResultsKey', {
      alias: `${coreConfig.globalNamespace}-ml-results-key`,
      enableKeyRotation: true,
      removalPolicy,
    });

    const mlResultsBucket = new Bucket(this, 'MLResultsBucket', {
      bucketName: `${coreConfig.globalNamespace}-ml-results`,
      encryption: BucketEncryption.KMS,
      encryptionKey: mlResultsKey,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      serverAccessLogsBucket: coreStack.loggingBucket,
      serverAccessLogsPrefix: 'ml-results/',
      removalPolicy,
      autoDeleteObjects: removalPolicy === RemovalPolicy.DESTROY,
    });

    const comprehendTermsBucket = new Bucket(this, 'ComprehendTermsBucket', {
      bucketName: `${coreConfig.globalNamespace}-comprehend-terms`,
      encryption: BucketEncryption.KMS,
      encryptionKey: mlResultsKey,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      serverAccessLogsBucket: coreStack.loggingBucket,
      serverAccessLogsPrefix: 'comprehend-terms/',
      removalPolicy,
      autoDeleteObjects: removalPolicy === RemovalPolicy.DESTROY,
      versioned: true,
    });

    const workflowDef = new WorkflowDefinition(this, {
      metadataS3Bucket: screeningStack.processedMetadataBucket,
      rawPdfS3Bucket: screeningStack.rawPdfBucket,
      processedPdfS3Bucket: screeningStack.processedPdfBucket,
      comprehendTermsBucket,
      screeningTable: screeningStack.screeningsTable.table,
      articleTable: screeningStack.articleTable.table,
      mlResultsBucket,
      namespace: coreConfig.globalNamespace,
      dbPrefix: coreConfig.dbPrefix,
      openSearchStack,
      accountId: coreConfig.awsAccountId,
    });

    const stateMachine = new StateMachine(this, 'MLProcess', {
      definition: workflowDef.stateMachine,
      role: workflowDef.stateMachineRole,
      timeout: Duration.days(1),
    });

    const screeningStreamSource = new DynamoEventSource(
      screeningStack.screeningsTable.table,
      {
        startingPosition: StartingPosition.LATEST,
        batchSize: 100,
        parallelizationFactor: 5,
        maxBatchingWindow: Duration.seconds(0),
        retryAttempts: 0,
      }
    );

    const screeningStreamerRole = new Role(this, 'ScreeningStreamerRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      inlinePolicies: {
        grantExecution: new PolicyDocument({
          statements: [
            new PolicyStatement({
              actions: ['states:StartExecution'],
              resources: [stateMachine.stateMachineArn],
            }),
          ],
        }),
      },
    });
    screeningStack.screeningsTable.table.grant(
      screeningStreamerRole,
      'dynamodb:ListShards'
    );
    screeningStack.screeningsTable.table.grantStreamRead(screeningStreamerRole);
    screeningStack.screeningsTable.table.grantReadData(screeningStreamerRole);
    new LambdaFunction(this, 'ScreeningStreamer', {
      functionName: `${coreConfig.namespace}-screeningStreamHandler`,
      description: 'Streams screening info from DDB to an ML workflow',
      runtime: Runtime.NODEJS_14_X,
      code: codeFromPkg('@aws-ee/backend-screening'),
      handler: 'index.screeningStreamHandler',
      events: [screeningStreamSource],
      timeout: Duration.minutes(5),
      role: screeningStreamerRole,
      environment: {
        STATE_MACHINE_ARN: stateMachine.stateMachineArn,
        APP_DB_PREFIX: coreConfig.dbPrefix,
      },
    });
  }
}
