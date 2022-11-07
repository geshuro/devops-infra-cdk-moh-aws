import { types, applySnapshot, Instance } from 'mobx-state-tree';

// UserRole
// ==================================================================
const UserRoleBase = types.model('UserRole', {
  id: types.identifier,
  rev: types.maybe(types.number),
  description: '',
});

type UserRoleBase = Instance<typeof UserRoleBase>;

export const UserRole = UserRoleBase.actions((self) => ({
  setUserRole(rawUserRole: UserRoleBase) {
    // Note: if you have partial data vs full data, you need to replace the applySnapshot() with
    // the appropriate logic
    applySnapshot(self, rawUserRole);
  },
}));

export type UserRole = Instance<typeof UserRole>;
