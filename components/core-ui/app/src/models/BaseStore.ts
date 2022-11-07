import { types } from 'mobx-state-tree';
import { toErr, Err } from './Err';

// A four-state model that has the following states:
//  +---------+                   +-----------+
//  | initial |            +----> |   ready   |
//  +---------+            |      +-----------+
//                         |
//      + ^                |         + ^
//      | |                |         | | success
// load | | error          |    load | | or error
//      v +                |         v +
//                         |
//  +---------+            |      +-----------+
//  | loading +------------+      | reloading |
//  +---------+   success         +-----------+
//
// state: <initial|loading|ready|reloading>
// error: <error object> if there is an error otherwise <undefined>
// empty: <true> if state is ready or reloading and the content is considered empty
export const BaseStore = types
  .model('BaseStore', {
    state: 'initial',
    error: types.maybe(Err),
    tickPeriod: 7 * 1000, // 7 seconds
    heartbeatInterval: 0,
  })
  .actions(() => ({
    // I had issues using runInAction from mobx
    // the issue is discussed here https://github.com/mobxjs/mobx-state-tree/issues/915
    runInAction<T>(fn: () => T) {
      return fn();
    },

    async load(): Promise<any> {
      // override
    },

    async doLoad(...args: any[]): Promise<any> {
      // override in consumer
    },
    shouldHeartbeat: () => true,
    stopHeartbeat: () => undefined,
    startHeartbeat: () => undefined,
  }))
  .actions((self) => {
    let loadingPromise: Promise<void> | undefined;

    return {
      load: (...args: any[]) => {
        if (loadingPromise) return loadingPromise;

        // self.error = undefined; we don't want to clear the error here
        if (self.state === 'ready') self.state = 'reloading';
        else self.state = 'loading';

        loadingPromise = new Promise((resolve, reject) => {
          // if ((self.state === 'loading') || (self.state === 'reloading')) return;
          try {
            self
              .doLoad(...args)
              .then(() => {
                self.runInAction(() => {
                  self.state = 'ready';
                  self.error = undefined;
                });
                loadingPromise = undefined;
                resolve();
              })
              .catch((err) => {
                self.runInAction(() => {
                  self.state = self.state === 'loading' ? 'initial' : 'ready';
                  self.error = toErr(err);
                });
                loadingPromise = undefined;
                reject(err);
              });
          } catch (err) {
            self.runInAction(() => {
              self.state = self.state === 'loading' ? 'initial' : 'ready';
              self.error = toErr(err);
            });
            loadingPromise = undefined;
            reject(err);
          }
        });

        return loadingPromise;
      },

      startHeartbeat: () => {
        if (self.heartbeatInterval !== 0) return; // there is one running
        if (!self.shouldHeartbeat()) return;
        const id = setInterval(async () => {
          if (!self.shouldHeartbeat()) return;
          try {
            await self.load();
          } catch (err) {
            /* ignore */
          }
        }, self.tickPeriod);
        self.heartbeatInterval = id as any;
      },
      shouldHeartbeat: () => true, // extender can override this method
      stopHeartbeat: () => {
        const id = self.heartbeatInterval;
        if (id !== 0) {
          clearInterval(id);
          self.heartbeatInterval = undefined as any;
        }
      },
      changeTickPeriod(periodMs: number) {
        const beating = (self as any).heartBeating;
        self.tickPeriod = periodMs;
        if (beating) {
          self.stopHeartbeat();
          self.startHeartbeat();
        }
      },
      cleanup: () => {
        self.stopHeartbeat();
        self.state = 'initial';
        self.error = undefined;
      },
    };
  })

  .views((self) => ({
    get heartBeating() {
      return self.heartbeatInterval > 0;
    },
    get initial() {
      return self.state === 'initial';
    },
    get ready() {
      return self.state === 'ready';
    },
    get loading() {
      return self.state === 'loading';
    },
    get reloading() {
      return self.state === 'reloading';
    },
    get errorMessage() {
      return self.error ? self.error.message || 'unknown error' : '';
    },
  }));

export const isStoreReady = (obj: any) => obj.ready || obj.reloading;
export const isStoreEmpty = (obj: any) => (obj.ready || obj.reloading) && obj.empty;
export const isStoreNotEmpty = (obj: any) => (obj.ready || obj.reloading) && !obj.empty;
export const isStoreLoading = (obj: any) => obj.loading;
export const isStoreReloading = (obj: any) => obj.reloading;
export const isStoreNew = (obj: any) => obj.initial;
export const isStoreError = (obj: any) => !!obj.error;
