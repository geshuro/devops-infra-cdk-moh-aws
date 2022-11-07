import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CfnOutputStep, CoreConfig, InfoCommand } from '@aws-ee/core-infra';

@Injectable()
export class RestApiInfoSteps {
  constructor(infoCmd: InfoCommand, configService: ConfigService) {
    const coreConfig = configService.get<CoreConfig>(CoreConfig.KEY)!;
    new CfnOutputStep(infoCmd, {
      stackName: `${coreConfig.namespace}-api`,
      variableName: 'ApiUrl',
      description: 'API Endpoint',
    });
  }
}
