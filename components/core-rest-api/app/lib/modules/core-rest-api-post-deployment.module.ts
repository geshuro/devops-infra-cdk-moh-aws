import { UserRolesService, UsersService, UserAuthzService, Implements } from '@aws-ee/core';
import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configEnvLoader, configDbPrefixLoader } from '@aws-ee/common';
import { DynamooseModule } from 'nestjs-dynamoose';
import { PostDeploymentStep } from '@aws-ee/core-post-deployment';

import { CreateJwtKeyService } from '../services/post-deployment-steps/create-jwt-key.service';
import { PostDeploymentConfig } from '../config/post-deployment-config';
import { RestApiSharedConfig } from '../config/shared-config';

const steps: Implements<PostDeploymentStep>[] = [CreateJwtKeyService];

const providers = [...steps, UserRolesService, UsersService, UserAuthzService];

@Global()
@Module({
  imports: [
    ConfigModule.forFeature(configEnvLoader(PostDeploymentConfig)),
    ConfigModule.forFeature(configEnvLoader(RestApiSharedConfig)),
    DynamooseModule.forRoot({ model: { create: false, prefix: configDbPrefixLoader() } }),
  ],
  providers,
  exports: providers,
})
export class CoreRestApiPostDeploymentModule {
  static steps = steps;
}
