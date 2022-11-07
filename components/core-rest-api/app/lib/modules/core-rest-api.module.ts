import { Provider, Module, Global, DynamicModule, Type } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configEnvLoader } from '@aws-ee/common';

import { UserRolesController } from '../controllers/user-roles.controller';
import { UserController } from '../controllers/user.controller';
import { UsersController } from '../controllers/users.controller';
import { JwtService } from '../services/jwt.service';
import { UserCapabilitiesController } from '../controllers/user-capabilities.controller';
import { ApiHandlerConfig } from '../config/api-handler-config';
import { RestApiSharedConfig } from '../config/shared-config';
import { Oauth2Controller } from '../controllers/oauth2.controller';
import { AuthenticationController } from '../controllers/authentication.controller';

const providers: Provider[] = [JwtService];

@Global()
@Module({
  imports: [
    ConfigModule.forFeature(configEnvLoader(RestApiSharedConfig)),
    ConfigModule.forFeature(configEnvLoader(ApiHandlerConfig)),
  ],
  providers,
  exports: providers,
})
export class CoreRestApiModule {
  /**
   * By default, all controllers are wired in.
   * If you need to provide your own controller for
   * a particular endpoint, you can exclude any or all
   * by setting the relevant flag to false.
   */
  static withControllers(
    props: {
      auth?: boolean;
      user?: boolean;
      users?: boolean;
      roles?: boolean;
      capabilities?: boolean;
    } = {},
  ): DynamicModule {
    const controllers: Type<unknown>[] = [];

    if (props.auth !== false) {
      controllers.push(Oauth2Controller, AuthenticationController);
    }
    if (props.user !== false) {
      controllers.push(UserController);
    }
    if (props.users !== false) {
      controllers.push(UsersController);
    }
    if (props.roles !== false) {
      controllers.push(UserRolesController);
    }
    if (props.capabilities !== false) {
      controllers.push(UserCapabilitiesController);
    }
    return {
      module: CoreRestApiModule,
      controllers,
    };
  }
}
