import type { AppContext } from '../app-context/app-context';

type InitPlugin = {
  init(payload: unknown, appContext: AppContext): Promise<void>;
};

type PostInitPlugin = {
  postInit(payload: unknown, appContext: AppContext): Promise<void>;
};

export class AppRunner {
  constructor(private readonly appContext: AppContext) {}

  async run(): Promise<void> {
    const appContext = this.appContext;
    const registry = appContext.pluginRegistry;
    const initPlugins = registry.getPluginsWithMethod<InitPlugin>('initialization', 'init');
    const payload: { externalRedirectUrl?: Location } = {};

    // Ask each plugin to run init()
    // eslint-disable-next-line no-restricted-syntax
    for (const plugin of initPlugins) {
      await plugin.init(payload, appContext);
    }

    // Did any plugin want to do an external redirect?
    if (payload.externalRedirectUrl) {
      window.location = payload.externalRedirectUrl;
      return;
    }

    const postInitPlugins = registry.getPluginsWithMethod<PostInitPlugin>('initialization', 'postInit');
    // Ask each plugin to run postInit()
    // eslint-disable-next-line no-restricted-syntax
    for (const plugin of postInitPlugins) {
      await plugin.postInit(payload, appContext);
    }

    // Did any plugin want to do an external redirect?
    if (payload.externalRedirectUrl) {
      window.location = payload.externalRedirectUrl;
      return;
    }

    const app = appContext.app;
    await app.init(payload);
  }
}

export function registerContextItems(appContext: AppContext): void {
  appContext.appRunner = new AppRunner(appContext);
}
