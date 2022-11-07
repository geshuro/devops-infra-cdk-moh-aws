import { IsOptional, IsString } from 'class-validator';
import { User } from '@aws-ee/core';
import { OmitType } from '@nestjs/mapped-types';

export class CreateUserDto extends OmitType(User, ['uid']) {
  @IsOptional()
  @IsString()
  temporaryPassword?: string;
}
