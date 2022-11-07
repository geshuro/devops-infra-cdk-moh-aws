import { Global, DynamicModule, Module } from '@nestjs/common';
import { configLoader } from '@aws-ee/common';
import { ConfigModule } from '@nestjs/config';

import { PostDeploymentCliConfig } from '../config/post-deployment-cli-config';
import { PostDeploymentDeploySteps } from './post-deployment-deploy.steps';

const providers = [PostDeploymentDeploySteps];

interface ModuleProps {
  config: PostDeploymentCliConfig;
}

@Global()
@Module({
  providers,
  exports: providers,
})
export class CorePostDeploymentCliModule {
  static with({ config }: ModuleProps): DynamicModule {
    return {
      module: CorePostDeploymentCliModule,
      imports: [ConfigModule.forFeature(configLoader(PostDeploymentCliConfig, config))],
    };
  }
}
