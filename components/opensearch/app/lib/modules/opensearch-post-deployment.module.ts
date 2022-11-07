import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configEnvLoader } from '@aws-ee/common';
import { OpenSearchConfig } from '../config/opensearch-config';
import { OpenSearchClientService } from '../services/opensearch-client.service';
import { OpenSearchIndexService } from '../services/opensearch-index.service';
import { CreateIndexes } from '../services/post-deployment-steps/create-indexes.service';

const steps = [CreateIndexes];

const providers = [...steps, OpenSearchClientService, OpenSearchIndexService];

/**
 * This module is meant to be plugged into post deployment.
 * It creates all indexes as per configuration.
 */
@Global()
@Module({
  imports: [ConfigModule.forFeature(configEnvLoader(OpenSearchConfig))],
  providers,
  exports: providers,
})
export class OpenSearchPostDeploymentModule {
  static steps = steps;
}
