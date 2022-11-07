import { types, applySnapshot, Instance } from 'mobx-state-tree';

// ==================================================================
// Advanced Search Field
// ==================================================================
export const AdvancedSearchField = types
  .model('AdvancedSearchField', {
    id: types.identifier,
    label: '',
  })
  .actions((self) => ({
    setField(rawField: { id: string; label: string }) {
      applySnapshot(self, rawField);
    },
  }));

export type AdvancedSearchField = Instance<typeof AdvancedSearchField>;
