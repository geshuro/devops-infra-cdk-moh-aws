import { types, Instance } from 'mobx-state-tree';
import { toJS } from 'mobx';
import { AppContext, BaseStore, consolidateToMap, useApplicationContext } from '@aws-ee/core-ui';

import { AdvancedSearchField } from './AdvancedSearchField';
import { advancedSearch, advancedSearchFields } from '../../helpers/api';

// ==================================================================
// AdvancedSearchStore
// ==================================================================

const storeKey = 'advancedSearchStoreMap';

const AdvancedSearchStore = BaseStore.named('AdvancedSearchStore')
  .props({
    domain: types.string,
    fields: types.optional(types.map(AdvancedSearchField), {}),
    matches: types.optional(types.array(types.frozen()), []),
  })
  .actions((self) => {
    // save the base implementation of cleanup
    const superCleanup = self.cleanup;

    return {
      async doLoad() {
        const fields = await advancedSearchFields<AdvancedSearchField>(self.domain);

        self.runInAction(() => {
          consolidateToMap<AdvancedSearchField>(self.fields, fields, (existing, newItem) => {
            existing.setField(newItem);
          });
        });
      },

      async search(query: unknown, returnFullDocuments: boolean, highlightFields: string[]) {
        const matches = await advancedSearch(self.domain, query, returnFullDocuments, highlightFields);

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
  })
  .views((self) => ({
    get listFields() {
      const fields: AdvancedSearchField[] = [];
      self.fields.forEach((field) => fields.push(toJS(field)));

      return fields;
    },
  }));

export type AdvancedSearchStore = Instance<typeof AdvancedSearchStore>;
export type AdvancedSearchStoreMap = Record<string, AdvancedSearchStore>;

export function registerContextItems(appContext: AppContext, domain: string): void {
  if (!appContext[storeKey]) {
    appContext[storeKey] = {};
  }

  appContext[storeKey][domain] = AdvancedSearchStore.create({ domain });
}

export function useAdvancedSearchStoreMap(): AdvancedSearchStoreMap {
  const ctx = useApplicationContext();
  return ctx[storeKey];
}
