import { Duration } from '@aws-cdk/core';

export const enum CognitoCustomAttributeMode {
  /**
   * The attribute is invisible to a user and can only be read and written by an admin
   */
  ADMIN_ONLY,

  /**
   * The attribute can be read by a user but only written to by an admin
   */
  READ,

  /**
   * The attribute can be read and written by a user
   */
  READ_WRITE,
}

export const enum CognitoCustomAttributeType {
  STRING,
  NUMBER,
  DATE_TIME,
  BOOLEAN,
}

export const enum CognitoLockoutMode {
  /**
   * In EVENTUAL mode, access tokens remain valid until they expire even if the user
   * has logged out or been disabled in Cognito. This has performance and cost
   * benefits.
   */
  EVENTUAL = 'eventual',

  /**
   * In IMMEDIATE mode, all user access is blocked immediately. If a user logs out
   * or has been disabled, a central block list is updated and then read on every
   * request. This setting will have a negative impact on performance and
   * increase costs.
   */
  IMMEDIATE = 'immediate',
}

export interface CognitoCustomAttributeDefinition {
  /**
   * Read and write permissions for this attribute
   */
  mode: CognitoCustomAttributeMode;

  /**
   * The data type of this attribute
   */
  type: CognitoCustomAttributeType;
}

export interface CognitoCustomAttributes {
  [key: string]: CognitoCustomAttributeDefinition;
}

export interface CognitoAdminPrincipal {
  /**
   * The email of the admin user.
   *
   * IMPORTANT! This must be a real email because it is used to send the initial
   * Admin password.
   */
  email: string;

  /**
   * First name of the admin user
   */
  firstName: string;

  /**
   * Last name of the admin user
   */
  lastName: string;
}

export interface FederatedIdentityProvider {
  /**
   * Identity provider id.
   * The usual practice is to keep this same as the domain name of the IdP.
   * For example, when connecting with an IdP that has users "user1@domain1.com", "user2@domain1.com" etc then
   * the id should be set to "domain1.com"
   */
  id: string;

  /**
   * Some name for the IdP. (such as 'com.ee', 'EEAD' etc)
   */
  name: string;

  /**
   * Display name (such as 'Employee Login', 'AD Login' etc). This can be used in UI to login options.
   */
  displayName: string;

  /**
   * Identity provider SAML metadata.
   *
   * Provide the full path and file name of the metadata XML file relative to the config file.
   *
   * For example:
   * `path.join(__dirname, '../saml-metadata/testidp1.xml')`
   */
  metadataFileName: string;

  /**
   * The role that the user will be given on sign up
   */
  userRole: string;

  /**
   * `AWS::Cognito::UserPoolIdentityProvider.AttributeMapping`.
   *
   * @link http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-cognito-userpoolidentityprovider.html#cfn-cognito-userpoolidentityprovider-attributemapping
   */
  attributeMapping?: Record<string, string>;
}

export interface SelfSignUp {
  /**
   * Can users sign up to the solution
   */
  enabled: boolean;

  /**
   * Which role will be assigned to self sign up users
   */
  userRole: string;
}

export interface CoreAuthCognitoStageConfig {
  /**
   * Defines the email addresses of admin users who should be provisioned when Post Deployment
   * runs.
   */
  adminPrincipals: CognitoAdminPrincipal[];

  /**
   * Indicates whether native Cognito users should be used or if the Cognito user pool will only be
   * used to federate via other identity providers
   */
  enableNativeUserPoolUsers?: boolean;

  /**
   * Title of the Cognito authentication provider
   */
  cognitoAuthNProviderTitle?: string;

  /**
   * Array of federated indentity providers.
   * If you do not want to connect to SAML 2.0 Identity Provider then leave this setting empty.
   */
  federatedIdentityProviders?: FederatedIdentityProvider[];

  /**
   * Name of the primary user pool app client used by the web app
   */
  webappAppClientName?: string;

  /**
   * Validity of the access token.
   *
   * Values between 5 minutes and 1 day are valid. The duration can not be longer than the refresh token validity.
   *
   * @default Duration.minutes(60)
   * @see https://docs.aws.amazon.com/en_us/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-with-identity-providers.html#amazon-cognito-user-pools-using-the-access-token
   */
  accessTokenValidity?: Duration;

  /**
   * Validity of the refresh token.
   *
   * Values between 60 minutes and 10 years are valid.
   *
   * @default Duration.days(1)
   * @see https://docs.aws.amazon.com/en_us/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-with-identity-providers.html#amazon-cognito-user-pools-using-the-refresh-token
   */
  refreshTokenValidity?: Duration;

  /**
   * Determines if users can sign up to the solution themselves.
   *
   * @default Disabled, users cannot sign up themselves
   */
  selfSignUp?: SelfSignUp;

  /**
   * Map of custom attributes to store in Cognito.
   *
   * Note: Once a custom attribute definition has been created in Cognito,
   * it cannot be deleted. The deployment will fail if you attempt to remove
   * a definition from this map.
   * The only way to get rid of a custom attribute definition is to delete and
   * re-create the UserPool.
   *
   * Note: Cognito is not optimized for frequent writes. From the docs:
   *
   * > Use a external database for frequently updated attributes
   *
   * > If your application requires several calls to a user pool to read or write custom attributes, use external storage. You can use your preferred database to store custom attributes or use a cache layer to load a user profile during sign-in. You can reference this profile from the cache when needed instead of reloading the user profile from a user pool.
   *
   * @default No custom attributes are created
   * @see https://docs.aws.amazon.com/cognito/latest/developerguide/limits.html
   *
   * @example
   * {
   *   shoeSize: {
   *     mode: CognitoCustomAttributeMode.READ_WRITE,
   *     type: CognitoCustomAttributeType.NUMBER,
   *   },
   * }
   */
  customAttributes?: CognitoCustomAttributes;

  /**
   * How the system deals with logged out or disabled users. See the enum for options
   * and the associated trade offs.
   *
   * @default EVENTUAL
   */
  cognitoLockoutMode?: CognitoLockoutMode;
}
