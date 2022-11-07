/* eslint-disable no-console */
import chalk from 'chalk';

export const logger = {
  log: (msg: string): void => console.log(msg),
  info: (msg: string): void =>
    console.info(`${chalk.whiteBright.bgBlue(' ℹ ')} ${msg}`),
  error: (msg: string): void =>
    console.error(`${chalk.inverse.red(' ! ')} ${chalk.redBright(msg)}`),
  warn: (msg: string): void =>
    console.warn(`${chalk.inverse.yellowBright(' ⚠ ')} ${msg}`),
};
