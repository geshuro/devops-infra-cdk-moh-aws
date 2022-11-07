import { Expose } from 'class-transformer';
import { IsString, IsIn } from 'class-validator';

export const enum CognitoLockoutMode {
  EVENTUAL = 'eventual',
  IMMEDIATE = 'immediate',
}

export class CognitoApiConfig {
  static KEY = 'cognitoApiConfig';

  @IsString()
  @Expose({ name: 'AWS_REGION' })
  awsRegion!: string;

  @IsString()
  @Expose({ name: 'APP_USER_POOL_DOMAIN_PREFIX' })
  userPoolDomainPrefix!: string;

  @IsString()
  @Expose({ name: 'APP_USER_POOL_CLIENT_ID' })
  userPoolClientId!: string;

  @IsString()
  @Expose({ name: 'APP_WEBSITE_URL' })
  websiteUrl!: string;

  @Expose({ name: 'APP_STAGE' })
  stage!: string;

  @Expose({ name: 'APP_COGNITO_LOCKOUT_MODE' })
  @IsIn(['eventual', 'immediate'])
  cognitoLockoutMode!: string;

  get cognitoUrl(): string {
    return `https://${this.userPoolDomainPrefix}.auth.${this.awsRegion}.amazoncognito.com`;
  }

  get tokenUrl(): string {
    return `${this.cognitoUrl}/oauth2/token`;
  }

  get authorizeUrl(): string {
    return `${this.cognitoUrl}/oauth2/authorize`;
  }

  get userInfoUrl(): string {
    return `${this.cognitoUrl}/oauth2/userInfo`;
  }

  get revocationUrl(): string {
    return `${this.cognitoUrl}/oauth2/revoke`;
  }

  get logoutUrl(): string {
    return `${this.cognitoUrl}/logout`;
  }
}
