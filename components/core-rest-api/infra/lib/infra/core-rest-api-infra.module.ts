import { Provider, Module, DynamicModule, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configLoader } from '@aws-ee/common';
import { CoreStageConfig } from '@aws-ee/core-infra';

import { ApiStack } from './api.stack';
import { RestApiConfig } from '../config/rest-api-config';
import { CoreRestApiAssets, coreRestApiAssetsProvider } from './core-rest-api-assets.provider';
import { PostDeploymentUpdates } from './post-deployment.updates';
import { CoreRestApiStageConfig } from '../config/rest-api-stage-config';

const providers: Provider[] = [ApiStack, PostDeploymentUpdates];

interface ModuleProps {
  config: CoreRestApiStageConfig & CoreStageConfig;
  assets: CoreRestApiAssets;
}

@Global()
@Module({
  providers,
  exports: providers,
})
export class CoreRestApiInfraModule {
  static with({ config, assets }: ModuleProps): DynamicModule {
    return {
      module: CoreRestApiInfraModule,
      imports: [ConfigModule.forFeature(configLoader(RestApiConfig, config))],
      providers: [coreRestApiAssetsProvider(assets)],
    };
  }
}
