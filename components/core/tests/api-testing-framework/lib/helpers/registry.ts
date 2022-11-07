import _ from 'lodash';
import EnhancedError from '../errors/enhanced-error';

import * as errors from '../errors/error-messages';
import { RegistryContent, RegistryContentEntrySource } from '../models/registry-content';

/**
 * A generic key/value in-memory store. Its main api is set/get. The main advantage of having to use get/set methods
 * when accessing values is so that we can print an informative message when keys are missing, and we can provide
 * the 'optional' method for connivance. In addition, we also capture the sources of the values.
 * This allows us to list where each value came from and which component overrides another component's provided value.
 */
export interface IRegistry {
  get<T = string>(key: string): T;
  set(key: string, value: unknown, source: { name: string; file: string }): void;
  merge(map: RegistryContent, source: RegistryContentEntrySource): void;
  has(key: string): boolean;
  entries(): RegistryContent;
}

export class Registry implements IRegistry {
  protected content: RegistryContent = {};

  set(key: string, value: unknown, source: { name: string; file: string }): void {
    if (_.isEmpty(key)) throw this.errorKeyOrValueNotProvided(key);
    if (_.isUndefined(value)) throw this.errorKeyOrValueNotProvided(key);

    if (_.isEmpty(source)) throw this.errorInvalidSource(key, value);
    const { name, file } = source;

    if (_.isEmpty(name)) throw this.errorInvalidSource(key, value);
    if (_.isEmpty(file)) throw this.errorInvalidSource(key, value);
    const sourceEntry = { name, file };

    // This is the array that contains all the components that overrode the setting value
    const sources: RegistryContentEntrySource[] = _.get(this.content[key], 'sources', []);

    // We add the source entry at the beginning of the array indicating that this is the component that
    // overrode the setting value
    sources.unshift(sourceEntry);
    this.content[key] = { value, sources };
  }

  get<T = string>(key: string): T {
    const value = _.get(this.content[key], 'value');
    if (_.isEmpty(value) && !_.isBoolean(value)) throw this.errorKeyNotFound(key);

    return value as T;
  }

  optional<T = string>(key: string, defaultValue: T): T {
    const value = _.get(this.content[key], 'value');
    if (_.isNil(value) || (_.isString(value) && _.isEmpty(value))) return defaultValue;

    return value as T;
  }

  has(key: string): boolean {
    return _.has(this.content, key);
  }

  // Given a map of the key/value, merge it to the existing content
  merge(map: RegistryContent, source: RegistryContentEntrySource): void {
    _.forEach(map, (value, key) => {
      this.set(key, value, source);
    });
  }

  entries(): RegistryContent {
    const result = {};
    _.forEach(this.content, (entry, key) => {
      result[key] = entry.value;
    });
    return result;
  }

  // Subclasses can override this method to return their own custom error message
  protected errorInvalidSource<T = string>(key: string, value: T): EnhancedError {
    return errors.invalidSource(key, value);
  }

  // Subclasses can override this method to return their own custom error message
  protected errorKeyOrValueNotProvided(key: string): EnhancedError {
    return errors.keyOrValueNotProvided(key);
  }

  // Subclasses can override this method to return their own custom error message
  protected errorKeyNotFound(key: string): EnhancedError {
    return errors.keyNotFound(key);
  }
}

// Wraps around an instance of the registry and makes the 'set()' method use the provided source.
// This way users of the wrapper registry don't have to worry about supplying the source object.
export function registryWrapper({
  registry,
  source,
}: {
  registry: Registry;
  source: RegistryContentEntrySource;
}): IRegistry {
  return {
    get: (key) => registry.get(key),
    set: (key, value, givenSource) => registry.set(key, value, givenSource || source),
    merge: (map, givenSource) => registry.merge(map, givenSource || source),
    has: (key) => registry.has(key),
    entries: () => registry.entries(),
  };
}
