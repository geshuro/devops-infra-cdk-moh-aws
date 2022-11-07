import { Provider, Module, DynamicModule, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configLoader, convertConfig } from '@aws-ee/common';

import { UiStack } from './ui.stack';
import { CoreUiAssets, coreUiAssetsProvider } from './core-ui-assets.provider';
import { UiConfig } from '../config/ui-config';
import { WafStack } from './waf.stack';
import { HostingType } from '../config/ui-stage-config';

const providers: Provider[] = [UiStack];

@Global()
@Module({
  providers,
  exports: providers,
})
export class CoreUiInfraModule {
  static with({ config, assets }: { config: UiConfig; assets: CoreUiAssets }): DynamicModule {
    const isPublicHosting = convertConfig(UiConfig, config).uiHostingType === HostingType.CloudFront;
    return {
      module: CoreUiInfraModule,
      imports: [ConfigModule.forFeature(configLoader(UiConfig, config))],
      providers: [coreUiAssetsProvider(assets), ...(isPublicHosting ? [WafStack] : [])],
    };
  }
}
