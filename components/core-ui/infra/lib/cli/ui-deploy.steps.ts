import * as path from 'path';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeployCommand, CustomStep, CliPhaseName, EnvConfigBuilderService } from '@aws-ee/core-infra';
import { logger } from '@aws-ee/common';

import { UiCliConfig } from '../config/ui-cli-config';

@Injectable()
export class UiDeploySteps {
  private config: { uiCli: UiCliConfig };

  constructor(
    deployCmd: DeployCommand,
    configService: ConfigService,
    private readonly envConfigBuilderService: EnvConfigBuilderService,
  ) {
    this.config = {
      uiCli: configService.get<UiCliConfig>(UiCliConfig.KEY)!,
    };

    new CustomStep(deployCmd, {
      cliPhase: CliPhaseName.PreBuild,
      description: 'Generate UI configuration',
      run: async () => {
        this.envConfigBuilderService.buildConfig({
          templateFileName: path.join(this.config.uiCli.uiDir, '.env.production.hbs'),
        });
        logger.info('Configuration created successfully.');
      },
    });
  }
}
