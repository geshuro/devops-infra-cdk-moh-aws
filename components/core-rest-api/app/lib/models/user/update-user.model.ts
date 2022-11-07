import { Length, IsString, IsEmail, IsOptional, IsBoolean, Matches } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @Length(1, 500)
  @Matches(/^[A-Za-z0-9 .-]+$/)
  firstName?: string;

  @IsOptional()
  @Length(1, 500)
  @Matches(/^[A-Za-z0-9 .-]+$/)
  lastName?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsString({ each: true })
  userRoles?: string[];

  @IsOptional()
  claims?: Record<string, string>;
}
