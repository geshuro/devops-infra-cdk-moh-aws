import { registerContextItems } from '../AppRunner';

describe('AppRunner', () => {
  it('calls all init functions when run', async () => {
    const init = jest.fn();
    const postInit = jest.fn();
    const appInit = jest.fn();
    const appContext = {
      app: {
        init: appInit,
      },
      pluginRegistry: {
        getPluginsWithMethod: () => [{ init, postInit }],
      },
    };
    await registerContextItems(appContext);
    await appContext.appRunner.run();
    expect(init).toHaveBeenCalledTimes(1);
    expect(postInit).toHaveBeenCalledTimes(1);
    expect(appInit).toHaveBeenCalledTimes(1);
  });

  it('redirects window to external via init', async () => {
    const externalRedirectUrl = 'externalRedirectUrl';
    const init = (payload, _) => {
      payload.externalRedirectUrl = externalRedirectUrl;
    };
    const appContext = {
      app: {
        init: () => undefined,
      },
      pluginRegistry: {
        getPluginsWithMethod: () => [{ init }],
      },
    };
    global.window = {};
    await registerContextItems(appContext);
    await appContext.appRunner.run();
    expect(global.window.location).toEqual(externalRedirectUrl);
  });

  it('redirects window to external via postInit', async () => {
    const externalRedirectUrl = 'externalRedirectUrl';
    const postInit = (payload, _) => {
      payload.externalRedirectUrl = externalRedirectUrl;
    };
    const appContext = {
      app: {
        postInit: () => undefined,
      },
      pluginRegistry: {
        getPluginsWithMethod: (_, method) => (method === 'init' ? [] : [{ postInit }]),
      },
    };
    global.window = {};
    await registerContextItems(appContext);
    await appContext.appRunner.run();
    expect(global.window.location).toEqual(externalRedirectUrl);
  });
});
