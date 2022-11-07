/* eslint-disable you-dont-need-lodash-underscore/omit */
/* eslint-disable you-dont-need-lodash-underscore/is-function */
/* eslint-disable you-dont-need-lodash-underscore/is-nil */
/* eslint-disable you-dont-need-lodash-underscore/filter */
/* eslint-disable you-dont-need-lodash-underscore/keys */
/* eslint-disable no-console */
import _ from 'lodash';
import { parseError, delay, removeNulls } from './utils';
import { apiPath } from './settings';
import type { User, UserSnapshotIn } from '../models/users/User';
import type { UserRole } from '../models/user-roles/UserRole';
import type { ListResult } from '../models/ListResult';

export const config = {
  apiPath,
  fetchMode: 'cors',
  maxRetryCount: 4,
};

export function getApiPath(): string | undefined {
  let apiPath = config.apiPath;

  if (apiPath?.endsWith('/')) {
    apiPath = apiPath.substring(0, apiPath.length - 1);
  }
  return apiPath;
}

type FetchJsonOpts = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  params?: Record<string, string>;
  body?: BodyInit | null | undefined;
};

export function fetchJson<T = Response>(
  url: string,
  options: FetchJsonOpts = {},
  retryCount = 0,
  tokenRefreshAttempted = false,
): Promise<T> {
  // see https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
  let isOk = false;
  let httpStatus: number;

  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };
  const body = '' as RequestInit['body'];
  const merged = {
    method: 'GET' as 'GET' | 'POST' | 'PUT' | 'DELETE',
    credentials: 'include' as RequestInit['credentials'],
    cache: 'no-cache' as RequestInit['cache'],
    mode: config.fetchMode as RequestInit['mode'],
    redirect: 'follow' as RequestInit['redirect'],
    body,
    ...options,
    headers: { ...headers, ...options.headers },
  };

  if (merged.method === 'GET') delete merged.body; // otherwise fetch will throw an error

  if (merged.params) {
    // if query string parameters are specified then add them to the URL
    // The merged.params here is just a plain JavaScript object with key and value
    // For example {key1: value1, key2: value2}

    // Get keys from the params object such as [key1, key2] etc
    const paramKeys = _.keys(merged.params);

    // Filter out params with undefined or null values
    const paramKeysToPass = _.filter(paramKeys, (key) => !_.isNil(_.get(merged.params, key)));
    const query = _.map(
      paramKeysToPass,
      (key) => `${encodeURIComponent(key)}=${encodeURIComponent(_.get(merged.params, key)!)}`,
    ).join('&');
    url = query ? `${url}?${query}` : url;

    // Delete merged.params after they are added to the url as query string params
    // This is required otherwise, if the call fails for some reason (e.g., time out) the same query string params
    // will be added once again to the URL causing duplicate params being passed in.
    // For example, if the merge.params = { param1: 'value1', param2: 'value2' }
    // The url will become something like `https://some-host/some-path?param1=value1&param2=value2`
    // If we do not delete "merged.params" here and if the call is retried (with a recursive call to "fetchJson") due
    // to timeout or any other issue, the url will then become
    // `https://some-host/some-path?param1=value1&param2=value2?param1=value1&param2=value2`
    delete merged.params;
  }

  return Promise.resolve()
    .then(() => fetch(url, merged))
    .catch((err) => {
      // this will capture network/timeout errors, because fetch does not consider http Status 5xx or 4xx as errors
      if (retryCount < config.maxRetryCount) {
        let backoff = retryCount * retryCount;
        if (backoff < 1) backoff = 1;

        return Promise.resolve()
          .then(() => console.log(`Retrying count = ${retryCount}, Backoff = ${backoff}`))
          .then(() => delay(backoff))
          .then(() => fetchJson(url, merged, retryCount + 1));
      }
      throw parseError(err);
    })
    .then((response) => {
      isOk = response.ok;
      httpStatus = response.status;
      if (httpStatus === 401 && !tokenRefreshAttempted && !url.endsWith('/oauth2/refresh')) {
        return Promise.resolve()
          .then(() => refreshToken())
          .then(() => fetchJson(url, options, 0, true));
      }
      return response;
    })
    .then(async (response) => {
      if (_.isFunction(response.text)) return response.text();
      return response;
    })
    .then((text) => {
      let json;
      try {
        if (_.isObject(text)) {
          json = text;
        } else {
          json = JSON.parse(text);
        }
      } catch (err) {
        console.log(err);
        if (httpStatus >= 400) {
          if (httpStatus >= 501 && retryCount < config.maxRetryCount) {
            let backoff = retryCount * retryCount;
            if (backoff < 1) backoff = 1;

            return Promise.resolve()
              .then(() => console.log(`Retrying count = ${retryCount}, Backoff = ${backoff}`))
              .then(() => delay(backoff))
              .then(() => fetchJson(url, options, retryCount + 1));
          }
          throw parseError({
            message: text as string,
            status: httpStatus,
          });
        } else {
          throw parseError(new Error('The server did not return a json response.'));
        }
      }

      return json;
    })
    .then((json) => {
      if (_.isBoolean(isOk) && !isOk) {
        throw parseError({ ...json, status: httpStatus });
      } else {
        return json;
      }
    });
}

// ---------- helper functions ---------------

type GetOptions = { params?: Record<string, string> };
type MutateOptions = GetOptions & { data?: unknown };

export function httpApiGet<T = Response>(urlPath: string, { params }: GetOptions = {}): Promise<T> {
  return fetchJson(`${getApiPath()}/${urlPath}`, {
    method: 'GET',
    params,
  });
}

export function httpApiPost<T = Response>(urlPath: string, { data, params }: MutateOptions = {}): Promise<T> {
  return fetchJson(`${getApiPath()}/${urlPath}`, {
    method: 'POST',
    params,
    body: JSON.stringify(data),
  });
}

export function httpApiPut<T = Response>(urlPath: string, { data, params }: MutateOptions = {}): Promise<T> {
  return fetchJson(`${getApiPath()}/${urlPath}`, {
    method: 'PUT',
    params,
    body: JSON.stringify(data),
  });
}

// eslint-disable-next-line no-unused-vars
export function httpApiDelete<T = Response>(urlPath: string, { data, params }: MutateOptions = {}): Promise<T> {
  return fetchJson(`${getApiPath()}/${urlPath}`, {
    method: 'DELETE',
    params,
    body: JSON.stringify(data),
  });
}

// ---------- api calls ---------------

export async function authStatus(): Promise<{ isAuthenticated: boolean }> {
  try {
    await httpApiGet('api/authentication/status');
    return { isAuthenticated: true };
  } catch {
    return { isAuthenticated: false };
  }
}

export function logout(redirectUrl: string): Promise<{ logoutUrl?: string }> {
  return httpApiPost('api/oauth2/logout', { data: { redirectUrl } });
}

export function getAuthRedirectUrl(
  redirectUrl: string,
  state: string,
  pkceChallenge?: string,
): Promise<{ redirectUrl: string }> {
  const urlPath = 'api/oauth2/authorize';
  const data = { redirectUrl, state, pkceChallenge };
  return fetchJson(`${getApiPath()}/${urlPath}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function refreshToken(): Promise<void> {
  return httpApiPost('api/oauth2/refresh', { data: {} });
}

export function exchangeAuthCodeForIdToken(code: string, redirectUrl: string, pkceVerifier?: string): Promise<void> {
  const urlPath = 'api/oauth2/token';
  const data = { code, redirectUrl, pkceVerifier };
  return fetchJson(`${getApiPath()}/${urlPath}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function getCurrentUser(): Promise<UserSnapshotIn> {
  return httpApiGet('api/user');
}

export function updateCurrentUser(user: UserSnapshotIn): Promise<UserSnapshotIn> {
  const params = {};

  // Remove nulls and omit extra fields from the payload before calling the API
  const data: Partial<User> = removeNulls(
    _.omit(_.clone(user), 'id', 'uid', 'username', 'createdBy', 'updatedBy', 'userRole', 'enabled'),
  );
  return httpApiPut(`api/user`, { data, params });
}

export function getUserByUid(uid: string): Promise<UserSnapshotIn> {
  return httpApiGet(`api/users/${encodeURIComponent(uid)}`);
}

export function addUser(user: Partial<UserSnapshotIn>): Promise<UserSnapshotIn> {
  const params: Record<string, string> = {};
  const data: Partial<User> = removeNulls(_.clone(user));
  // on server side so remove it from request body
  delete (data as any).createdBy; // Similarly, createdBy and updatedBy are derived on server side
  delete (data as any).updatedBy;
  return httpApiPost('api/users', { data, params });
}

export function updateUser(user: UserSnapshotIn): Promise<UserSnapshotIn> {
  const params = {};

  // Remove nulls and omit extra fields from the payload before calling the API
  // The user is identified by the uid in the url
  const data: Partial<User> = removeNulls(_.omit(_.clone(user), 'id', 'uid', 'username', 'createdBy', 'updatedBy'));
  return httpApiPut(`api/users/${encodeURIComponent(user.uid!)}`, { data, params });
}

export async function deleteUser(username: string): Promise<Response> {
  return httpApiDelete(`api/users/${encodeURIComponent(username)}`);
}

export function getUsers(): Promise<ListResult<User>> {
  return httpApiGet('api/users');
}

export function getUserRoles(): Promise<ListResult<UserRole>> {
  return httpApiGet('api/user-roles');
}
