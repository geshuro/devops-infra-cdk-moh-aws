/* eslint-disable max-classes-per-file */
import { IsString, IsBoolean, IsEmail, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { Duration } from '@aws-cdk/core';
import { CoreConfig } from '@aws-ee/core-infra';
import {
  CoreAuthCognitoStageConfig,
  FederatedIdentityProvider,
  CognitoAdminPrincipal,
  SelfSignUp,
  CognitoCustomAttributes,
  CognitoLockoutMode,
} from './cognito-stage-config';

class CognitoAdminPrincipalConfig implements CognitoAdminPrincipal {
  @IsEmail()
  email!: string;

  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;
}

class FederatedIdentityProviderConfig implements FederatedIdentityProvider {
  @IsString()
  id!: string;

  @IsString()
  name!: string;

  @IsString()
  displayName!: string;

  @IsString()
  metadataFileName!: string;

  @IsString()
  userRole!: string;

  attributeMapping?: Record<string, string>;
}

export class CognitoConfig extends CoreConfig implements CoreAuthCognitoStageConfig {
  static readonly KEY: string = 'cognito';

  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CognitoAdminPrincipalConfig)
  adminPrincipals!: CognitoAdminPrincipalConfig[];

  @IsBoolean()
  enableNativeUserPoolUsers?: boolean = true;

  @IsString()
  cognitoAuthNProviderTitle?: string = 'Cognito';

  @ValidateNested({ each: true })
  @Type(() => FederatedIdentityProviderConfig)
  federatedIdentityProviders?: FederatedIdentityProviderConfig[] = [];

  @IsString()
  webappAppClientName?: string = 'webapp';

  selfSignUp?: SelfSignUp;

  accessTokenValidity?: Duration = Duration.minutes(60);

  refreshTokenValidity?: Duration = Duration.days(1);

  customAttributes?: CognitoCustomAttributes;

  cognitoLockoutMode?: CognitoLockoutMode = CognitoLockoutMode.EVENTUAL;

  get cognitoUserPoolName(): string {
    return this.namespace;
  }

  get userPoolDomainPrefix(): string {
    return this.namespace;
  }
}
