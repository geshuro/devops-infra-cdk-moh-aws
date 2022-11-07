import { UsersManager, UserManager, Implements } from '@aws-ee/core';
import { ConfigModule } from '@nestjs/config';
import { TokenManager, RequestAuthenticator } from '@aws-ee/core-rest-api';
import { configEnvLoader, loadEnvConfig } from '@aws-ee/common';
import { Global, Module, Provider, HttpModule, DynamicModule } from '@nestjs/common';
import { DynamooseModule } from 'nestjs-dynamoose';
import { PostDeploymentStep } from '@aws-ee/core-post-deployment';

import { CognitoRequestAuthenticator } from '../services/cognito-request-authenticator.service';
import { CognitoLocalRequestAuthenticator } from '../services/cognito-local-request-authenticator.service';
import { CognitoUsersManagerService } from '../services/cognito-users-manager.service';
import { CognitoTokenService } from '../services/cognito-token.service';
import { CognitoApiConfig, CognitoLockoutMode } from '../config/cognito-api-config';
import { CognitoCommonConfig } from '../config/cognito-common-config';
import { CognitoUserManagerService } from '../services/cognito-user-manager.service';
import { RevokedAccessModelDefinition } from '../db/revoked-access.schema';
import { CognitoRevokedAccessService } from '../services/cognito-revoked-access.service';
import { CognitoProvisionerPluginService } from '../services/cognito-provisioner-plugin.service';
import { CognitoPostDeploymentConfig } from '../config/cognito-post-deployment-config';

interface DynamicModuleWithSteps extends DynamicModule {
  steps: Implements<PostDeploymentStep>[];
}

@Global()
@Module({})
export class CoreAuthCognitoModule {
  static forApi(): DynamicModule {
    const providers: Provider[] = [
      { provide: UsersManager, useClass: CognitoUsersManagerService },
      { provide: UserManager, useClass: CognitoUserManagerService },
      { provide: TokenManager, useClass: CognitoTokenService },
    ];

    if (process.env.APP_RUN_MODE === 'local') {
      providers.push({ provide: RequestAuthenticator, useClass: CognitoLocalRequestAuthenticator });
      console.warn(
        'Using local request authenticator. This is for local development only, this message should never be seen in a deployed lambda!',
      );
    } else {
      providers.push({ provide: RequestAuthenticator, useClass: CognitoRequestAuthenticator });
    }

    const dbModels = [];

    const config = loadEnvConfig(CognitoApiConfig);
    if (config.cognitoLockoutMode === CognitoLockoutMode.IMMEDIATE) {
      dbModels.push(RevokedAccessModelDefinition);
      providers.push(CognitoRevokedAccessService);
    }

    return {
      module: CoreAuthCognitoModule,
      imports: [
        HttpModule,
        ConfigModule.forFeature(configEnvLoader(CognitoApiConfig)),
        ConfigModule.forFeature(configEnvLoader(CognitoCommonConfig)),
        DynamooseModule.forFeature(dbModels),
      ],
      providers,
      exports: providers,
    };
  }

  static forPostDeployment(): DynamicModuleWithSteps {
    const steps: Implements<PostDeploymentStep>[] = [CognitoProvisionerPluginService];
    const providers: Provider[] = [...steps, { provide: UsersManager, useClass: CognitoUsersManagerService }];

    return {
      steps,
      module: CoreAuthCognitoModule,
      imports: [
        ConfigModule.forRoot({
          cache: true,
          isGlobal: true,
          load: [configEnvLoader(CognitoPostDeploymentConfig), configEnvLoader(CognitoCommonConfig)],
        }),
      ],
      providers,
      exports: providers,
    };
  }
}
