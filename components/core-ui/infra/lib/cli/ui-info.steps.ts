import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CfnOutputStep, CoreConfig, InfoCommand } from '@aws-ee/core-infra';

@Injectable()
export class UiInfoSteps {
  constructor(infoCmd: InfoCommand, configService: ConfigService) {
    const config = configService.get<CoreConfig>('core')!;
    new CfnOutputStep(infoCmd, {
      stackName: `${config.namespace}-api`,
      variableName: 'WebsiteUrl',
      description: 'Website URL',
    });
  }
}
