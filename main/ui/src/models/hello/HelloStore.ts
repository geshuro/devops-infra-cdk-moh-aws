import _ from 'lodash';
import { types, Instance } from 'mobx-state-tree';
import { AppContext, BaseStore, useApplicationContext } from '@aws-ee/core-ui';

import { getHelloMessages } from '../../helpers/api';
import { Hello } from './Hello';

const storeKey = 'helloStore';

// ==================================================================
// HelloStore
// ==================================================================
export const HelloStore = BaseStore.named('HelloStore')
  .props({
    hellos: types.array(Hello),
  })
  .actions((self) => {
    // save the base implementation of cleanup
    const superCleanup = self.cleanup;

    return {
      async doLoad() {
        const hellos = await getHelloMessages();
        self.runInAction(() => {
          // Because this is an example, it is a just quick way to replace the array, but you should
          // examine each element instead and update or insert each element so that your
          // React components would update correctly by maintaining the correct references to the model
          // objects
          self.hellos.replace(hellos);
        });
      },

      cleanup() {
        self.hellos.clear();
        superCleanup();
      },
    };
  })
  .views((self) => ({
    get empty() {
      return self.hellos.length === 0;
    },

    get total() {
      return self.hellos.length;
    },

    get list() {
      // eslint-disable-next-line you-dont-need-lodash-underscore/slice
      return _.sortBy(_.slice(self.hellos), 'message');
    },
  }));

export function registerContextItems(appContext: AppContext): void {
  appContext[storeKey] = HelloStore.create({}, appContext);
}

export type HelloStoreInstance = Instance<typeof HelloStore>;

export function useHelloStore(): HelloStoreInstance {
  const ctx = useApplicationContext();
  return ctx[storeKey];
}
