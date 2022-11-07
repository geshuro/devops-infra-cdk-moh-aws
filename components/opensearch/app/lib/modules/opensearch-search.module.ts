import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configEnvLoader } from '@aws-ee/common';
import { OpenSearchConfig } from '../config/opensearch-config';
import { OpenSearchClientService } from '../services/opensearch-client.service';
import { OpenSearchSearchService } from '../services/opensearch-search.service';

const providers = [OpenSearchClientService, OpenSearchSearchService];

/**
 * This module provides the service to perform searches.
 */
@Global()
@Module({
  imports: [ConfigModule.forFeature(configEnvLoader(OpenSearchConfig))],
  providers,
  exports: providers,
})
export class OpenSearchSearchModule {}
