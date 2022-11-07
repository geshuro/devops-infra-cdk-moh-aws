import _ from 'lodash';
import { types, getEnv, Instance, applySnapshot } from 'mobx-state-tree';

import { getCurrentUser, updateCurrentUser } from '../../helpers/api';
import { BaseStore, isStoreReady } from '../BaseStore';
import { User, UserSnapshotIn } from './User';
import type { AppContext } from '../../app-context/app-context';
import { useApplicationContext } from '../../app-context/application.context';

const storeKey = 'userStore';

export const UserStore = BaseStore.named('UserStore')
  .props({
    user: types.maybe(User),
  })
  .actions((self) => {
    // save the base implementation of cleanup
    const superCleanup = self.cleanup;

    return {
      async doLoad() {
        // Get the user from the backend
        const user = await getCurrentUser();

        const userRolesStore = getEnv(self).userRolesStore;
        if (!isStoreReady(userRolesStore)) {
          await userRolesStore.load();
        }

        self.runInAction(() => {
          self.user = User.create(user);
        });
      },

      async updateUser(user: UserSnapshotIn) {
        const updatedUser = await updateCurrentUser(user);
        const previousUser = self.user!;
        applySnapshot(previousUser, updatedUser);
      },

      cleanup: () => {
        self.user = undefined;
        superCleanup();
      },
    };
  })

  .views((self) => ({
    get empty() {
      return _.isEmpty(self.user);
    },
  }));

export function registerContextItems(appContext: AppContext): void {
  appContext[storeKey] = UserStore.create({}, appContext);
}

export type UserStoreInstance = Instance<typeof UserStore>;

export function useUserStore(): UserStoreInstance {
  const ctx = useApplicationContext();
  return ctx[storeKey];
}
