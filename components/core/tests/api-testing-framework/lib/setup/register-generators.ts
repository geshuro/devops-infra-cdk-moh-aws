import path from 'path';

import { invokeMethodInFile } from '../helpers/invoke-method';
import { Registry, registryWrapper } from '../helpers/registry';

/**
 * For each tests dir, look for support/generators.ts, if it exists and it exports registerGenerators() function,
 * then call the function.
 *
 * Returns the populated registry and the generators.  The generators is a map of generator names and generator
 * functions.
 *
 * IMPORTANT: these generators have nothing to do with the ES6 generators.
 *
 * The generators here are simply helper functions that return values that we can use in the tests, for example,
 * generating user names, etc.
 */
export async function registerGenerators({ setup }) {
  const { dependencyGraph } = setup;
  const registry = new Registry();
  // For each tests dir, look for support/generators.ts, if it exists and if it exports
  // registerGenerators () function, then call the function
  for (const node of dependencyGraph) {
    const testsDir = node.testsDir;
    const file = path.join(testsDir, 'support/generators.ts');

    // invokeMethodInFile knows how to find the file and the method
    await invokeMethodInFile({ file, methodName: 'registerGenerators' }, async (method) => {
      const source = { name: node.name, file };
      const wrapper = registryWrapper({ registry, source });

      // Call the registerGenerators() exported by the generators.ts file
      return method({ setup, registry: wrapper });
    });
  }

  const generators = registry.entries();

  return { registry, generators };
}
