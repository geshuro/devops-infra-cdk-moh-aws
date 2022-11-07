import _ from 'lodash';
import chalk from 'chalk';
import spawn from 'cross-spawn';
import { logger } from '@aws-ee/common';

// to help avoid unleashing Zalgo see http://blog.izs.me/post/59142742143/designing-apis-for-asynchrony
const callLater = (callback: any, ...args: any[]) => {
  setImmediate(() => {
    callback(...args);
  });
};

export const runCommand = ({
  command,
  args,
  successCodes = [0],
  cwd,
  env = {},
  stdout = logger,
  stdio = 'inherit',
}: {
  command: string;
  args: string[];
  successCodes?: number[];
  cwd: string;
  env?: Record<string, string>;
  stdout?: any;
  stdio?: any;
}) => {
  stdout.log(
    `${chalk.green('CWD:')} ${chalk.cyan(cwd)}\n${chalk.green('Running:')} ${chalk.cyan(
      `${command} ${args.join(' ')}`,
    )}`,
  );
  const child = spawn(command, args, { stdio, env: { ...process.env, ...env }, cwd });

  process.once('SIGINT', () => {
    stdout.log(chalk.yellow('Interrupt received, stopping child process'));
    child.kill('SIGINT');
    process.exit(1);
  });

  return new Promise((resolve, reject) => {
    // we are using _.once() because the error and exit events might be fired one after the other
    // see https://nodejs.org/api/child_process.html#child_process_event_error
    const rejectOnce = _.once(reject);
    const resolveOnce = _.once(resolve);
    const errors: string[] = [];

    if (child.stdout) {
      child.stdout.on('data', (data) => {
        stdout.log(data);
      });
    }
    if (child.stderr) {
      child.stderr.on('data', (data) => {
        errors.push(data.toString().trim());
      });
    }
    child.on('exit', (code) => {
      if (successCodes.includes(code || 0)) {
        callLater(resolveOnce);
      } else {
        callLater(rejectOnce, new Error(`process exited with code ${code}: ${errors.join('\n')}`));
      }
    });
    child.on('error', () => callLater(rejectOnce, new Error('Failed to start child process.')));
  });
};
