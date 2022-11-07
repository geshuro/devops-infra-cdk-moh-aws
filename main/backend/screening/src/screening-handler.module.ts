import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { configEnvLoader } from '@aws-ee/common';
import { LoggerService } from '@aws-ee/core';

import { ScreeningConfig } from './config/screening.config';

const providers = [
  { provide: LoggerService, useValue: console }
];

@Global()
@Module({
  imports: [
    ConfigModule.forFeature(configEnvLoader(ScreeningConfig)),
  ],
  providers
})
export class ScreeningHandlerModule {}
