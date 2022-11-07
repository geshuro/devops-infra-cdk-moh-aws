import type { ISource } from '@aws-cdk/aws-s3-deployment';
import { ValueProvider } from '@nestjs/common';

export const CoreUiAssets = Symbol('coreUiAssets');

export interface CoreUiAssets {
  web: ISource;
}

export const coreUiAssetsProvider = (assets: CoreUiAssets): ValueProvider => ({
  provide: CoreUiAssets,
  useValue: assets,
});
