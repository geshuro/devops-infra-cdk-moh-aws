import { Expose } from 'class-transformer';
import { IsString } from 'class-validator';

export class RestApiSharedConfig {
  static KEY = 'restApiSharedConfig';

  @IsString()
  @Expose({ name: 'APP_DB_PREFIX' })
  dbPrefix!: string;

  @Expose({ name: 'APP_PARAM_STORE_JWT_SECRET' })
  @IsString()
  paramStoreJwtSecret!: string;

  @Expose({ name: 'APP_JWT_OPTIONS' })
  @IsString()
  jwtOptions!: string;
}
