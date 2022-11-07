import { Expose } from 'class-transformer';
import { IsString } from 'class-validator';

export class CognitoCommonConfig {
  static KEY = 'cognitoCommonConfig';

  @IsString()
  @Expose({ name: 'AWS_REGION' })
  awsRegion!: string;

  @IsString()
  @Expose({ name: 'APP_USER_POOL_ID' })
  userPoolId!: string;

  get authProviderId(): string {
    return `https://cognito-idp.${this.awsRegion}.amazonaws.com/${this.userPoolId}`;
  }
}
