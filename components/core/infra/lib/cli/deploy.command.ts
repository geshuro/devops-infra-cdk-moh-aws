/* eslint-disable no-console */
import chalk from 'chalk';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { logger } from '@aws-ee/common';

import { CliRunStep } from './run/cli-run.step';
import { Cli } from './cli';
import { CliCommand } from './cli.command';
import { InfoCommand } from './info.command';
import { NpmScriptStep } from './run/npm-script.step';
import { CliPhaseName } from './cli-phases';
import { DeployStacksStep } from './run/deploy-stacks.step';
import { CoreConfig } from '../config/core-config';
import { CoreInfraConfig } from '../config/core-infra-config';
import { StackOutputService } from '../services/stack-output.service';

@Injectable()
export class DeployCommand extends CliCommand {
  constructor(
    cli: Cli,
    private readonly infoCommand: InfoCommand,
    configService: ConfigService,
    private readonly stackOutputService: StackOutputService,
  ) {
    super(cli, {
      name: ['deploy-solution', 'deploy'],
      description: 'Deploys the entire solution',
    });

    const config = {
      core: configService.get<CoreConfig>(CoreConfig.KEY)!,
      cli: configService.get<CoreInfraConfig>(CoreInfraConfig.KEY)!,
    };

    new NpmScriptStep(this, {
      cliPhase: CliPhaseName.PreBuild,
      description: 'Building',
      scriptName: 'build',
      cwd: '.',
      args: ['-r'],
    });

    new NpmScriptStep(this, {
      cliPhase: CliPhaseName.Build,
      description: 'Bundling',
      scriptName: 'bundle',
      cwd: '.',
      args: ['-r'],
    });

    new DeployStacksStep(this, {
      cliPhase: CliPhaseName.Deploy,
      stackName: `${config.core.namespace}/*`,
      cwd: config.cli.infraDir,
      awsProfile: config.core.awsProfile,
      awsRegion: config.core.awsRegion,
      namespace: config.core.namespace,
      hotswap: config.core.isDevelopmentEnv,
    });
  }

  async run(options?: unknown): Promise<void> {
    let beforeSnapshot: string;
    let afterSnapshot: string;
    let deploymentAttempts = 0;
    do {
      // Take snapshot of the stack output before deployment. It may be empty on the first deploy
      beforeSnapshot = this.stackOutputService.getSnapshot();

      await this.deployAll(options);

      afterSnapshot = this.stackOutputService.getSnapshot();

      // The stack output drives some configuration files that are ultimately baked into the code.
      // This means if the stack output has changed, a re-deploy is needed.
      if (beforeSnapshot !== afterSnapshot) {
        // eslint-disable-next-line no-plusplus
        if (++deploymentAttempts > 5) {
          console.log(
            chalk.redBright(
              `\n----- ❕ THE DEPLOYMENT IS NOT STABILIZING [${chalk.blueBright(process.env.STAGE)}] -----\n\n`,
            ),
          );
          throw new Error();
        } else {
          logger.info(`Configuration change detected after deployment. Redeploying (${deploymentAttempts}/5)...`);
        }
      }
    } while (beforeSnapshot !== afterSnapshot);

    console.log(
      chalk.greenBright(
        `\n----- ✅ ENVIRONMENT [${chalk.blueBright(process.env.STAGE)}] DEPLOYED SUCCESSFULLY -----\n\n`,
      ),
    );

    await this.infoCommand.run();
  }

  async deployAll(options?: unknown): Promise<void> {
    const steps = [...this.getSteps<CliRunStep>()].sort((a, b) => a.cliPhase - b.cliPhase);
    try {
      for (const [idx, step] of steps.entries()) {
        console.group(chalk.blueBright(`\n----- ⏳ Step ${idx + 1}/${steps.length} - ${step.info()} -----\n`));
        await step.run(options);
        console.groupEnd();
      }
    } catch (err) {
      console.log(
        chalk.redBright(
          `\n----- ❕ DEPLOYMENT FAILED FOR ENVIRONMENT [${chalk.blueBright(process.env.STAGE)}] -----\n\n`,
        ),
      );
      throw err;
    }
  }
}
