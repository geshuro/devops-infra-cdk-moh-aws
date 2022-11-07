import { Expose } from 'class-transformer';
import { IsString } from 'class-validator';
  
/**
 * API Handler config
 * At least one property must contain a class-validator decorator such as IsString, otherwise class-validator
 * validation of instances using forbidUnknownValues: true (required to mitigate SQL injection / XSS vulnerability) will fail
 * @see {@link https://github.com/advisories/GHSA-fj58-h2fr-3pp2|GitHub} */
export class ApiHandlerConfig {
  static KEY = 'restApiHandlerConfig';

  @IsString()
  @Expose({ name: 'APP_CORS_ALLOW_LIST' })
  corsAllowList!: string;

  @IsString()
  @Expose({ name: 'APP_PARAM_STORE_ROOT' })
  paramStoreRoot!: string;

  @IsString()
  @Expose({ name: 'APP_STAGE' })
  stage!: string;
}
