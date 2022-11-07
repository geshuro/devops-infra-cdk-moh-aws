import { Ability, defineAbility, ForbiddenError } from '@casl/ability';
import { CoreSubjects } from '../services/user-authz.service';
import { Action } from './action';
import { Principal } from './principal';

export class RequestContext<A extends string = Action, S = CoreSubjects> {
  readonly authenticated: boolean;
  readonly principal?: Principal;
  readonly i18n: unknown;
  readonly ability: Ability<[A, S]>;
  readonly assertAbility: ForbiddenError<Ability<[A, S]>>;

  static anonymous<A extends string = Action, S = CoreSubjects>(): RequestContext<A, S> {
    return new RequestContext<A, S>({
      authenticated: false,
      ability: defineAbility(() => {}), // allow nothing
    });
  }

  static authenticated<A extends string = Action, S = CoreSubjects>(props: {
    principal?: Principal;
    ability: Ability<[A, S]>;
    i18n: unknown;
  }): RequestContext<A, S> {
    return new RequestContext<A, S>({
      ...props,
      authenticated: true,
    });
  }

  private constructor(props: {
    authenticated: boolean;
    principal?: Principal;
    ability: Ability<[A, S]>;
    i18n?: unknown;
  }) {
    this.authenticated = props.authenticated;
    this.principal = props.principal;
    this.i18n = props.i18n;
    this.ability = props.ability;
    this.assertAbility = ForbiddenError.from(props.ability);
  }
}
