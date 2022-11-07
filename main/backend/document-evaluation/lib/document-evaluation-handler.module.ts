import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { configEnvLoader } from '@aws-ee/common';
import { LoggerService } from '@aws-ee/core';

import { DocumentEvaluationConfig } from './config/document-evaluation.config';
import { ComprehendService } from './services/comprehend.service';

const providers = [
  ComprehendService,
  { provide: LoggerService, useValue: console }
];

@Global()
@Module({
  imports: [
    ConfigModule.forFeature(configEnvLoader(DocumentEvaluationConfig)),
  ],
  providers
})
export class DocumentEvaluationModule {}
