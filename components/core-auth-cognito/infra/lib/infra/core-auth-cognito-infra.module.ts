import { Provider, Module, DynamicModule, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configLoader } from '@aws-ee/common';
import { CoreStageConfig } from '@aws-ee/core-infra';

import { CognitoInfra } from './cognito.infra';
import { CognitoConfig } from '../config/cognito-config';
import { PostDeploymentUpdates } from './post-deployment.updates';
import { CoreAuthCognitoStageConfig } from '../config/cognito-stage-config';

const providers: Provider[] = [CognitoInfra, PostDeploymentUpdates];

interface ModuleProps {
  config: CoreAuthCognitoStageConfig & CoreStageConfig;
}

@Global()
@Module({
  providers,
  exports: providers,
})
export class CoreAuthCognitoInfraModule {
  static with({ config }: ModuleProps): DynamicModule {
    return {
      module: CoreAuthCognitoInfraModule,
      imports: [ConfigModule.forFeature(configLoader(CognitoConfig, config))],
    };
  }
}
