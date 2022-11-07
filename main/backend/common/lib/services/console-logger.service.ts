import winston from 'winston';
import { LambdaConsoleTransport } from '@aws-ee/core';

export const consoleLoggerInstance = winston.createLogger({
  level: 'info',
  levels: winston.config.npm.levels,
  transports: [new LambdaConsoleTransport()],
});
