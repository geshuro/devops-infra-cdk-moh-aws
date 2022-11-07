import { Aspects, IConstruct } from '@aws-cdk/core';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CoreConfig } from '../config/core-config';
import * as aspects from './aspects';
import { CoreStage } from './core-stage.provider';

/**
 * Utility class that attaches aspects in the `CoreStage` construct.
 */
@Injectable()
export class AspectAttacher {
  constructor(@Inject(CoreStage) stage: IConstruct, configService: ConfigService) {
    const coreConfig = configService.get<CoreConfig>(CoreConfig.KEY)!;

    const container = Aspects.of(stage);
    [
      new aspects.ApiLoggingChecker(),
      new aspects.S3Rules({
        isDevelopmentEnv: coreConfig.isDevelopmentEnv,
      }),
      new aspects.DistributionWebAclChecker(),
      new aspects.KmsKeyRotationChecker(),
      new aspects.StateMachineLoggingChecker(),
      new aspects.UserPoolPasswordPolicyChecker(),
      new aspects.StackClassChecker(),
      new aspects.OpenSearchRules({
        isDevelopmentEnv: coreConfig.isDevelopmentEnv,
      }),
      new aspects.DynamoDbRules(),
    ].forEach((aspect) => container.add(aspect));
  }
}
