import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configLoader } from '@aws-ee/common';

import { RestApiConfig } from '../config/rest-api-config';
import { RestApiInfoSteps } from './rest-api-info.steps';
import { CoreRestApiStageConfig } from '../config/rest-api-stage-config';
import { RestApiCliConfig } from '../config/rest-api-cli-config';

const providers = [RestApiInfoSteps];

interface ModuleProps {
  config: CoreRestApiStageConfig & RestApiCliConfig;
}

@Module({
  providers,
  exports: providers,
})
export class CoreRestApiCliModule {
  static with({ config }: ModuleProps): DynamicModule {
    return {
      module: CoreRestApiCliModule,
      imports: [
        ConfigModule.forFeature(configLoader(RestApiConfig, config as any)),
        ConfigModule.forFeature(configLoader(RestApiCliConfig, config)),
      ],
    };
  }
}
