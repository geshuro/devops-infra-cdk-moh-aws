/* eslint-disable no-console */
import chalk from 'chalk';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CdkBootstrapStep,
  Cli,
  CliCommand,
  CliPhaseName,
  CliRunStep,
  CoreInfraConfig,
  DeployStacksStep,
} from '@aws-ee/core-infra';
import { CoreCicdConfig } from '../config/cicd-config';

@Injectable()
export class DeployCicdCommand extends CliCommand {
  constructor(cli: Cli, configService: ConfigService) {
    super(cli, {
      name: 'deploy-cicd',
      description: 'Deploys the CICD pipeline',
    });
    const cliConfig = configService.get<CoreInfraConfig>(CoreInfraConfig.KEY)!;
    const config = configService.get<CoreCicdConfig>(CoreCicdConfig.KEY)!;

    new CdkBootstrapStep(this, {
      awsProfile: config.cicdAwsProfile,
      awsRegion: config.cicdAwsRegion,
      namespace: config.namespace,
      cloudFormationExecutionPolicyDoc: config.cloudFormationExecPolicy,
    });

    new DeployStacksStep(this, {
      cliPhase: CliPhaseName.Deploy,
      stackName: `${config.namespace}-cicd`,
      cwd: cliConfig.infraDir,
      awsProfile: config.cicdAwsProfile,
      awsRegion: config.cicdAwsRegion,
      namespace: config.namespace,
    });
  }

  async run(): Promise<void> {
    const steps = [...this.getSteps<CliRunStep>()].sort((a, b) => a.cliPhase - b.cliPhase);
    try {
      for (const [idx, step] of steps.entries()) {
        console.group(chalk.blueBright(`\n----- ⏳ Step ${idx + 1}/${steps.length} - ${step.info()} -----\n`));
        await step.run();
        console.groupEnd();
      }
    } catch (err) {
      console.log(chalk.redBright(`\n----- ❕ CICD DEPLOYMENT FAILED -----\n\n`));
      throw err;
    }
    console.log(chalk.greenBright(`\n----- ✅ CICD DEPLOYED SUCCESSFULLY -----\n\n`));
  }
}
