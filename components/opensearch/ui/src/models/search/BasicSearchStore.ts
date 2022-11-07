import { Instance, types } from 'mobx-state-tree';
import { AppContext, BaseStore, useApplicationContext } from '@aws-ee/core-ui';

import { basicSearch } from '../../helpers/api';

// ==================================================================
// SearchStore
// ==================================================================

const storeKey = 'basicSearchStoreMap';

const BasicSearchStore = BaseStore.named('BasicSearchStore')
  .props({
    domain: types.string,
    matches: types.optional(types.array(types.frozen()), []),
  })
  .actions((self) => {
    // save the base implementation of cleanup
    const superCleanup = self.cleanup;

    return {
      async search(query: string, returnFullDocuments: boolean, highlightFields: string[]) {
        const matches = await basicSearch(self.domain, query, returnFullDocuments, highlightFields);

        self.runInAction(() => {
          self.matches.replace(matches);
        });
      },

      clear() {
        self.matches.clear();
      },

      cleanup: () => {
        superCleanup();
      },
    };
  });

export type BasicSearchStore = Instance<typeof BasicSearchStore>;
export type BasicSearchStoreMap = Record<string, BasicSearchStore>;

export function registerContextItems(appContext: AppContext, domain: string) {
  if (!appContext[storeKey]) {
    appContext[storeKey] = {};
  }

  appContext[storeKey][domain] = BasicSearchStore.create({ domain });
}

export function useBasicSearchStoreMap(): BasicSearchStoreMap {
  const ctx = useApplicationContext();
  return ctx[storeKey];
}
