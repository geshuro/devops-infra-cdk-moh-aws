import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { RoleSet, UserRole } from '../models/user-role';
import { ListResult } from '../models/list-result';
import { AuthorizationProvider } from '../extensions/authorization.provider';
import { Boom } from '../utils/boom';

@Injectable()
export class UserRolesService {
  private roles!: RoleSet;

  constructor(@Inject(AuthorizationProvider) private readonly authzProvider: AuthorizationProvider) {}

  async find({ id }: { id: string }): Promise<UserRole | undefined> {
    await this.collectRoles();
    return this.roles[id];
  }

  async mustFind({ id }: { id: string }): Promise<UserRole> {
    await this.collectRoles();

    const result = this.roles[id];
    if (!result) {
      throw new NotFoundException(Boom.safeMsg(`user role with id "${id}" does not exist`));
    }

    return this.roles[id];
  }

  async list(): Promise<ListResult<UserRole>> {
    await this.collectRoles();
    const items = Object.values(this.roles);

    return {
      items,
      count: items.length,
    };
  }

  private async collectRoles() {
    if (!this.roles) {
      this.roles = await this.authzProvider.getRoles();
    }
  }
}
