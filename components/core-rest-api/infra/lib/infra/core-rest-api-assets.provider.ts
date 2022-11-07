import { Code } from '@aws-cdk/aws-lambda';
import { ValueProvider } from '@nestjs/common';

export const CoreRestApiAssets = Symbol('coreRestApiAssets');

export interface CoreRestApiAssets {
  apiHandler: Code;
}

export const coreRestApiAssetsProvider = (assets: CoreRestApiAssets): ValueProvider => ({
  provide: CoreRestApiAssets,
  useValue: assets,
});
