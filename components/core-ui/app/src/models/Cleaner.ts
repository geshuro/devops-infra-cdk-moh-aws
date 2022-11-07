import _ from 'lodash';
import { runInAction } from 'mobx';

import { AppContext } from '../app-context/app-context';

// An object that captures all the clean up logic when the app is done or no jwt token
// is found.
export class Cleaner {
  constructor(private readonly appContext: AppContext) {}

  cleanup(): void {
    const { disposers, intervalIds } = this.appContext;

    // it is important that we start with cleaning the disposers, otherwise snapshots events will be fired
    // for cleaned stores
    let keys = Object.keys(disposers);
    _.forEach(keys, (key) => {
      const fn = disposers[key];
      if (typeof fn === 'function') {
        fn();
      }
      delete disposers[key];
    });

    keys = Object.keys(intervalIds);
    _.forEach(keys, (key) => {
      const id = intervalIds[key];
      if (id) {
        clearInterval(id as NodeJS.Timeout);
      }
      delete intervalIds[key];
    });

    runInAction(() => {
      _.forEach(this.appContext, (obj) => {
        if (obj === this) return; // we don't want to end up in an infinite loop
        if (typeof obj.cleanup === 'function') {
          obj.cleanup();
        }
      });
    });
  }
}

export function registerContextItems(appContext: AppContext): void {
  appContext.cleaner = new Cleaner(appContext);
}
