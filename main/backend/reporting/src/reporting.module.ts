import { DynamooseModule } from 'nestjs-dynamoose';
import { Module, Global } from '@nestjs/common';

import { configDbPrefixLoader } from '@aws-ee/common';
import { LoggerService } from '@aws-ee/core';
import { ArticleDbService, ArticleModelDefinition, BackendCommonModule, StatusPusherService } from '@aws-ee/backend-common';

const providers = [
  ArticleDbService,
  StatusPusherService,
  { provide: LoggerService, useValue: console },
];

const dbModels = [ArticleModelDefinition];

@Global()
@Module({
  imports: [
    DynamooseModule.forRoot({ model: { create: false, prefix: configDbPrefixLoader() } }),
    DynamooseModule.forFeature(dbModels),
    BackendCommonModule
  ],
  providers,
})
export class ReportingModule {}
