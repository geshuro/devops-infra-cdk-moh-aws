import { Provider, Module, DynamicModule, Global } from '@nestjs/common';

import { PostDeploymentStack } from './post-deployment.stack';
import { CorePostDeploymentAssets, corePostDeploymentAssetsProvider } from './core-post-deployment-assets.provider';

const providers: Provider[] = [PostDeploymentStack];

@Global()
@Module({
  providers,
  exports: providers,
})
export class CorePostDeploymentInfraModule {
  static with({ assets }: { assets: CorePostDeploymentAssets }): DynamicModule {
    return {
      module: CorePostDeploymentInfraModule,
      providers: [corePostDeploymentAssetsProvider(assets)],
    };
  }
}
