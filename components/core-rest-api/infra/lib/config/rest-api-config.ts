import { CoreConfig } from '@aws-ee/core-infra';
import { EndpointType } from '@aws-cdk/aws-apigateway';

import { CoreRestApiStageConfig } from './rest-api-stage-config';

export class RestApiConfig extends CoreConfig implements CoreRestApiStageConfig {
  static readonly KEY: any = 'rest-api';

  jwtOptions?: string = '{"algorithm":"HS256","expiresIn":"2 days"}';

  autoSyncUserRoleCapabilities?: boolean = true;

  endpointType?: EndpointType = EndpointType.EDGE;

  get paramStoreJwtSecret() {
    return `/${this.paramStoreRoot}/jwt/secret`;
  }
}
