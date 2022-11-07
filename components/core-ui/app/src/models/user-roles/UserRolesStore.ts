import _ from 'lodash';
import { values } from 'mobx';
import { types, Instance } from 'mobx-state-tree';

import { BaseStore } from '../BaseStore';
import { useApplicationContext } from '../../app-context/application.context';
import { consolidateToMap } from '../../helpers/utils';
import { getUserRoles } from '../../helpers/api';
import { UserRole } from './UserRole';
import { DropdownOption } from '../ControlOption';

const storeKey = 'userRolesStore';

// ==================================================================
// UserRolesStore
// ==================================================================
export const UserRolesStore = BaseStore.named('UserRolesStore')
  .props({
    userRoles: types.optional(types.map(UserRole), {}),
  })

  .actions((self) => {
    // save the base implementation of cleanup
    const superCleanup = self.cleanup;

    return {
      async doLoad() {
        const userRolesResult = await getUserRoles();
        const userRoles = userRolesResult?.items ?? [];
        self.runInAction(() => {
          consolidateToMap(self.userRoles, userRoles, (existing: UserRole, newItem: UserRole) => {
            existing.setUserRole(newItem);
          });
        });
      },

      cleanup: () => {
        superCleanup();
      },
    };
  })

  .views((self) => ({
    get list() {
      return values(self.userRoles) as unknown as UserRole[];
    },
    get dropdownOptions() {
      const result: DropdownOption[] = [];
      self.userRoles.forEach((userRole) => {
        const role: DropdownOption = {
          key: userRole.id,
          value: userRole.id,
          text: userRole.id,
        };
        result.push(role);
      });
      return result;
    },
  }));

export type UserRolesStoreInstance = Instance<typeof UserRolesStore>;

export function registerContextItems(appContext: any): void {
  appContext[storeKey] = UserRolesStore.create({}, appContext);
}

export function useUserRolesStore(): UserRolesStoreInstance {
  const ctx = useApplicationContext();
  return ctx[storeKey];
}
