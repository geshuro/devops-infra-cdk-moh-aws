/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { Action, User, UserService } from '@aws-ee/core';
import { Body, Controller, Get, Put, UseGuards, UnauthorizedException } from '@nestjs/common';
import { Locals } from '../utils/locals.decorator';
import { AbilityGuard, AssertAbilities, can } from '../guards/ability.guard';
import { UpdateUserDto } from '../models/user/update-user.model';
import { ResponseLocals } from '../models/response-locals';

@UseGuards(AbilityGuard)
@Controller('/api/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getUser(@Locals() locals: ResponseLocals) {
    const { token, principal, requestContext } = locals;

    if (!token || !principal) {
      throw new UnauthorizedException();
    }

    const user = await this.userService.getUser({ token, principal });
    if (!user) {
      throw new UnauthorizedException();
    }

    requestContext.assertAbility.throwUnlessCan(Action.Read, user);
    return user;
  }

  @Put()
  @AssertAbilities(can(Action.Update, User))
  async updateUser(@Locals() locals: ResponseLocals, @Body() userToUpdate: UpdateUserDto) {
    const { token, principal, requestContext: ctx } = locals;

    if (!token || !principal) {
      throw new UnauthorizedException();
    }

    ctx.assertAbility.throwUnlessCan(Action.Update, new User(principal));
    // check fields too
    Object.keys(userToUpdate).forEach((field) => ctx.assertAbility.throwUnlessCan(Action.Update, User, field));
    return this.userService.updateUser({ token, principal, updates: userToUpdate });
  }
}
