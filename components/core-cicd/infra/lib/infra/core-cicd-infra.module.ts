import { CoreStageConfig } from '@aws-ee/core-infra';
import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configLoader } from '@aws-ee/common';

import { CicdStack } from './cicd.stack';
import { CoreCicdConfig } from '../config/cicd-config';
import { CoreCicdStageConfig } from '../config/cicd-stage-config';

const providers = [CicdStack];

interface ModuleProps {
  config: CoreCicdStageConfig & CoreStageConfig;
}

@Global()
@Module({
  providers,
  exports: providers,
})
export class CoreCicdInfraModule {
  static with({ config }: ModuleProps): DynamicModule {
    return {
      module: CoreCicdInfraModule,
      imports: [ConfigModule.forFeature(configLoader(CoreCicdConfig, config))],
    };
  }
}
