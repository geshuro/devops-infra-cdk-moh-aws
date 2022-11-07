import { Action, User as UserObject } from '@aws-ee/core';
import { Controller, Get, UseGuards } from '@nestjs/common';
import type { ListResult } from '@aws-ee/core';
import { AbilityGuard, AssertAbilities, can } from '../guards/ability.guard';

@UseGuards(AbilityGuard)
@Controller('/api/user-capabilities')
export class UserCapabilitiesController {
  @Get()
  @AssertAbilities(can(Action.Read, UserObject))
  getUserCapabilities(): ListResult<unknown> {
    /**
     * Listing out capabilities is not supported any more,
     * this endpoint exists for UI compatibility only
     */
    return { items: [], count: 0 };
  }
}
