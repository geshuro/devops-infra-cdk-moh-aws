import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configLoader } from '@aws-ee/common';

import { AspectAttacher } from './core-aspects.provider';
import { CoreConfig } from '../config/core-config';
import { CoreInfraConfig } from '../config/core-infra-config';
import { StackOutputService } from '../services/stack-output.service';
import { CoreStack } from './core.stack';
import { AuthStack } from './auth/auth.stack';

const providers = [AspectAttacher, StackOutputService, CoreStack, AuthStack];

interface ModuleProps {
  config: CoreConfig & CoreInfraConfig;
}

@Global()
@Module({
  providers,
  exports: providers,
})
export class CoreInfraModule {
  static with({ config }: ModuleProps): DynamicModule {
    return {
      module: CoreInfraModule,
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [configLoader(CoreConfig, config as any), configLoader(CoreInfraConfig, config)],
        }),
      ],
    };
  }
}
