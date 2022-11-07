import { Global, Module, DynamicModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configLoader } from '@aws-ee/common';

import { Cli } from './cli';
import { CoreConfig } from '../config/core-config';
import { DeployCommand } from './deploy.command';
import { InfoCommand } from './info.command';
import { DeployBootstrapStep } from './deploy-bootstrap.step';
import { CoreStageConfig } from '../config/core-stage-config';
import { CoreInfraConfig } from '../config/core-infra-config';
import { EnvConfigBuilderService } from '../services/env-config-builder.service';
import { StackOutputService } from '../services/stack-output.service';
import { DestroyCommand } from './destroy.command';

const providers = [
  Cli,
  DeployCommand,
  DestroyCommand,
  InfoCommand,
  DeployBootstrapStep,
  EnvConfigBuilderService,
  StackOutputService,
];

interface ModuleProps {
  config: CoreStageConfig & CoreInfraConfig;
}

@Global()
@Module({
  imports: [],
  providers,
  exports: providers,
})
export class CoreCliModule {
  static with({ config }: ModuleProps): DynamicModule {
    return {
      module: CoreCliModule,
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [configLoader(CoreConfig, config as any), configLoader(CoreInfraConfig, config)],
        }),
      ],
    };
  }
}
