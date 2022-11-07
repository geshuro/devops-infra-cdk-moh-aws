import { Global, MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CoreModule } from '@aws-ee/core';
import { CoreRestApiModule, SetupAuthContextMiddleware } from '@aws-ee/core-rest-api';
import { CoreAuthCognitoModule } from '@aws-ee/core-auth-cognito';
import { BackendCommonModule } from '@aws-ee/backend-common';
import { OpenSearchSearchModule } from '@aws-ee/opensearch-api';
import { configEnvLoader } from '@aws-ee/common';

import { ScreeningController } from './screening.controller';
import { ScreeningsController } from './screenings.controller';
import { ApiHandlerExtendedConfig } from './config/api-handler-extended.config';
import { ScreeningsService } from './screenings.service';

const providers = [ScreeningsService];

@Global()
@Module({
  imports: [
    ConfigModule.forFeature(configEnvLoader(ApiHandlerExtendedConfig)),
    BackendCommonModule,
    CoreModule,
    CoreRestApiModule.withControllers(),
    CoreAuthCognitoModule.forApi(),
    OpenSearchSearchModule,
  ],
  controllers: [ScreeningsController, ScreeningController],
  providers,
  exports: [...providers, BackendCommonModule],
})
export class ApiHandlerModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(SetupAuthContextMiddleware).forRoutes({
      path: '*',
      method: RequestMethod.ALL,
    });
  }
}
