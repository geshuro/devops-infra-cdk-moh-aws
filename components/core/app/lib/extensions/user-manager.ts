import { Principal } from '../models/principal';
import { User } from '../models/user';

export const UserManager = Symbol('userManager');

export interface UserBaseProps {
  token: string;
}

export interface UserInfoProps extends UserBaseProps {
  principal: Principal;
}

export interface UserUpdateProps extends UserBaseProps {
  principal: Principal;
  updates: Partial<User>;
}

export interface UserManager {
  getUser(props: UserInfoProps): Promise<User>;
  updateUser(props: UserUpdateProps): Promise<User>;
  deleteUser(props: UserBaseProps): Promise<void>;
}
