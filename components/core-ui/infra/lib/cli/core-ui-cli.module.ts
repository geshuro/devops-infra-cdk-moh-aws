import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configLoader } from '@aws-ee/common';

import { UiDeploySteps } from './ui-deploy.steps';
import { UiCliConfig } from '../config/ui-cli-config';
import { UiInfoSteps } from './ui-info.steps';

const providers = [UiDeploySteps, UiInfoSteps];

interface ModuleProps {
  config: UiCliConfig;
}

@Module({
  providers,
  exports: providers,
})
export class CoreUiCliModule {
  static with({ config }: ModuleProps): DynamicModule {
    return {
      module: CoreUiCliModule,
      imports: [ConfigModule.forFeature(configLoader(UiCliConfig, config))],
    };
  }
}
