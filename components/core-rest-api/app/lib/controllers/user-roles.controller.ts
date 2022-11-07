/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { Action, RequestContext, UserRole, UserRolesService } from '@aws-ee/core';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { Context } from '../utils/context.decorator';

import { AbilityGuard, AssertAbilities, can } from '../guards/ability.guard';

@UseGuards(AbilityGuard)
@Controller('/api/user-roles')
export class UserRolesController {
  constructor(private readonly userRolesService: UserRolesService) {}

  @Get()
  @AssertAbilities(can(Action.Read, UserRole))
  async getUserRoles(@Context() ctx: RequestContext) {
    const result = await this.userRolesService.list();
    const items = result.items.filter((role) => ctx.ability.can(Action.Read, role));
    return {
      ...result,
      items,
    };
  }
}
