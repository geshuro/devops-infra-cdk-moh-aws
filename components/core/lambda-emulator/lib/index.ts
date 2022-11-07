#!/usr/bin/env ts-node-transpile-only

import path from 'path';
import dotenv from 'dotenv';
import spawn from 'cross-spawn';
import minimist from 'minimist';
import { renderEnvironment } from './render-environment';

const argv = minimist(process.argv.slice(2));

function printHelp() {
  console.log(
    [
      'Usage: lambda-emulator [--help] [-e <path>] [-- command]',
      '  --help              print help',
      '  -e <env>            Environment settings file (dotenv format)',
      '  command             `command` is the actual command you want to run. Precede this command with ` -- `. Everything after `--` is considered to be your command.',
    ].join('\n'),
  );
}

if (argv.help) {
  printHelp();
  process.exit();
}

if (argv.e) {
  const envFile = path.join(process.cwd(), argv.e);
  dotenv.config({ path: envFile });
}

const awsRegion = process.env.AWS_REGION!;
const awsProfile = process.env.AWS_PROFILE!;
const lambdaName = process.env.AWS_LAMBDA_NAME!;

if (!awsRegion || !awsProfile || !lambdaName) {
  console.log(
    [
      'The following variables must be supplied either by an .env file or via the global env:',
      '  AWS_REGION        The region where the lambda is deployed',
      '  AWS_PROFILE       The profile to use to get information about the lambda',
      '  AWS_LAMBDA_NAME   The name of the deployed lambda',
    ].join('\n'),
  );
  process.exit(1);
}

const command = argv._[0];
if (!command) {
  printHelp();
  process.exit(1);
}

async function main() {
  const env = await renderEnvironment({ awsRegion, awsProfile, lambdaName });
  console.info(
    '\n ℹ The current session credentials last for one hour. You will have to restart the emulator to get new credentials after that time.',
  );
  spawn(command, argv._.slice(1), { stdio: 'inherit', env }).on('exit', (exitCode: number) => {
    process.exit(exitCode);
  });
}

main();
