import { EndpointType } from '@aws-cdk/aws-apigateway';

export interface CoreRestApiStageConfig {
  /**
   * Options used when issuing JWT token such as which algorithm to use for
   * hashing and how long to keep the tokens alive etc
   */
  jwtOptions?: string;

  /**
   * This setting allows the post-deployment steps to also maintain the user roles updated with the capabilities defined in code.
   * If you do not want the capabilities to be updated on each deployment, set the following setting to false.
   */
  autoSyncUserRoleCapabilities?: boolean;

  /**
   * The type of endpoint to use for the API Gateway.
   * Supported options are PRIVATE, REGIONAL, and EDGE
   * See https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-api-endpoint-types.html for more information
   */
  endpointType?: EndpointType;
}
