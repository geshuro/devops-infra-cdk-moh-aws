import { Inject, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Construct } from '@aws-cdk/core';
import { CoreStage, CoreConfig, MainVpc, Stack, CoreStack } from '@aws-ee/core-infra';

import { PostDeploymentTables } from './post-deployment.tables';
import { CorePostDeploymentAssets } from './core-post-deployment-assets.provider';
import { PostDeploymentLambda } from './post-deployment.lambda';

export class PostDeploymentStack extends Stack {
  public readonly tables: PostDeploymentTables;
  public readonly postDeploymentLambda: PostDeploymentLambda;

  constructor(
    configService: ConfigService,
    @Inject(CoreStage) stage: Construct,
    coreStack: CoreStack,
    @Optional() @Inject(MainVpc) mainVpc: MainVpc,
    @Inject(CorePostDeploymentAssets) postDeploymentAssets: CorePostDeploymentAssets,
  ) {
    const coreConfig = configService.get<CoreConfig>(CoreConfig.KEY)!;
    super(stage, 'postDeployment', {
      description: 'Contains a Lambda function that is executed after each deployment',
      envName: coreConfig.envName,
      solutionName: coreConfig.solutionName,
    });

    this.tables = new PostDeploymentTables(this, {
      dbDeploymentStore: `${coreConfig.dbPrefix}-DeploymentStore`,
      dynamoDbKmsKey: coreStack.dynamoDbKmsKey,
      isDevelopmentEnv: coreConfig.isDevelopmentEnv,
    });

    this.postDeploymentLambda = new PostDeploymentLambda(this, {
      postDeploymentHandler: postDeploymentAssets.postDeploymentHandler,
      cwlLambdaPolicy: coreStack.cloudwatchLambdaPolicy,
      dbPrefix: coreConfig.dbPrefix,
      namespace: coreConfig.namespace,
      loggingBucketName: `${coreConfig.globalNamespace}-logging`,
      mainVpc,
    });

    this.tables.grantReadWriteData(this.postDeploymentLambda);
  }
}
