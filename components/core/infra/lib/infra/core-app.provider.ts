import { App } from '@aws-cdk/core';
import { ValueProvider } from '@nestjs/common';

export const CoreApp = Symbol('coreApp');

export const appProvider = (app: App): ValueProvider<App> => ({
  provide: CoreApp,
  useValue: app,
});
