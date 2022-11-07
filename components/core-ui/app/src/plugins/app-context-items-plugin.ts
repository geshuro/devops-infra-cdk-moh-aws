import * as appRunner from '../models/AppRunner';
import * as appStore from '../models/App';
import * as cleaner from '../models/Cleaner';
import * as sessionStore from '../models/SessionStore';
import * as showdown from '../models/Showdown';
import * as authentication from '../models/authentication/Authentication';
import * as userDisplayName from '../models/users/UserDisplayName';
import * as userRolesStore from '../models/user-roles/UserRolesStore';
import * as usersStore from '../models/users/UsersStore';
import * as userStore from '../models/users/UserStore';
import type { AppContext } from '../app-context/app-context';
import faviconIcon from '../../images/favicon.ico';
import faviconImage from '../../images/favicon-32x32.png';
import loginImage from '../../images/login-image.gif';
import logoImage from '../../images/logo-image.png';

/**
 * Registers base stores to the appContext object
 *
 * @param appContext An application context object
 */
// eslint-disable-next-line no-unused-vars
function registerAppContextItems(appContext: AppContext): void {
  appRunner.registerContextItems(appContext);
  appStore.registerContextItems(appContext);
  cleaner.registerContextItems(appContext);
  sessionStore.registerContextItems(appContext);
  showdown.registerContextItems(appContext);
  authentication.registerContextItems(appContext);
  userDisplayName.registerContextItems(appContext);
  userRolesStore.registerContextItems(appContext);
  usersStore.registerContextItems(appContext);
  userStore.registerContextItems(appContext);
  appContext.assets.images.faviconIcon = faviconIcon;
  appContext.assets.images.faviconImage = faviconImage;
  appContext.assets.images.loginImage = loginImage;
  appContext.assets.images.logoImage = logoImage;
}

// eslint-disable-next-line no-unused-vars
function postRegisterAppContextItems(_appContext: AppContext): void {
  // No impl at this level
}

const plugin = {
  registerAppContextItems,
  postRegisterAppContextItems,
};
export default plugin;
