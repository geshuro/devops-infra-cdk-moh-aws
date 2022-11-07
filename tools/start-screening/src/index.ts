/* eslint-disable import/first */
process.env.APP_DB_PREFIX = 'placeholder';
process.env.APP_ALERTS_TOPIC_ARN = 'placeholder';

import 'regenerator-runtime/runtime';
import { NestFactory } from '@nestjs/core';

import { ImportModule } from './import.module';
import { ImportService } from './services/import.service';

async function main() {
  const ctx = await NestFactory.createApplicationContext(ImportModule);

  const importService = ctx.get(ImportService);
  await importService.run();
}

main();
