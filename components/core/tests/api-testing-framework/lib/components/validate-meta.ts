import _ from 'lodash';

import * as errors from '../errors/error-messages';
import { ComponentMetadata } from '../models/component';

/**
 * Examines the meta information (the content of a component.yml) and ensures that certain expected
 * values are in place and in the correct format.
 */
export async function validateMeta({
  meta = {},
  file,
}: {
  meta: Partial<ComponentMetadata>;
  file: string;
}): Promise<void> {
  const name = meta.name;
  const dependencies = meta.dependencies || [];

  _.forEach(dependencies, (dependency) => {
    if (!_.isString(dependency)) {
      throw errors.dependencyMustBeString(name, dependency, file);
    }
  });
}
