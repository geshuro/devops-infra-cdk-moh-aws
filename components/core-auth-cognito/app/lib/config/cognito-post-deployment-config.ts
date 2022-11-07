/* eslint-disable max-classes-per-file */
import { deserializeArray, Expose, Transform } from 'class-transformer';
import { IsString, IsEmail, ValidateNested } from 'class-validator';

class CognitoAdminPrincipalConfig {
  @IsEmail()
  email!: string;

  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;
}

export class CognitoPostDeploymentConfig {
  static KEY = 'cognitoPostDeploymentConfig';

  @ValidateNested({ each: true })
  @Transform(({ value }) => deserializeArray(CognitoAdminPrincipalConfig, value))
  @Expose({ name: 'APP_ADMIN_PRINCIPALS' })
  adminPrincipals!: CognitoAdminPrincipalConfig[];
}
