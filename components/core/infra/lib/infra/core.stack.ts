import { Construct, RemovalPolicy } from '@aws-cdk/core';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Key } from '@aws-cdk/aws-kms';
import { PolicyStatement, ServicePrincipal } from '@aws-cdk/aws-iam';

import { Stack } from './util/ee-stack';
import { CoreStage } from './core-stage.provider';
import { CoreConfig } from '../config/core-config';
import { LoggingBucket } from './logging.bucket';
import { CloudwatchLambdaPolicy } from './util/cloudwatch-lambda.policy';

@Injectable()
export class CoreStack extends Stack {
  public readonly loggingBucket: LoggingBucket;
  public readonly cloudwatchLambdaPolicy: CloudwatchLambdaPolicy;
  public readonly dynamoDbKmsKey: Key;

  constructor(@Inject(CoreStage) stage: Construct, configService: ConfigService) {
    const coreConfig = configService.get<CoreConfig>(CoreConfig.KEY)!;
    super(stage, 'core', {
      description: 'Core resources',
      envName: coreConfig.envName,
      solutionName: coreConfig.solutionName,
    });

    const removalPolicy = coreConfig.isDevelopmentEnv ? RemovalPolicy.DESTROY : RemovalPolicy.RETAIN;

    this.dynamoDbKmsKey = new Key(this, 'DynamoDbKmsKey', {
      alias: `${coreConfig.namespace}-DynamoDbKey`,
      description: 'CMK to be applied to all DynamoDB tables',
      removalPolicy,
      enableKeyRotation: true,
    });

    this.dynamoDbKmsKey.addToResourcePolicy(
      new PolicyStatement({
        sid: 'Allow use of the key in DynamoDB tables',
        principals: [new ServicePrincipal('dynamodb.amazonaws.com')],
        actions: ['kms:Encrypt', 'kms:Decrypt', 'kms:ReEncrypt*', 'kms:GenerateDataKey*', 'kms:DescribeKey'],
        resources: ['*'],
      }),
    );

    this.loggingBucket = new LoggingBucket(this, {
      name: `${coreConfig.globalNamespace}-logs`,
      cloudTrailLogsBucketPrefix: 'cloudtrail-trails/',
      envType: coreConfig.envType,
    });

    this.cloudwatchLambdaPolicy = new CloudwatchLambdaPolicy(this, {
      envName: coreConfig.envName,
      service: coreConfig.service,
    });
  }
}
