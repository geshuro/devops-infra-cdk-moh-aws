import { itProp, fc } from 'jest-fast-check';
import { PluginRegistry } from '../PluginRegistry';

describe('PluginRegistry', () => {
  describe('getPlugins', () => {
    itProp(
      'returns all plugins',
      [fc.dictionary(fc.anything(), fc.anything()), fc.anything()],
      (dictionary, extensionPoint) => {
        const registry = {
          getPlugins: key => dictionary[key],
        };
        const pluginsRegistry = new PluginRegistry(registry);
        expect(pluginsRegistry.getPlugins(extensionPoint)).toBe(dictionary[extensionPoint]);
      },
    );
  });
});
