import { ListResult } from '../models/list-result';
import { User } from '../models/user';

export const UsersManager = Symbol('usersManager');

type ListUserProps = {
  maxResults?: number;
  nextToken?: string;
  fields?: string[];
};

export interface CreateUser extends Omit<User, 'uid'> {
  temporaryPassword?: string;
}

export interface UsersManager {
  getUser(uid: string): Promise<User | undefined>;
  listUsers(props: ListUserProps): Promise<ListResult<User>>;
  createUser(user: CreateUser): Promise<User>;
  updateUser(uid: string, updates: Partial<User>): Promise<User>;
  deleteUser(uid: string): Promise<void>;
}
