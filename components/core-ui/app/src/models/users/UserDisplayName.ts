import { types, getEnv, Instance } from 'mobx-state-tree';

import type { AppContext } from '../../app-context/app-context';
import type { UserIdentifier, UsersStoreInstance } from './UsersStore';
import { UserStoreInstance } from './UserStore';
import { useApplicationContext } from '../../app-context/application.context';

const storeKey = 'userDisplayName';

// A convenient model that returns the display name or long display name given a user identifier
export const UserDisplayName = types.model('UserDisplayName', {}).views((self) => ({
  getDisplayName({ uid }: { uid: string }): string {
    if (!uid) {
      const userStore: UserStoreInstance = getEnv(self).userStore;
      return userStore.user?.displayName ?? 'Unknown';
    }

    if (uid === '_system_') return 'System';

    const usersStore = getEnv(self).usersStore;
    const user = usersStore.asUserObject({ uid });

    return user?.displayName ?? 'unknown';
  },

  // identifier: can be an instance of '_system_', other string or undefined
  getLongDisplayName(identifier: UserIdentifier | '_system_'): string {
    if (!identifier) {
      const userStore: UserStoreInstance = getEnv(self).userStore;
      return userStore.user?.longDisplayName ?? 'Unknown';
    }

    if (identifier === '_system_') return 'System';

    const usersStore = getEnv(self).usersStore;
    const user = usersStore.asUserObject(identifier);

    return user?.longDisplayName ?? 'unknown';
  },

  isSystem(identifier: UserIdentifier | '_system_'): boolean {
    if (!identifier) {
      const userStore: UserStoreInstance = getEnv(self).userStore;
      return !!userStore.user?.isSystem;
    }

    if (identifier === '_system_') return true;

    const usersStore: UsersStoreInstance = getEnv(self).usersStore;
    const user = usersStore.asUserObject(identifier);

    return !!user?.isSystem;
  },
}));

export function registerContextItems(appContext: AppContext): void {
  appContext[storeKey] = UserDisplayName.create({}, appContext);
}

export type UserDisplayNameInstance = Instance<typeof UserDisplayName>;

export function useUserDisplayName(): UserDisplayNameInstance {
  const ctx = useApplicationContext();
  return ctx[storeKey];
}
