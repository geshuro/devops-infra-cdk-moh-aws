import { IsOptional, IsString } from 'class-validator';

export class AuthCodeDto {
  @IsString()
  code!: string;

  @IsOptional()
  @IsString()
  redirectUrl?: string;

  @IsOptional()
  @IsString()
  pkceVerifier?: string;
}
