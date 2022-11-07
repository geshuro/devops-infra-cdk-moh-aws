import fs from 'fs-extra';
import path from 'path';

import { loadYaml } from '../files/load-yaml';
import { Component, ComponentMetadata } from '../models/component';
import { validateMeta } from './validate-meta';

/**
 * Loads the component.yml and detects if <dir>/packages/api-integration-tests folder exists
 *
 * The return value is an object of this shape:
 * {
 *   name: '<component name>',
 *   meta: <the content of the component.yaml>,
 *   hasApiTestsDir: true if packages/api-integration-tests folder exists
 *   rootDir: the root path to this component which is the same as the provided 'dir'
 *   apiTestsDir: the path to the packages/api-integration-tests, but only if it exists
 * }
 *
 * @param dir The folder where component.yml is expected
 */
export async function loadComponent({ dir }: { dir: string }): Promise<Component> {
  const componentFile = path.join(dir, 'component.yml');
  const meta = await loadYaml<ComponentMetadata>(componentFile);
  await validateMeta({ meta, file: componentFile });

  const testFolder = path.join(dir, 'tests/api-integration-tests');
  const testExists = await fs.pathExists(testFolder); // Note, we are using pathExists not exists, because fs.exists is deprecated

  return {
    name: meta.name,
    meta,
    hasApiTestsDir: testExists,
    rootDir: dir,
    apiTestsDir: testFolder,
  };
}
