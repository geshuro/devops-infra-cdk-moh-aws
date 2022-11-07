export class UserRole {
  constructor(attr: Omit<UserRole, 'userType'>) {
    Object.assign(this, attr);
  }

  id!: string;
  description!: string;
}

export enum CoreRoles {
  Admin = 'admin',
  Guest = 'guest',
}

export type RoleSet = Record<string, UserRole>;

export const CoreRoleSet: RoleSet = {
  admin: new UserRole({ id: 'admin', description: 'Administrator' }),
  guest: new UserRole({ id: 'guest', description: 'Guest' }),
};
