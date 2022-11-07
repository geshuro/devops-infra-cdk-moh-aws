import _ from 'lodash';
import { observable } from 'mobx';

import { PluginRegistry, Registry } from '../models/PluginRegistry';

export const appContext = observable({});

export type AppContext = {
  disposers: Record<string, unknown>;
  intervalIds: Record<string, unknown>;
  pluginRegistry: PluginRegistry;
  assets: Record<string, any>;
  [key: string]: any;
};

type AppContextPlugins = {
  registerAppContextItems: (ctx: AppContext) => void;
};

type AppContextPostPlugins = {
  postRegisterAppContextItems: (ctx: AppContext) => void;
};

/**
 * Initializes the given appContext (application context containing various MobX stores etc) by calling each plugin's
 * "registerAppContextItems" and "postRegisterAppContextItems" methods.
 *
 * @param  pluginRegistry A registry that provides plugins registered by various components for the specified extension point.
 * Each 'contextItems' plugin in the returned array is an object containing "registerAppContextItems" and "postRegisterAppContextItems" plugin methods.
 */
export const initializeAppContext = (pluginRegistry: Registry): AppContext => {
  const registry = new PluginRegistry(pluginRegistry);
  const appContextHolder = {
    disposers: {},
    intervalIds: {},
    pluginRegistry: registry,
    assets: {
      images: {},
    },
  };

  const registerAppContextItems = registry.getPluginsWithMethod<AppContextPlugins>(
    'app-context-items',
    'registerAppContextItems',
  );
  _.forEach(registerAppContextItems, (plugin) => {
    plugin.registerAppContextItems(appContextHolder);
  });

  const postRegisterAppContextItems = registry.getPluginsWithMethod<AppContextPostPlugins>(
    'app-context-items',
    'postRegisterAppContextItems',
  );
  _.forEach(postRegisterAppContextItems, (plugin) => {
    plugin.postRegisterAppContextItems(appContextHolder);
  });

  Object.assign(appContext, appContextHolder); // this is to ensure that it is the same appContext reference whether initializeAppContext is called or not
  return appContextHolder;
};
