import { AnyAbility } from '@casl/ability';
import { Reflector } from '@nestjs/core';
import { CanActivate, ExecutionContext, Injectable, SetMetadata, CustomDecorator } from '@nestjs/common';
import { Action, CoreSubjects, RequestContext } from '@aws-ee/core';

type AbilityCheckerCallback = (ability: AnyAbility) => boolean;

export type AbilityChecker = AbilityCheckerCallback;

export const can =
  <A extends string = Action, S = CoreSubjects>(action: A, subject: S) =>
  (ability: AnyAbility): boolean =>
    ability.can(action, subject);

export const CHECK_ABILITY_KEY = 'check_ability';
export const AssertAbilities = (...handlers: AbilityChecker[]): CustomDecorator =>
  SetMetadata(CHECK_ABILITY_KEY, handlers);

@Injectable()
export class AbilityGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const policyHandlers = this.reflector.get<AbilityChecker[]>(CHECK_ABILITY_KEY, context.getHandler()) || [];

    const response = context.switchToHttp().getResponse();
    const ctx: RequestContext = response.locals?.requestContext;
    if (!ctx) {
      return false;
    }

    return policyHandlers.every((handler) => handler(ctx.ability));
  }
}
