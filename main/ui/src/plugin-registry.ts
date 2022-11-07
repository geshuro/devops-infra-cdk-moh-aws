import { baseAppContextItemsPlugin, baseInitializationPlugin } from '@aws-ee/core-ui';

import appContextItemsPlugin from './plugins/app-context-items-plugin';
import initializationPlugin from './plugins/initialization-plugin';

// baseAppContextItemsPlugin registers app context items (such as base MobX stores etc) provided by the base component
// baseInitializationPlugin registers the base initialization logic provided by the base ui component
// baseMenuItemsPlugin registers menu items provided by the base component
// baseRoutesPlugin registers base routes provided by the base component
const extensionPoints: Record<string, unknown[]> = {
  'app-context-items': [baseAppContextItemsPlugin, appContextItemsPlugin],
  'initialization': [baseInitializationPlugin, initializationPlugin],
};

function getPlugins(extensionPoint: string): unknown[] | undefined {
  return extensionPoints[extensionPoint];
}

const registry = {
  getPlugins,
};

export default registry;
