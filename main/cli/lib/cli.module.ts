import 'regenerator-runtime';
import * as path from 'path';
import { DynamicModule, Module } from '@nestjs/common';
import { CoreCliModule } from '@aws-ee/core-infra';
import { CorePostDeploymentCliModule } from '@aws-ee/core-post-deployment-infra';
import { CoreRestApiCliModule } from '@aws-ee/core-rest-api-infra';
import { CoreUiCliModule } from '@aws-ee/core-ui-infra';

const infraConfig = {
  apiLambdaDir: path.dirname(require.resolve('@aws-ee/backend-api')),
  postDeploymentLambdaDir: path.dirname(require.resolve('@aws-ee/backend-post-deployment')),
  uiDir: path.join(path.dirname(require.resolve('@aws-ee/ui')), '..'),
  infraDir: path.join(path.dirname(require.resolve('@aws-ee/infrastructure')), '..'),
};

interface ModuleProps {
  stageConfig: any;
}

@Module({})
export class CliModule {
  static with({ stageConfig }: ModuleProps): DynamicModule {
    const configAndAssets = { config: { ...stageConfig, ...infraConfig } };
    return {
      module: CliModule,
      imports: [
        CoreCliModule.with(configAndAssets),
        CorePostDeploymentCliModule.with(configAndAssets),
        CoreRestApiCliModule.with(configAndAssets),
        CoreUiCliModule.with(configAndAssets),
      ],
    };
  }
}
