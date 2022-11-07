import 'regenerator-runtime';
import { NestFactory } from '@nestjs/core';
import type { LogLevel } from '@nestjs/common';

import { InfrastructureModule } from './infrastructure.module';

const nestOptions: { logger: LogLevel[] } = process.env.VERBOSE
  ? {
      logger: ['verbose', 'warn', 'log', 'error', 'debug'],
    }
  : { logger: ['warn', 'error'] };

NestFactory.createApplicationContext(InfrastructureModule, nestOptions);
