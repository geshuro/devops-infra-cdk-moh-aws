import path from 'path';

import { invokeMethodInDir } from '../helpers/invoke-method';
import { Registry, registryWrapper } from '../helpers/registry';
import { RegistryContent } from '../models/registry-content';

export async function registerResources({
  clientSession,
}): Promise<{ registry: Registry; resources: RegistryContent }> {
  const { dependencyGraph } = clientSession.setup;
  const registry = new Registry();

  // For each tests dir, look under support/resources and register any resource nodes if they export
  // 'registerResources()' function.
  for (const node of dependencyGraph) {
    const testsDir = node.testsDir;
    const dir = path.join(testsDir, 'support/resources');

    // invokeMethodInDir knows how to find the files and the method
    await invokeMethodInDir({ dir, methodName: 'registerResources' }, async (file, method) => {
      const source = { name: node.name, file };
      const wrapper = registryWrapper({ registry, source });

      // Call the registerResources() exported by the js file
      return method({ clientSession, registry: wrapper });
    });
  }

  // At this point, the registry contains all the TOP LEVEL resource node class instances keyed by their names.
  const resources = registry.entries();

  return { registry, resources };
}
