import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { configEnvLoader } from '@aws-ee/common';
import { LoggerService } from '@aws-ee/core';
import { BackendCommonModule } from '@aws-ee/backend-common';

import { ScreeningInputConfig } from './config/screening-input.config';
import { ScreeningInputService } from './services/screening-input.service';

const providers = [ScreeningInputService, { provide: LoggerService, useValue: console }];

@Global()
@Module({
  imports: [ConfigModule.forFeature(configEnvLoader(ScreeningInputConfig)), BackendCommonModule],
  providers,
  exports: [...providers],
})
export class ScreeningInputModule {}
