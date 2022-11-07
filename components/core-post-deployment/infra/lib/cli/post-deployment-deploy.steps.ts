import { DeployCommand, InvokeLambdaStep, CliPhaseName, CoreConfig } from '@aws-ee/core-infra';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PostDeploymentDeploySteps {
  constructor(deployCmd: DeployCommand, configService: ConfigService) {
    const coreConfig = configService.get<CoreConfig>(CoreConfig.KEY)!;

    new InvokeLambdaStep(deployCmd, {
      cliPhase: CliPhaseName.PostDeploy,
      lambdaName: `${coreConfig.namespace}-postDeployment`,
    });
  }
}
