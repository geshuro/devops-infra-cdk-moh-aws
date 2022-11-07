import { Global, Module, DynamicModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configLoader } from '@aws-ee/common';
import { CoreStageConfig } from '@aws-ee/core-infra';
import { CicdDeploySolutionSteps } from './cicd-deploy-solution.steps';
import { DeployCicdCommand } from './deploy-cicd.command';
import { CoreCicdConfig } from '../config/cicd-config';
import { CoreCicdStageConfig } from '../config/cicd-stage-config';

const providers = [CicdDeploySolutionSteps, DeployCicdCommand];

interface ModuleProps {
  config: CoreCicdStageConfig & CoreStageConfig;
}

@Global()
@Module({
  providers,
  exports: providers,
})
export class CoreCicdCliModule {
  static with({ config }: ModuleProps): DynamicModule {
    return {
      module: CoreCicdCliModule,
      imports: [ConfigModule.forFeature(configLoader(CoreCicdConfig, config))],
    };
  }
}
