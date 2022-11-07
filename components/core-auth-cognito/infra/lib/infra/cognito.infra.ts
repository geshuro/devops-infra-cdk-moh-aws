import * as fs from 'fs';
import { Duration, RemovalPolicy, CfnOutput } from '@aws-cdk/core';
import { PolicyStatement } from '@aws-cdk/aws-iam';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthStack, CoreStack, StackOutputService } from '@aws-ee/core-infra';
import { AuthorizationType, IdentitySource, RequestAuthorizer } from '@aws-cdk/aws-apigateway';
import {
  AccountRecovery,
  ClientAttributes,
  OAuthScope,
  UserPool,
  CfnUserPoolClient,
  UserPoolClient,
  UserPoolDomain,
  ICustomAttribute,
  BooleanAttribute,
  StringAttribute,
  DateTimeAttribute,
  NumberAttribute,
} from '@aws-cdk/aws-cognito';
import { ApiStack } from '@aws-ee/core-rest-api-infra';
import { CognitoConfig } from '../config/cognito-config';
import { UserPoolIdentityProviderSaml } from './saml-identity-provider';
import { PostConfirmationLambda } from './post-confirmation.lambda';
import {
  CognitoCustomAttributeDefinition,
  CognitoCustomAttributes,
  CognitoCustomAttributeType,
  CognitoCustomAttributeMode,
  CognitoLockoutMode,
} from '../config/cognito-stage-config';
import { AuthorizerLambda } from './authorizer.lambda';
import { RevokedAccessTable } from './revoked-access.table';

@Injectable()
export class CognitoInfra {
  readonly userPool: UserPool;
  readonly userPoolClient: UserPoolClient;
  readonly userPoolDomain: UserPoolDomain;
  private postConfirmationLambda?: PostConfirmationLambda;
  private readonly config: CognitoConfig;
  private readonly revokedAccessDb?: RevokedAccessTable;

  constructor(
    apiStack: ApiStack,
    private readonly authStack: AuthStack,
    private readonly coreStack: CoreStack,
    configService: ConfigService,
    private readonly stackOutputService: StackOutputService,
  ) {
    this.config = configService.get<CognitoConfig>(CognitoConfig.KEY)!;

    if (!this.config.enableNativeUserPoolUsers && !this.config.federatedIdentityProviders?.length) {
      throw new Error('Native Cognito users can only be disabled when at least one federation provider is configured!');
    }

    // Only destroy items (like the UserPool) in a dev environment.
    const removalPolicy = this.config.isDevelopmentEnv ? RemovalPolicy.DESTROY : RemovalPolicy.RETAIN;

    this.userPool = new UserPool(authStack, 'cognitoUserPool', {
      userPoolName: this.config.cognitoUserPoolName,
      autoVerify: {
        email: true,
      },
      standardAttributes: {
        email: {
          mutable: true,
          required: true,
        },
      },
      customAttributes: this.toUserPoolCustomAttributes(this.config.customAttributes),
      signInCaseSensitive: false,
      accountRecovery: AccountRecovery.EMAIL_ONLY,
      selfSignUpEnabled: this.config.selfSignUp?.enabled,
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireSymbols: true,
      },
      userInvitation: {
        emailSubject: `Invitation to sign up for ${this.config.namespace}`,

        emailBody:
          `<p>Hello {username},</p>` +
          `<p>You have been invited to join ${this.config.namespace}. Your temporary password is <b>{####}</b></p>`,
      },
      removalPolicy,
    });

    for (const idp of this.config.federatedIdentityProviders ?? []) {
      const metadata = fs.readFileSync(idp.metadataFileName).toString('utf-8');

      new UserPoolIdentityProviderSaml(authStack, `FederatedIdp${idp.name}`, {
        id: idp.id,
        name: idp.name,
        metadata,
        attributeMapping: idp.attributeMapping,
        userPool: this.userPool,
      });

      this.getPostConfirmationLambda().setUserRoleForExternalIdentityProvider(idp.name, idp.userRole);
    }

    new CfnOutput(authStack, 'UserPoolId', {
      value: this.userPool.userPoolId,
      description: 'ID of the Cognito User Pool',
    });

    new CfnOutput(authStack, 'UserPoolArn', {
      value: this.userPool.userPoolArn,
      description: 'ARN of the Cognito User Pool',
    });

    // getting this from the stack output to avoid circular references
    const websiteUrl = stackOutputService.get({
      stack: apiStack,
      outputName: 'WebsiteUrl',
      defaultValue: 'https://example.com',
    });

    const authRedirectUrls: string[] = [websiteUrl];

    if (this.config.isDevelopmentEnv) {
      authRedirectUrls.push('http://localhost:3000');
    }

    this.userPoolClient = new UserPoolClient(authStack, 'cognitoUserPoolClient', {
      userPool: this.userPool,
      userPoolClientName: this.config.webappAppClientName,
      accessTokenValidity: this.config.accessTokenValidity,
      refreshTokenValidity: this.config.refreshTokenValidity,
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        scopes: [OAuthScope.EMAIL, OAuthScope.OPENID, OAuthScope.PROFILE, OAuthScope.COGNITO_ADMIN],
        callbackUrls: authRedirectUrls,
        logoutUrls: authRedirectUrls,
      },
      ...this.toUserPoolClientCustomAttributes(this.config.customAttributes),
    });

    // When native users are disabled, the COGNITO provider needs to be removed from the client.
    // There seems to be no CDK way of doing this so we fall back to the L1 escape hatch.
    if (!this.config.enableNativeUserPoolUsers) {
      const cfnPoolClient = this.userPoolClient.node.defaultChild as CfnUserPoolClient;
      cfnPoolClient.supportedIdentityProviders = cfnPoolClient.supportedIdentityProviders?.filter(
        (client) => client !== 'COGNITO',
      );
    }

    // In dev mode, a client is created especially for the API integration tests
    // to allow the ADMIN_NO_SRP_AUTH flow
    if (this.config.isDevelopmentEnv) {
      const apiIntegrationTestAppClient = new UserPoolClient(authStack, 'apiIntegrationTestAppClient', {
        userPool: this.userPool,
        userPoolClientName: 'API Integration Tests',
        generateSecret: true,
        refreshTokenValidity: Duration.hours(1), // 1h is the minimum
        authFlows: {
          adminUserPassword: true,
        },
        readAttributes: new ClientAttributes().withStandardAttributes({
          email: true,
          familyName: true,
          givenName: true,
        }),
        writeAttributes: new ClientAttributes().withStandardAttributes({
          email: true,
          familyName: true,
          givenName: true,
        }),
      });
      new CfnOutput(authStack, 'ApiIntegrationTestAppClient', {
        value: apiIntegrationTestAppClient.userPoolClientId,
        description:
          'A user pool app client that allows the ADMIN_NO_SRP_AUTH auth flow so API integration tests can retrieve tokens',
      });
    }

    this.userPoolDomain = new UserPoolDomain(authStack, 'cognitoUserPoolDomain', {
      userPool: this.userPool,
      cognitoDomain: { domainPrefix: this.config.userPoolDomainPrefix },
    });

    const authLambda = new AuthorizerLambda(apiStack, {
      namespace: this.config.namespace,
      userPool: this.userPool,
      cwlLambdaPolicy: this.coreStack.cloudwatchLambdaPolicy,
    });

    if (!this.config.isDevelopmentEnv) {
      // We only validate the clientId in non-dev environments
      // This allows the integration tests to come in from a different client
      authLambda.validateUserPoolClient(this.userPoolClient);
    }

    const authorizer = new RequestAuthorizer(apiStack, 'RequestAuthorizer', {
      handler: authLambda,
      identitySources: [IdentitySource.header('Cookie')],
      resultsCacheTtl: Duration.minutes(5),
    });

    authorizer._attachToApi(apiStack.api.api);

    apiStack.api.applyAuthToPrivateMethods({
      authorizationType: AuthorizationType.CUSTOM,
      authorizer,
    });

    apiStack.apiHandler
      .addEnvironment('APP_USER_POOL_ID', this.userPool.userPoolId)
      .addEnvironment('APP_USER_POOL_DOMAIN_PREFIX', this.config.userPoolDomainPrefix)
      .addEnvironment('APP_USER_POOL_CLIENT_ID', this.userPoolClient.userPoolClientId)
      .addEnvironment('APP_WEBSITE_URL', websiteUrl);

    if (this.config.selfSignUp?.enabled) {
      this.getPostConfirmationLambda().setUserRoleForSelfSignUp(this.config.selfSignUp.userRole);
    }

    apiStack.apiHandler.addToRolePolicy(
      new PolicyStatement({
        sid: 'userPoolAccess',
        actions: [
          'cognito-idp:AdminAddUserToGroup',
          'cognito-idp:AdminRemoveUserFromGroup',
          'cognito-idp:AdminCreateUser',
          'cognito-idp:AdminListGroupsForUser',
          'cognito-idp:AdminDisableUser',
          'cognito-idp:AdminEnableUser',
          'cognito-idp:AdminGetUser',
          'cognito-idp:AdminDeleteUser',
          'cognito-idp:AdminUpdateUserAttributes',
          'cognito-idp:CreateGroup',
          'cognito-idp:GetGroup',
          'cognito-idp:ListUsers',
        ],
        resources: [this.userPool.userPoolArn],
      }),
    );

    apiStack.apiHandler.addEnvironment('APP_COGNITO_LOCKOUT_MODE', this.config.cognitoLockoutMode!);

    if (this.config.cognitoLockoutMode === CognitoLockoutMode.IMMEDIATE) {
      this.revokedAccessDb = new RevokedAccessTable(authStack, {
        dbPrefix: this.config.dbPrefix,
        dynamoDbKmsKey: coreStack.dynamoDbKmsKey,
      });
      this.revokedAccessDb.grantReadWriteData(apiStack.apiHandler);
      this.revokedAccessDb.grant(apiStack.apiHandler, 'dynamodb:DescribeTable'); // for dynamoose
    }
  }

  private getPostConfirmationLambda() {
    // The lambda is created lazily. Without self-signup or federation,
    // it will not be created.
    if (!this.postConfirmationLambda) {
      this.postConfirmationLambda = new PostConfirmationLambda(this.authStack, {
        namespace: this.config.namespace,
        // Using the output from a previous deployment here to solve a circular
        // reference
        userPoolArn: this.stackOutputService.get({
          stack: this.authStack,
          outputName: 'UserPoolArn',
          defaultValue: '*',
        }),
        userPool: this.userPool,
        cwlLambdaPolicy: this.coreStack.cloudwatchLambdaPolicy,
      });
    }
    return this.postConfirmationLambda;
  }

  private toUserPoolCustomAttributes(attributes?: CognitoCustomAttributes):
    | {
        [key: string]: ICustomAttribute;
      }
    | undefined {
    if (!attributes) {
      return undefined;
    }

    const toCustomAttribute = (definition: CognitoCustomAttributeDefinition): ICustomAttribute => {
      switch (definition.type) {
        case CognitoCustomAttributeType.BOOLEAN:
          return new BooleanAttribute({ mutable: true });
        case CognitoCustomAttributeType.DATE_TIME:
          return new DateTimeAttribute({ mutable: true });
        case CognitoCustomAttributeType.NUMBER:
          return new NumberAttribute({ mutable: true });
        case CognitoCustomAttributeType.STRING:
        default:
          return new StringAttribute({ mutable: true });
      }
    };

    return Object.keys(attributes).reduce((prev, key) => ({ ...prev, [key]: toCustomAttribute(attributes[key]) }), {});
  }

  private toUserPoolClientCustomAttributes(attributes?: CognitoCustomAttributes): {
    readAttributes: ClientAttributes;
    writeAttributes: ClientAttributes;
  } {
    const customReadAttributes = Object.keys(attributes ?? {}).filter((key) =>
      [CognitoCustomAttributeMode.READ, CognitoCustomAttributeMode.READ_WRITE].includes(attributes![key].mode),
    );
    const customWriteAttributes = Object.keys(attributes ?? {}).filter((key) =>
      [CognitoCustomAttributeMode.READ_WRITE].includes(attributes![key].mode),
    );

    return {
      readAttributes: new ClientAttributes()
        .withStandardAttributes({
          email: true,
          emailVerified: true,
          familyName: true,
          givenName: true,
        })
        .withCustomAttributes(...customReadAttributes),
      writeAttributes: new ClientAttributes()
        .withStandardAttributes({
          email: true,
          familyName: true,
          givenName: true,
        })
        .withCustomAttributes(...customWriteAttributes),
    };
  }
}
