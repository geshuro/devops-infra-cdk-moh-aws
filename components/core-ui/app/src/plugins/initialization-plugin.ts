import type { AppContext } from '../app-context/app-context';
import { AuthenticationInstance } from '../models/authentication/Authentication';

/**
 * This is where we run the initialization logic that is common across any type of applications.
 *
 * @param payload A free form object. This function makes a property named 'tokenInfo' available on this payload object.
 * @param appContext An application context object containing various Mobx Stores, Models etc.
 *
 * @returns {Promise<void>}
 */
async function init(payload: any, appContext: AppContext) {
  const { authentication }: { authentication: AuthenticationInstance } = appContext as any;

  const isAuthenticated = await authentication.isAuthenticated();
  payload.authInfo = { isAuthenticated };
}

/**
 * This is where we run the post initialization logic that is common across any type of applications.
 *
 * @param payload A free form object. This function expects a property named 'tokenInfo' to be available on the payload object.
 * @param appContext An application context object containing various Mobx Stores, Models etc.
 *
 * @returns {Promise<void>}
 */
async function postInit(payload: any, appContext: AppContext) {
  const isAuthenticated = payload?.authInfo?.isAuthenticated;
  if (!isAuthenticated) return; // Continue only if we are authenticated

  const { userStore } = appContext;
  await userStore.load();
}

const plugin = {
  init,
  postInit,
};

export default plugin;
