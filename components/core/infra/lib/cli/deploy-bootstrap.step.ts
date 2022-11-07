import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { CoreInfraConfig } from '../config/core-infra-config';
import { CoreConfig } from '../config/core-config';
import { DeployCommand } from './deploy.command';
import { CdkBootstrapStep } from './run/cdk-bootstrap.step';

@Injectable()
export class DeployBootstrapStep extends CdkBootstrapStep {
  constructor(deployCmd: DeployCommand, configService: ConfigService) {
    const config = configService.get<CoreConfig>(CoreConfig.KEY)!;
    const cliConfig = configService.get<CoreInfraConfig>(CoreInfraConfig.KEY)!;
    super(deployCmd, {
      awsRegion: config.awsRegion,
      awsProfile: config.awsProfile,
      namespace: config.namespace,
      envName: config.envName,
      solutionName: config.solutionName,
      cloudFormationExecutionPolicyDoc: config.cloudFormationExecPolicy,
      cwd: cliConfig.infraDir,
    });
  }

  info(): string {
    return 'Bootstrap Deployment Account';
  }
}
