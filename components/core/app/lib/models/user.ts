import { Length, IsString, IsEmail, Matches, IsBoolean } from 'class-validator';
import { Principal } from './principal';

const naturalNameRegex = /^[A-Za-z0-9 .-]+$/;
const naturalNameOrEmailRegex =
  /^[A-Za-z0-9-_.]+$|^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

export class User implements Principal {
  constructor(attr?: Partial<User>) {
    Object.assign(this, attr);
  }

  @IsString()
  uid!: string;

  @IsBoolean()
  enabled!: boolean;

  @IsEmail()
  email!: string;

  @Length(1, 500)
  @Matches(naturalNameRegex)
  firstName!: string;

  @Length(1, 500)
  @Matches(naturalNameRegex)
  lastName!: string;

  @Length(3, 300)
  @Matches(naturalNameOrEmailRegex)
  username!: string;

  @IsString({ each: true })
  userRoles!: string[];

  claims?: Record<string, string>;
}
