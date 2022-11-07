/* eslint-disable no-console */
import chalk from 'chalk';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { CliRunStep } from './run/cli-run.step';
import { Cli } from './cli';
import { CliCommand } from './cli.command';
import { CliPhaseName } from './cli-phases';
import { CoreConfig } from '../config/core-config';
import { CoreInfraConfig } from '../config/core-infra-config';
import { DestroyStacksStep } from './run/destroy-stacks.step';

@Injectable()
export class DestroyCommand extends CliCommand {
  constructor(cli: Cli, configService: ConfigService) {
    super(cli, {
      name: 'destroy-solution',
      description: 'Destroys the entire solution',
    });

    const config = {
      core: configService.get<CoreConfig>(CoreConfig.KEY)!,
      cli: configService.get<CoreInfraConfig>(CoreInfraConfig.KEY)!,
    };

    new DestroyStacksStep(this, {
      cliPhase: CliPhaseName.Deploy,
      stackName: `${config.core.namespace}/*`,
      cwd: config.cli.infraDir,
      awsProfile: config.core.awsProfile,
      awsRegion: config.core.awsRegion,
    });
  }

  async run(options?: unknown): Promise<void> {
    await this.deployAll(options);
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
          `\n----- ❕ DESTROYING FAILED FOR ENVIRONMENT [${chalk.blueBright(process.env.STAGE)}] -----\n\n`,
        ),
      );
      throw err;
    }
    console.log(
      chalk.greenBright(`\n----- ✅ ENVIRONMENT [${chalk.blueBright(process.env.STAGE)}] DESTROYED 🔥🔥🔥 -----\n\n`),
    );
  }
}
