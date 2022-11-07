import { AbilityBuilder, AnyAbility } from '@casl/ability';
import { Principal } from '../../models/principal';
import { Action } from '../../models/action';
import { User } from '../../models/user';
import { CoreRoles, UserRole } from '../../models/user-role';

export const addCoreAbilities = (principal: Principal, builder: AbilityBuilder<AnyAbility>): void => {
  const { can, cannot } = builder;

  // No need to check if a user is enabled because
  // the IDP prevents disabled users from logging in.

  if (principal.userRoles.includes(CoreRoles.Admin)) {
    // User management for admins
    can(Action.Manage, User);

    // Role management for admins
    can(Action.Manage, UserRole);
  } else {
    // User read for non-admins
    can(Action.Read, User, { uid: principal.uid }); // can read own User

    // User update for non-admins
    can(Action.Update, User, { uid: principal.uid }); // can only manage own User
    cannot(Action.Update, User, ['userRoles', 'enabled']); // normal users cannot elevate or lock themselves

    // Role read for non-admins
    can(Action.Read, UserRole, { id: { $in: principal.userRoles } }); // can only see own Role
  }
};
