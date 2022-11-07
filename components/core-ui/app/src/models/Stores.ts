import _ from 'lodash';

import { isStoreLoading, isStoreReady, isStoreError } from './BaseStore';
import { swallowError } from '../helpers/utils';
import type { Err } from './Err';

type Store = {
  load: () => Promise<void>;
  error?: unknown;
};

// A way to load multiple stores and get the errors, etc.
class Stores {
  private stores: Store[];

  constructor(stores: Store[] = []) {
    const result: Store[] = [];
    _.forEach(stores, (store) => {
      if (!store) return;
      result.push(store);
    });

    this.stores = result;
  }

  // only if they are not loaded already, you can force loading if you want
  async load({ forceLoad = false } = {}): Promise<void> {
    _.forEach(this.stores, (store) => {
      if (!forceLoad && isStoreReady(store)) return;
      swallowError(store.load());
    });
  }

  get ready(): boolean {
    let answer = true;
    _.forEach(this.stores, (store) => {
      answer = answer && isStoreReady(store);
    });
    return answer;
  }

  get loading(): boolean {
    let answer = false;
    _.forEach(this.stores, (store) => {
      if (isStoreLoading(store)) {
        answer = true;
        return false; // to stop the loop
      }
      return undefined;
    });

    return answer;
  }

  get hasError(): boolean {
    return !!this.error;
  }

  get error(): Err | undefined {
    let error;
    _.forEach(this.stores, (store) => {
      if (isStoreError(store)) {
        error = store.error;
        return false; // to stop the loop
      }
      return undefined;
    });

    return error;
  }
}

export default Stores;
