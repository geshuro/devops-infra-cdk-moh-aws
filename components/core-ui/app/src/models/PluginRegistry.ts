import _ from 'lodash';
import { processSequentially } from '../helpers/utils';

export type Registry = {
  getPlugins(extensionPoint: string): unknown[] | undefined;
};

type ClassWithMethods<T = unknown> = Record<string, (...args: unknown[]) => T | Promise<T>>;

export class PluginRegistry {
  constructor(private readonly registry: Registry) {}

  getPlugins<T = unknown>(extensionPoint: string): T[] | undefined {
    return this.registry.getPlugins(extensionPoint) as T[];
  }

  getPluginsWithMethod<T = unknown>(extensionPoint: string, methodName: string): T[] {
    const registry = this.registry;
    const plugins = registry.getPlugins(extensionPoint);
    return _.filter(plugins, (plugin: ClassWithMethods) => typeof plugin[methodName] === 'function') as T[];
  }

  async runPlugins<T = unknown>(extensionPoint: string, methodName: string, ...args: unknown[]): Promise<T[]> {
    const plugins = this.getPluginsWithMethod<ClassWithMethods<T>>(extensionPoint, methodName);

    // Each plugin needs to be executed in order. The plugin method may be return a promise we need to await
    // it in sequence.
    return processSequentially<ClassWithMethods<T>, T>(
      plugins,
      async (plugin): Promise<T> => plugin[methodName](...args),
    );
  }

  /**
   * A method to visit plugins that implement the specified method for the specified extension point.
   * The method calls each plugin in the same order as registered in the plugin registry.
   * It invokes the specified method on each plugin and passes a result returned by the previous plugin call.
   * This gives each plugin a chance to contribute to the payload. Each plugin can inspect the given payload and return
   * it "as is" or return a modified payload. The payload returned by the last plugin is considered the resultant payload
   * and returned to the caller.
   *
   * @param extensionPoint Name of the extension point in the plugin registry mapped to corresponding plugins
   *
   * @param methodName Name of the plugin method to call. The plugin method will be invoked with the payload as the
   * first argument followed by any other arguments specified by the "args".
   *
   * @param options Various options for this call
   * @param options.payload Value of the initial payload to pass to the first plugin
   * @param options.continueOnError Optional flag indicating if the method should continue (i.e., continue calling the
   * next plugin) when a plugin throws error. Defaults to false.
   * @param options.pluginInvokerFn An optional plugin invoker function that invokes plugin. Default plugin invoker
   * calls the plugin method with the following arguments (payloadSoFar, ...args). The "payloadSoFar" is the payload
   * collected so far from previous plugins. The "...args" are any other arguments passed to this method. The
   * "pluginInvokerFn" can be used in cases where the plugin method signature does not match the "(payloadSoFar, ...args)"
   * signature. A custom implementation of "pluginInvokerFn" can be passed in such cases to customize the way the
   * plugin is called. The "pluginInvokerFn" is called with the following arguments "(pluginPayload, plugin, method, ...args)"
   *
   * @param args Any other arguments to pass to the plugins
   */
  visitPlugins<T = unknown>(
    extensionPoint: string,
    methodName: string,
    { payload = {}, continueOnError = false }: { payload?: unknown; continueOnError?: boolean } = {},
    ...args: unknown[]
  ): T {
    const plugins = this.getPluginsWithMethod(extensionPoint, methodName);

    let payloadSoFar = payload;
    // eslint-disable-next-line no-restricted-syntax
    for (const plugin of plugins) {
      try {
        payloadSoFar = (plugin as ClassWithMethods)[methodName]?.(payloadSoFar, ...args);
      } catch (err) {
        if (!continueOnError) {
          throw err;
        }
      }
    }
    return payloadSoFar as T;
  }
}
