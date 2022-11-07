import path from 'path';

import { settingsWrapper } from '../settings/settings';
import { invokeMethodInFile } from './invoke-method';

/**
 * For each tests dir, look for support/init.ts, if it exists and it exports an init() method,
 * then call this method and pass it (settings, aws and dependencyGraph)
 */
export async function initialize({ settings, aws, dependencyGraph }): Promise<void> {
  // For each tests dir, look for support/init.ts, if it exists and if it exports an 'init()' function,
  // then call the function and pass it (settings, aws, dependencyGraph)
  for (const node of dependencyGraph) {
    const testsDir = node.testsDir;
    const file = path.join(testsDir, 'support/init.ts');

    // invokeMethodInFile knows how to find the file and the method
    await invokeMethodInFile({ file, methodName: 'init' }, async (method) => {
      const source = { name: node.name, file };
      const wrapper = settingsWrapper({ settings, source });

      // Call the init() exported by the init.ts file
      return method({ settings: wrapper, aws, dependencyGraph });
    });
  }
}
