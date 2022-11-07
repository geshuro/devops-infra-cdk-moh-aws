import _ from 'lodash';
import { applySnapshot, detach, getSnapshot, types, Instance } from 'mobx-state-tree';

import { addUser, getUsers, getUserByUid, updateUser, deleteUser } from '../../helpers/api';
import { User, UserSnapshotIn } from './User';
import { BaseStore } from '../BaseStore';
import { DropdownOption, SelectOption } from '../ControlOption';
import { useApplicationContext } from '../../app-context/application.context';

export type UserIdentifier = { uid: string; username?: string; ns?: string };

const storeKey = 'usersStore';

export const UsersStore = BaseStore.named('UsersStore')
  .props({
    users: types.optional(types.map(User), {}),
  })

  .actions((self) => {
    // save the base implementation of cleanup
    const superCleanup = self.cleanup;

    return {
      async doLoad() {
        const usersResult = await getUsers();
        const users = usersResult.items ?? [];
        self.runInAction(() => {
          const map: Record<string, User> = {};
          users.forEach((user) => {
            const uid = user.uid;
            map[uid] = user;
          });
          self.users.replace(map);
        });
      },

      cleanup: () => {
        self.users.clear();
        superCleanup();
      },
      addUser: async (user: Partial<UserSnapshotIn>) => {
        const addedUser = await addUser(user);
        self.runInAction(() => {
          // Added newly created user to users map
          const addedUserModel = User.create(addedUser);
          self.users.set(addedUserModel.id, addedUserModel);
        });
      },
      loadUser: async (user: User) => {
        const loadedUser = await getUserByUid(user.id);
        const userModel = User.create(loadedUser);
        const previousUser = self.users.get(userModel.id) as User;
        self.runInAction(() => {
          if (previousUser) {
            applySnapshot(previousUser, loadedUser);
          } else {
            self.users.set(userModel.id, userModel);
          }
        });
      },
      updateUser: async (user: UserSnapshotIn) => {
        const updatedUser = await updateUser(user);
        const userModel = User.create(updatedUser);
        const previousUser = self.users.get(userModel.id) as User;
        applySnapshot(previousUser, updatedUser);
      },
      deleteUser: async (user: User) => {
        const uid = user?.uid;
        await deleteUser(uid);
        const deletedUser = self.users.get(uid);
        self.runInAction(() => {
          // Detaching here instead of deleting because the ReactTable component in UsersList somehow still fires
          // "Cell" component rendering after the user is deleted from the map
          // That results in the following error
          // "You are trying to read or write to an object that is no longer part of a state tree. (Object type: 'User', Path upon death: "
          detach(deletedUser);
        });
      },
    };
  })

  .views((self) => ({
    get empty(): boolean {
      return self.users.size === 0;
    },

    get list(): User[] {
      const result: User[] = [];
      // converting map self.users to result array
      self.users.forEach((user) => result.push(user));
      return result;
    },

    asSelectOptions({ nonClearables = [] }: { nonClearables?: string[] } = {}): SelectOption[] {
      const result: SelectOption[] = [];
      self.users.forEach((user) =>
        result.push({
          value: user.id,
          label: user.longDisplayName,
          clearableValue: !nonClearables.includes(user.id),
        }),
      );
      return result;
    },

    asDropDownOptions({ enabled = true }: { enabled?: boolean } = {}): DropdownOption[] {
      const result: DropdownOption[] = [];
      self.users.forEach((user) => {
        if (typeof enabled !== 'boolean' || user.enabled === enabled) {
          result.push({
            key: user.id,
            value: user.id,
            text: user.longDisplayName,
          });
        }
      });
      return result;
    },

    asUserObject(userIdentifier: UserIdentifier): User | undefined {
      if (userIdentifier) {
        const { uid, username } = userIdentifier;
        const user = self.users.get(uid);
        return user || User.create({ username });
      }
      return undefined;
    },

    asUserObjects(userIdentifiers: UserIdentifier[] = []) {
      const result: User[] = [];
      userIdentifiers.forEach((userIdentifier) => {
        if (userIdentifier) {
          const user = self.users.get(userIdentifier.uid);
          if (user) {
            result.push(user);
          } else {
            result.push(User.create(getSnapshot(userIdentifier as User)));
          }
        }
      });

      return result;
    },
  }));

export function toUserIds(userObjects: User[]): string[] {
  return _.map(userObjects, (user) => user.id);
}

export function toLongNames(userObjects: User[]): string[] {
  return _.map(userObjects, (user) => user.longDisplayName);
}

export function toLongName(object: User): string {
  if (object) {
    return object.longDisplayName;
  }
  return 'Unknown';
}

export function registerContextItems(appContext: any): void {
  appContext[storeKey] = UsersStore.create({}, appContext);
}

export type UsersStoreInstance = Instance<typeof UsersStore>;

export function useUsersStore(): UsersStoreInstance {
  const ctx = useApplicationContext();
  return ctx[storeKey];
}
