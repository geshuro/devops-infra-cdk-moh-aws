import { types, Instance, SnapshotIn, SnapshotOut } from 'mobx-state-tree';

export const User = types
  .model('User', {
    uid: '',
    firstName: types.maybeNull(types.optional(types.string, '')),
    lastName: types.maybeNull(types.optional(types.string, '')),
    username: '',
    email: '',
    enabled: true,
    userRoles: types.array(types.string),
    claims: types.map(types.string),
  })
  .views((self) => ({
    get unknown(): boolean {
      return !self.firstName && !self.lastName;
    },

    get id(): string {
      return self.uid;
    },

    get isAdmin(): boolean {
      return self.userRoles.includes('admin');
    },
  }))
  .views((self) => ({
    get displayName(): string {
      return `${self.firstName} ${self.lastName}`;
    },

    get longDisplayName(): string {
      if (self.unknown) {
        return `${self.username}??`;
      }
      const fullName = `${self.firstName} ${self.lastName}`;
      if (self.email) {
        return `${fullName} (${self.email})`;
      }
      return fullName;
    },

    get isSystem(): boolean {
      return self.id === '_system_';
    },
  }));

export type User = Instance<typeof User>;

export type UserSnapshotIn = SnapshotIn<typeof User>;

export type UserSnapshotOut = SnapshotOut<typeof User>;
