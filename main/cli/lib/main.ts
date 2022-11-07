import 'regenerator-runtime/runtime';
import yargs from 'yargs/yargs';
import { NestFactory } from '@nestjs/core';
import { logger } from '@aws-ee/common';

import { Cli } from '@aws-ee/core-infra';

import { CliModule } from './cli.module';
import { loadStage } from './load-stage';
import { setVerbosity } from './set-verbosity';
import { firstString } from './util/first-string';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { hideBin } = require('yargs/helpers');

async function main() {
  let app = yargs(hideBin(process.argv)).scriptName('cli').exitProcess(false);
  const stageConfig = await loadStage((app.argv.stage as string) || (app.argv.s as string));
  const verbose = setVerbosity(app.argv.verbose as boolean);
  const ctx = await NestFactory.createApplicationContext(
    CliModule.with({ stageConfig }),
    verbose ? undefined : { logger: ['error'] },
  );

  // get all commands from the DI container
  const commands = ctx
    .get(Cli)
    .commands()
    .sort((a, b) => firstString(a.name).localeCompare(firstString(b.name))); // sort alphabetically

  // wire commands into yargs
  app = commands.reduce(
    (prev, cmd) =>
      prev.command(
        cmd.name,
        cmd.description,
        (yargsParam) => cmd.options().reduce((prm, opt) => prm.option(opt.key, opt.config as any), yargsParam),
        async (options) => {
          try {
            await cmd.run(options);
          } catch (err) {
            logger.error(err as string);
            process.exit(1);
          }
        },
      ),
    app,
  );

  return app
    .demandCommand()
    .option('stage', {
      alias: 's',
      desc: 'The deployment stage, defaults to the current user name',
    })
    .option('verbose', {
      desc: 'Additional output for debugging purposes',
      boolean: true,
    })
    .strict().argv;
}

main().catch((e) => console.error(e));
