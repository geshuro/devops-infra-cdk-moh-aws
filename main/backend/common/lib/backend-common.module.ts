import { Module, Global } from '@nestjs/common';
import { DynamooseModule } from 'nestjs-dynamoose';
import { ConfigModule } from '@nestjs/config';

import { AuthorizationProvider, LoggerService } from '@aws-ee/core';
import { configDbPrefixLoader, configEnvLoader } from '@aws-ee/common';
import { OpenSearchDomainIndexProvider, OpenSearchDocumentModule } from '@aws-ee/opensearch-api';

import { AuthorizationProviderService } from './services/authorization-provider.service';
import { consoleLoggerInstance } from './services/console-logger.service';
import { ScreeningModelDefinition } from './db/screening.schema';
import { ArticleModelDefinition } from './db/article.schema';
import { OpenSearchDomainIndexProviderService } from './services/opensearch-index-provider.service';
import { ScreeningDbService } from './services/screening-db.service';
import { ArticleDbService } from './services/article-db.service';
import { CommonConfig } from './config/common.config';
import { StatusPusherService } from './services/status-pusher.service';

const providers = [
  { provide: AuthorizationProvider, useClass: AuthorizationProviderService },
  { provide: LoggerService, useValue: consoleLoggerInstance },
  { provide: OpenSearchDomainIndexProvider, useClass: OpenSearchDomainIndexProviderService },
  ScreeningDbService,
  ArticleDbService,
  StatusPusherService
];

const dbModels = [ScreeningModelDefinition, ArticleModelDefinition];

@Global()
@Module({
  imports: [
    DynamooseModule.forRoot({ model: { create: false, prefix: configDbPrefixLoader() } }),
    DynamooseModule.forFeature(dbModels),
    ConfigModule.forFeature(configEnvLoader(CommonConfig)),
    OpenSearchDocumentModule,
  ],
  providers,
  exports: providers,
})
export class BackendCommonModule {}
