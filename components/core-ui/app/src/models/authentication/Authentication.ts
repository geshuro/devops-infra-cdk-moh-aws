import { types, Instance } from 'mobx-state-tree';
import pkceChallenge from 'pkce-challenge';

import { useApplicationContext } from '../../app-context/application.context';
import { getQueryParam, removeQueryParams, storage } from '../../helpers/utils';
import { exchangeAuthCodeForIdToken, authStatus, getAuthRedirectUrl, logout } from '../../helpers/api';
import { websiteUrl, websiteBaseName } from '../../helpers/settings';
import localStorageKeys from '../constants/local-storage-keys';

function removeAuthCodeFromUrl() {
  const newUrl = removeQueryParams(document.location, ['code']);
  window.history.replaceState({}, document.title, newUrl);
}

const storeKey = 'authentication';

// ==================================================================
// Login model
// ==================================================================
export const Authentication = types
  .model('Authentication', {
    processing: false,
  })
  .actions((self) => ({
    runInAction<T>(fn: () => T) {
      return fn();
    },

    async isAuthenticated(): Promise<boolean> {
      // check if there is a code in the query params.
      const code = getQueryParam(document.location, 'code');
      if (code) {
        // we assume that the code is an auth code and attempt a token exchange
        removeAuthCodeFromUrl(); // we remove the Auth Code from the url for a good security measure

        // get the PKCE verification code from localstorage
        const pkceVerifier = storage.getItem(localStorageKeys.pkceVerifier);

        // this is a one-time code so we delete it as it is no longer useful after this
        storage.removeItem(localStorageKeys.pkceVerifier);

        await exchangeAuthCodeForIdToken(code, websiteUrl!, pkceVerifier);
      }

      // now check if we are logged in
      const status = await authStatus();

      return status.isAuthenticated;
    },

    async login() {
      let adjustedPath = window.location.pathname;
      if (websiteBaseName) {
        adjustedPath = adjustedPath.replace(websiteBaseName, '');
      }
      const currLocation = {
        pathname: adjustedPath,
        search: window.location.search,
      };
      const state = btoa(JSON.stringify({ location: currLocation }));

      const challenge = pkceChallenge(128);

      // save the PKCE verification code to local storage
      // we need to present this code after we are redirected back from the IDP
      const setItemSuccess = storage.setItem(localStorageKeys.pkceVerifier, challenge.code_verifier);

      // make sure, we only present the challenge when we have successfully saved the verifier
      const codeChallenge = setItemSuccess ? challenge.code_challenge : undefined;

      const authorizeResponse = await getAuthRedirectUrl(websiteUrl!, state, codeChallenge);

      window.location = authorizeResponse.redirectUrl as unknown as Location;
    },

    async logout() {
      const logoutResponse = await logout(websiteUrl!);
      if (logoutResponse.logoutUrl) {
        window.location = logoutResponse.logoutUrl as unknown as Location;
      } else {
        window.location = websiteUrl as unknown as Location;
      }
    },
  }));

export type AuthenticationInstance = Instance<typeof Authentication>;

export function registerContextItems(appContext: any): void {
  appContext[storeKey] = Authentication.create({}, appContext);
}

export function useAuthenticationStore(): AuthenticationInstance {
  const ctx = useApplicationContext();
  return ctx[storeKey];
}
