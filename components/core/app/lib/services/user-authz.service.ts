import { Ability, InferSubjects } from '@casl/ability';
import { Injectable, Inject } from '@nestjs/common';

import { AuthorizationProvider } from '../extensions/authorization.provider';
import { Principal } from '../models/principal';
import { Action } from '../models/action';
import { UserRole } from '../models/user-role';
import { User } from '../models/user';

export type CoreSubjects = InferSubjects<typeof User | typeof UserRole> | 'all';
export type CoreAbility = Ability<[Action, CoreSubjects]>;

@Injectable()
export class UserAuthzService<A extends string = Action, S = CoreSubjects> {
  constructor(@Inject(AuthorizationProvider) private readonly authzProvider: AuthorizationProvider) {}

  async getAbilitiesOf(principal: Principal): Promise<Ability<[A, S]>> {
    return this.authzProvider.getUserAbilities(principal) as Promise<Ability<[A, S]>>;
  }
}
