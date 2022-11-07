import { Module, DynamicModule, Global, Provider } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MainVpc } from '@aws-ee/core-infra';
import { configLoader } from '@aws-ee/common';
import { VpcMode, VpcStageConfig } from '../config/vpc-stage-config';
import { VpcConfig } from '../config/vpc-config';
import { DefaultVpc } from './default.vpc';

interface ModuleProps {
  config: VpcStageConfig;
}

@Global()
@Module({})
export class VpcInfraModule {
  static with({ config }: ModuleProps): DynamicModule {
    let providers: Provider[] = [];
    if ([VpcMode.Import, VpcMode.Create].includes(config.vpcMode)) {
      // Only inject the main vpc into the container when the mode is either create or import (i.e., not None)
      providers = [{ provide: MainVpc, useClass: DefaultVpc }];
    }
    return {
      module: VpcInfraModule,
      imports: [ConfigModule.forFeature(configLoader(VpcConfig, config))],
      providers,
      exports: providers,
    };
  }
}
