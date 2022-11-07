import { itProp, fc } from 'jest-fast-check';
import {
  isStoreReady,
  isStoreEmpty,
  isStoreNotEmpty,
  isStoreLoading,
  isStoreReloading,
  isStoreNew,
  isStoreError,
} from '../BaseStore';

describe('BaseStore', () => {
  itProp(
    'boolean functions return values corresponding to ready, reloading, empty, error and initial',
    [fc.boolean(), fc.boolean(), fc.boolean(), fc.boolean(), fc.boolean(), fc.boolean()],
    (ready, loading, reloading, empty, error, initial) => {
      const obj = { ready, loading, reloading, empty, error, initial };
      const readyOrReloading = ready || reloading;
      expect(isStoreReady(obj)).toBe(readyOrReloading);
      expect(isStoreEmpty(obj)).toBe(readyOrReloading && empty);
      expect(isStoreNotEmpty(obj)).toBe(readyOrReloading && !empty);
      expect(isStoreLoading(obj)).toBe(loading);
      expect(isStoreReloading(obj)).toBe(reloading);
      expect(isStoreNew(obj)).toBe(initial);
      expect(isStoreError(obj)).toBe(error);
    }, //
  );
});
