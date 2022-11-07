import { AnyAbility } from '@casl/ability';
import { Principal } from '../models/principal';
import { RoleSet } from '../models/user-role';

export const AuthorizationProvider = Symbol('authorizationProvider');

export interface AuthorizationProvider {
  getRoles(): Promise<RoleSet>;
  getUserAbilities(principal: Principal): Promise<AnyAbility>;
}
