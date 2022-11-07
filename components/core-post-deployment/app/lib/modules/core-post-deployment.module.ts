import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { DynamooseModule } from 'nestjs-dynamoose';
import { configDbPrefixLoader, configEnvLoader } from '@aws-ee/common';
import { ConfigModule } from '@nestjs/config';
import { AuditWriterService, ExtensionPoint, Implements } from '@aws-ee/core';

import { DeploymentStoreService } from '../services/deployment-store.service';
import { DeploymentRunner } from '../services/deployment-runner.service';
import { PostDeploymentStep } from '../extensions/post-deployment-step';
import { CorePostDeploymentConfig } from '../config/post-deployment-config';
import { DeploymentItemModelDefinition } from '../db/deployment-item.schema';

const providers: Provider[] = [AuditWriterService, DeploymentStoreService, DeploymentRunner];

const dbModels = [DeploymentItemModelDefinition];

interface PostDeploymentExtensions {
  steps: Implements<PostDeploymentStep>[][];
}

@Global()
@Module({
  imports: [
    DynamooseModule.forRoot({ model: { create: false, prefix: configDbPrefixLoader() } }),
    DynamooseModule.forFeature(dbModels),
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      load: [configEnvLoader(CorePostDeploymentConfig)],
    }),
  ],
  providers,
  exports: providers,
})
export class CorePostDeploymentModule {
  static withExtensions({ steps }: PostDeploymentExtensions): DynamicModule {
    const flatSteps = steps.reduce((prev, curr) => [...prev, ...curr], []);
    const dynamicProviders = [ExtensionPoint(PostDeploymentStep, flatSteps)];
    return {
      module: CorePostDeploymentModule,
      providers: dynamicProviders,
      exports: dynamicProviders,
    };
  }
}
