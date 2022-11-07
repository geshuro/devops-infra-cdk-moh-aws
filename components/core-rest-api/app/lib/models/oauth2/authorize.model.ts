import { IsOptional, IsString } from 'class-validator';

export class AuthorizeDto {
  @IsOptional()
  @IsString()
  redirectUrl?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  pkceChallenge?: string;
}
