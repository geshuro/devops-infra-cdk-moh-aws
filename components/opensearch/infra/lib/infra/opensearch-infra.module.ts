import { Module, DynamicModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configLoader } from '@aws-ee/common';

import { OpenSearchApiStageConfig } from '../config/opensearch-api-stage-config';
import { OpenSearchApiConfig } from '../config/opensearch-api-config';
import { OpenSearchStack } from './opensearch.stack';
import { BackendUpdates } from './backend.updates';

const providers = [OpenSearchStack, BackendUpdates];

interface ModuleProps {
  config: OpenSearchApiStageConfig;
}

@Module({ providers, exports: providers })
export class OpenSearchInfraModule {
  static with({ config }: ModuleProps): DynamicModule {
    return {
      module: OpenSearchInfraModule,
      imports: [ConfigModule.forFeature(configLoader(OpenSearchApiConfig, config))],
    };
  }
}
