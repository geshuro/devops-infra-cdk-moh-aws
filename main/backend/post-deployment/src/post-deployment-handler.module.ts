import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { CorePostDeploymentModule } from '@aws-ee/core-post-deployment';
import { OpenSearchPostDeploymentModule } from '@aws-ee/opensearch-api';
import { CoreRestApiPostDeploymentModule } from '@aws-ee/core-rest-api';
import { configEnvLoader } from '@aws-ee/common';
import { CoreAuthCognitoModule } from '@aws-ee/core-auth-cognito';
import { BackendCommonModule } from '@aws-ee/backend-common';

import { DummyDataService } from './services/dummy-data.service';
import { PostDeploymentConfig } from './config/post-deployment.config';

const steps = [DummyDataService];
const providers = [...steps];

@Global()
@Module({
  imports: [
    BackendCommonModule,
    CorePostDeploymentModule.withExtensions({
      steps: [CoreAuthCognitoModule.forPostDeployment().steps, CoreRestApiPostDeploymentModule.steps, steps, OpenSearchPostDeploymentModule.steps],
    }),
    CoreRestApiPostDeploymentModule,
    ConfigModule.forFeature(configEnvLoader(PostDeploymentConfig)),
    CoreAuthCognitoModule.forPostDeployment(),
    OpenSearchPostDeploymentModule,
  ],
  providers,
  exports: [...providers, BackendCommonModule],
})
export class PostDeploymentHandlerModule {}
