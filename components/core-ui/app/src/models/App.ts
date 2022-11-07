import { types, Instance } from 'mobx-state-tree';

import type { AppContext } from '../app-context/app-context';
import { useApplicationContext } from '../app-context/application.context';
import { getQueryParam, removeQueryParams } from '../helpers/utils';

const storeKey = 'app';

export const App = types
  .model('BaseApp', {
    userAuthenticated: false,
  })
  .actions((self) => ({
    // I had issues using runInAction from mobx
    // the issue is discussed here https://github.com/mobxjs/mobx-state-tree/issues/915
    runInAction(fn: () => unknown): unknown {
      return fn();
    },

    setUserAuthenticated(flag: boolean) {
      self.userAuthenticated = flag;
    },
  }))
  .actions((self) => ({
    init: async (payload: { authInfo?: { isAuthenticated?: string } }) => {
      const isAuthenticated = payload?.authInfo?.isAuthenticated;
      if (isAuthenticated) {
        self.setUserAuthenticated(true);
      }
    },

    /**
     * Attempts to retrieve an app location from the "state" URL fragment, returning undefined if not present
     */
    getRouteLocationFromState() {
      let stateLocation;
      const b64State = getQueryParam(document.location, 'state');
      if (b64State) {
        removeQueryParams(document.location, ['state']);
        try {
          // base64-decode state string and parse JSON object with shape { location: { pathname, search } }
          const state = JSON.parse(atob(decodeURIComponent(b64State)));
          const { location } = state;
          if (location.pathname) {
            // Combine URL path and query parameters
            stateLocation = location.pathname + (location.search || '');
          }
        } catch (error) {
          console.warn('Failed to parse base64-encoded state fragment', { error });
        }
      }
      return stateLocation;
    },

    // this method is called by the Cleaner
    cleanup() {
      self.setUserAuthenticated(false);
    },
  }));

export function registerContextItems(appContext: AppContext): void {
  appContext[storeKey] = App.create({}, appContext);
}

export type AppInstance = Instance<typeof App>;

export function useApp(): AppInstance {
  const ctx = useApplicationContext();
  return ctx[storeKey];
}
