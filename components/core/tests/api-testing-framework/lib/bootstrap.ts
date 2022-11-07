import _ from 'lodash';
import path from 'path';
import parse from 'yargs-parser';

import { sortComponents, getSolutionRootDir } from './components/sort';
import * as errors from './errors/error-messages';
import { loadYaml } from './files/load-yaml';
import { Settings } from './settings/settings';
import { initAws } from './aws/init-aws';
import { initialize } from './helpers/initialize';
import type { Scope } from './models/scope';
import type { RegistryContent } from './models/registry-content';

/**
 * The entry point to the bootstrap process for the api testing framework and to initialize the tests run.
 *
 * @param  dir The full path to the 'api-integration-tests' folder. If the scope = 'component', then the dir
 *             should be pointing to the component's own api-integration-tests folder.
 *             if the scope = 'solution', then dir should be pointing to the solution's api-integration-tests
 *             folder.
 * @param  stageFilePath The full path to the stage file (should NOT include the file name itself)
 * @param  scope Either 'component' or 'solution'. If the tests run is for a specific component, then the
 *               scope should be 'component' otherwise it should be 'solution'.
 */
export async function bootstrap({ dir, stageFilePath, scope }: { dir: string; stageFilePath: string; scope: Scope }) {
  const parsedArgs = parse(process.argv);

  // Get the stage argument either from the command line args or from the process environment variables
  const stage = parsedArgs.stage || parsedArgs.s || process.env.STAGE;
  if (_.isEmpty(stage)) throw errors.noStage();

  // dir is required
  if (_.isEmpty(dir)) throw errors.dirNotProvided();

  // stage path is required
  if (_.isEmpty(stageFilePath)) throw errors.stagePathNotProvided();

  // scope is required
  if (_.isEmpty(scope)) throw errors.scopeNotProvided();

  // scope can either be 'component' or 'solution
  if (!['component', 'solution'].includes(scope)) throw errors.invalidScope(scope);

  // 'dir' points to api-integration-tests folder, so we need to go up twice to get to the root folder
  // for a component, it will be <component> folder, for the solution it will the <solution> top folder
  const rootDir = path.join(dir, '../..');
  const dependencyGraph = await sortComponents({ dir: rootDir, scope });

  // This runId is generated per integration tests run, this helps us identify a specific run
  const runId = `${Date.now()}`;

  // Load the settings file
  const settingsFile = path.join(stageFilePath, `${stage}.yml`);
  const settingsFromFile = await loadYaml<RegistryContent>(settingsFile);
  const solutionRootDir = getSolutionRootDir({ dir: rootDir, scope });
  const settings = new Settings();

  settings.merge(settingsFromFile, { name: 'solution', file: settingsFile });

  // We add a few more settings that are needed
  settings.merge(
    {
      runId,
      runDir: dir,
      solutionRootDir,
    },
    { name: 'framework', file: __filename },
  );

  const aws = await initAws({ settings, dependencyGraph });

  // For any component (including the framework and the solution) that exports support/init.ts,
  // give it a chance to initialize
  await initialize({ settings, aws, dependencyGraph });

  // Return the initialization result
  return {
    globals: {
      __bootstrap__: {
        dependencyGraph,
        settingsMemento: settings.getMemento(),
      },
    },
  };
}
