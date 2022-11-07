/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { Action, Boom, filterFieldsIfDisallowed, ListResult, RequestContext, User, UsersService } from '@aws-ee/core';
import { Body, Controller, Delete, Get, NotFoundException, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AbilityGuard, AssertAbilities, can } from '../guards/ability.guard';
import { CreateUserDto } from '../models/user/create-user.model';
import { UpdateUserDto } from '../models/user/update-user.model';
import { Context } from '../utils/context.decorator';

@UseGuards(AbilityGuard)
@Controller('/api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @AssertAbilities(can(Action.Read, User))
  async getUsers(
    @Context() ctx: RequestContext,
    @Query('maxResults') maxResults?: number,
    @Query('nextToken') nextToken?: string,
  ): Promise<ListResult<Partial<User>>> {
    const result = await this.usersService.listUsers({ maxResults, nextToken });
    const items = result.items
      .filter((user) => ctx.ability.can(Action.Read, user))
      .map(
        filterFieldsIfDisallowed({
          fieldsToCheck: ['userRoles'],
          isAllowed: (field) => ctx.ability.can(Action.Read, User, field),
        }),
      );
    return {
      ...result,
      items,
    };
  }

  @Get(':uid')
  @AssertAbilities(can(Action.Read, User))
  async getUser(@Context() ctx: RequestContext, @Param('uid') uid: string) {
    ctx.assertAbility.throwUnlessCan(Action.Read, new User({ uid }));
    const fieldFilter = filterFieldsIfDisallowed({
      fieldsToCheck: ['userRoles'],
      isAllowed: (field) => ctx.ability.can(Action.Read, User, field),
    });

    const user = await this.usersService.getUser({ uid });

    if (!user) {
      throw new NotFoundException(Boom.safeMsg('User not found'));
    }

    return fieldFilter(user);
  }

  @Post()
  @AssertAbilities(can(Action.Create, User))
  async createUser(@Body() user: CreateUserDto) {
    return this.usersService.createUser({ user });
  }

  @Put(':uid')
  @AssertAbilities(can(Action.Update, User))
  async updateUser(@Context() ctx: RequestContext, @Param('uid') uid: string, @Body() userToUpdate: UpdateUserDto) {
    ctx.assertAbility.throwUnlessCan(Action.Update, new User({ uid }));
    // check fields too
    Object.keys(userToUpdate).forEach((field) => ctx.assertAbility.throwUnlessCan(Action.Update, User, field));
    return this.usersService.updateUser({
      uid,
      user: userToUpdate,
    });
  }

  @Delete(':uid')
  @AssertAbilities(can(Action.Delete, User))
  async deleteUser(@Context() ctx: RequestContext, @Param('uid') uid: string) {
    ctx.assertAbility.throwUnlessCan(Action.Delete, new User({ uid }));
    await this.usersService.deleteUser({ uid });
    return { message: `user ${uid} deleted` };
  }
}
