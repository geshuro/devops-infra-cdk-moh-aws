import * as path from 'path';
import { Global, Module, Provider } from '@nestjs/common';
import { App, Stage } from '@aws-cdk/core';
import { appProvider, CoreInfraModule, stageProvider, CoreConfig } from '@aws-ee/core-infra';
import { VpcInfraModule } from '@aws-ee/vpc-infra';
import { CoreRestApiInfraModule } from '@aws-ee/core-rest-api-infra';
import { CoreUiInfraModule } from '@aws-ee/core-ui-infra';
import { CorePostDeploymentInfraModule } from '@aws-ee/core-post-deployment-infra';
import { CoreAuthCognitoInfraModule } from '@aws-ee/core-auth-cognito-infra';
import { convertConfig } from '@aws-ee/common';
import { getStageConfig } from '@aws-ee/config';
import { OpenSearchInfraModule } from '@aws-ee/opensearch-api-infra';
import { codeFromPkg, sourceFromPkg } from './utils/path-utils';

import { DummyDataStack } from './dummy-data/dummy-data.stack';
import { ScreeningStack } from './screening/screening.stack';
import { MLProcessingStack } from './ml-processing/ml-processing.stack';

// Root App object
const app = new App();

// Construct the stage
const stageConfig = getStageConfig();
const convertedConfig = convertConfig<CoreConfig>(CoreConfig, stageConfig);
const stage = new Stage(app, convertedConfig.namespace);
const providers: Provider[] = [appProvider(app), stageProvider(stage), ScreeningStack, MLProcessingStack, DummyDataStack];

const infraConfig = {
  infraDir: path.join(__dirname, '..'),
};

const configAndAssets = {
  config: { ...stageConfig, ...infraConfig },
  assets: {
    apiHandler: codeFromPkg('@aws-ee/backend-api'),
    postDeploymentHandler: codeFromPkg('@aws-ee/backend-post-deployment'),
    signUpConfirmationHandler: codeFromPkg('@aws-ee/signup-confirmation'),
    web: sourceFromPkg('@aws-ee/ui'),
  },
};

@Global()
@Module({
  imports: [
    CoreInfraModule.with(configAndAssets),
    VpcInfraModule.with(configAndAssets),
    CoreRestApiInfraModule.with(configAndAssets),
    CoreUiInfraModule.with(configAndAssets),
    CorePostDeploymentInfraModule.with(configAndAssets),
    CoreAuthCognitoInfraModule.with(configAndAssets),
    OpenSearchInfraModule.with(configAndAssets),
  ],
  providers,
  exports: providers,
})
export class InfrastructureModule {}
