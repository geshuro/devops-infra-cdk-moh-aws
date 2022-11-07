import EnhancedError from '../errors/enhanced-error';
import * as errors from '../errors/error-messages';
import { IRegistry, Registry, registryWrapper as baseRegistryWrapper } from '../helpers/registry';
import { RegistryContentEntrySource } from '../models/registry-content';

/**
 * A registry for classes that implement AWS service helpers.  These services become available during the
 * tests as aws.services.*
 * In addition, the registry captures information regarding the source of these classes, this allows us to list where each
 * aws service came from and which component overrides another component's contribution.
 */
export class AwsServiceRegistry extends Registry {
  protected override errorInvalidSource<T = string>(key: string, _value: T): EnhancedError {
    return errors.awsServiceSourceInvalid(key);
  }

  protected override errorKeyOrValueNotProvided(key: string): EnhancedError {
    return errors.awsServiceNotProvided(key);
  }

  protected override errorKeyNotFound(key: string): EnhancedError {
    return errors.awsServiceNotAvailable(key);
  }
}

export function registryWrapper({
  registry,
  source,
}: {
  registry: Registry;
  source: RegistryContentEntrySource;
}): IRegistry {
  return baseRegistryWrapper({ registry, source });
}
