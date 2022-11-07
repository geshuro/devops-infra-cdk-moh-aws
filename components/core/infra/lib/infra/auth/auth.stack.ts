import { Construct } from '@aws-cdk/core';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { CoreStage } from '../core-stage.provider';
import { CoreConfig } from '../../config/core-config';
import { Stack } from '../util/ee-stack';

@Injectable()
export class AuthStack extends Stack {
  constructor(@Inject(CoreStage) stage: Construct, configService: ConfigService) {
    const coreConfig = configService.get<CoreConfig>(CoreConfig.KEY)!;
    super(stage, 'auth', {
      description: 'Authentication resources',
      envName: coreConfig.envName,
      solutionName: coreConfig.solutionName,
    });
  }
}
