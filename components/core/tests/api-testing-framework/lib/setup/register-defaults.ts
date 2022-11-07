/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import path from 'path';

import { invokeMethodInFile } from '../helpers/invoke-method';
import { Registry, registryWrapper } from '../helpers/registry';

/**
 * For each tests dir, look for support/defaults.ts, if it exists and it exports registerDefaults() function,
 * then call the function.
 *
 * Returns the populated registry and the defaults.  The defaults is a map of names and values.
 */
export async function registerDefaults({ setup }) {
  const { dependencyGraph } = setup;
  const registry = new Registry();
  // For each tests dir, look for support/defaults.ts, if it exists and if it exports
  // registerDefaults () function, then call the function
  for (const node of dependencyGraph) {
    const testsDir = node.testsDir;
    const file = path.join(testsDir, 'support/defaults.ts');

    // invokeMethodInFile knows how to find the file and the method
    await invokeMethodInFile({ file, methodName: 'registerDefaults' }, async (method) => {
      const source = { name: node.name, file };
      const wrapper = registryWrapper({ registry, source });

      // Call the registerDefaults() exported by the defaults.ts file
      return method({ setup, registry: wrapper });
    });
  }

  const defaults = registry.entries();

  return { registry, defaults };
}
