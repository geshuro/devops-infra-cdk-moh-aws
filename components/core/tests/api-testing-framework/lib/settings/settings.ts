import _ from 'lodash';

import EnhancedError from '../errors/enhanced-error';
import * as errors from '../errors/error-messages';
import { IRegistry, Registry, registryWrapper } from '../helpers/registry';
import { RegistryContent, RegistryContentEntrySource } from '../models/registry-content';

/**
 * All settings used during the tests are stored here. The main advantage of having to use get/set methods
 * when accessing settings values is so that we can print an informative message when keys are missing, and
 * we can provide the 'optional' method for convince. In addition, we also capture the sources of the settings.
 * This allows us to list where each setting came from and which component overrides another component's setting.
 */
export class Settings extends Registry {
  protected override errorInvalidSource<T = string>(key: string, value: T): EnhancedError {
    return errors.settingSourceInvalid(key, value);
  }

  protected override errorKeyOrValueNotProvided(key: string): EnhancedError {
    return errors.keyOrValueNotProvided(key);
  }

  protected override errorKeyNotFound(key: string): EnhancedError {
    return errors.settingNotAvailable(key);
  }

  // Restores the state of the settings from the memento. We need to use the memento design pattern here because
  // we need to save and restore the settings, when we pass them via Jest globals.  Jest does not allow instances
  // of classes to be passed via Jest globals.
  setMemento(memento: { content?: RegistryContent } = {}): this {
    this.content = _.cloneDeep(memento.content || {});
    return this;
  }

  getMemento(): { content: RegistryContent } {
    return { content: _.cloneDeep(this.content) };
  }
}

export function settingsWrapper({
  settings,
  source,
}: {
  settings: Registry;
  source: RegistryContentEntrySource;
}): IRegistry {
  // Note: setMemento and getMemento are not available via the wrapper, which is not a problem
  return registryWrapper({ registry: settings, source });
}
