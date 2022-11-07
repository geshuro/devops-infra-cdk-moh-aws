import { Code } from '@aws-cdk/aws-lambda';
import { ValueProvider } from '@nestjs/common';

export const CorePostDeploymentAssets = Symbol('corePostDeploymentAssets');

export interface CorePostDeploymentAssets {
  postDeploymentHandler: Code;
}

export const corePostDeploymentAssetsProvider = (assets: CorePostDeploymentAssets): ValueProvider => ({
  provide: CorePostDeploymentAssets,
  useValue: assets,
});
