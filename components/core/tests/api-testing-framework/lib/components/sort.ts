/* eslint-disable no-continue */
import _ from 'lodash';
import path from 'path';
import toposort from 'toposort';

import { listDir } from '../files/list-dir';
import { Component } from '../models/component';
import { DependencyGraph } from '../models/dependency-graph';
import { Scope } from '../models/scope';
import { loadComponent } from './load-component';

/**
 * Sorts components based on their dependencies and returns an array of the result. The array has the following shape:
 *
 * [ { name: <component name>, testsDir: <api-integration-tests folder>, type: 'component/solution' }, { .. } ]
 *
 * The order of the array is important as it represents the topological sorting. The first component does not
 * depend on any other components, while the second component might depend on the first component, etc.
 *
 * @param {string} dir The root folder for the component that we want to use as the starting point or if the scope
 *                     is solution, then the root folder fo the solution
 * @param {array<string>} skip A list of component names to skip while constructing the dependency tree
 * @param {string} scope Can be either component or solution
 */
export async function sortComponents({
  dir,
  skip = [],
  scope,
}: {
  dir: string;
  skip?: string[];
  scope: Scope;
}): Promise<DependencyGraph> {
  const processQueue: string[] = [];
  // key is the component name, value is api-integration-tests folder path
  const componentsMap: Record<string, Component> = {};
  // Edges that represent dependencies, see https://github.com/marcelklehr/toposort
  const edges: [string, string | undefined][] = [];
  // The folder where we list all the components (name 'components')
  const componentsRoot = getComponentsRootDir({ dir, scope });
  // The root folder for the whole solution
  const solutionRoot = getSolutionRootDir({ dir, scope });

  const isSolution = scope === 'solution';

  if (isSolution) {
    processQueue.push(...(await listDir(componentsRoot)));
  } else {
    processQueue.push(dir);
  }

  do {
    const itemDir = processQueue.shift();
    try {
      const component = await loadComponent({ dir: itemDir! });
      const name = component.name;

      // If the component name is found in the skip array, then we don't process it at all.
      if (skip.includes(name)) continue;
      componentsMap[name] = component;
      const dependencies = component.meta.dependencies || [];

      // Loop through each dependency
      _.forEach(dependencies, (dependency) => {
        if (skip.includes(dependency)) return;

        const componentDir = path.join(componentsRoot, dependency);
        processQueue.push(componentDir);
        edges.push([name, dependency]);
      });
    } catch (err) {
      // ignore
      // console.log(err);
    }
  } while (!_.isEmpty(processQueue));

  // We use the toposort library to do the topological sorting
  const sorted = toposort(edges).reverse();

  const result: DependencyGraph = [];
  _.forEach(sorted, (name) => {
    const component = componentsMap[name];
    if (_.isEmpty(component)) return;
    if (component.hasApiTestsDir) result.push({ name, testsDir: component.apiTestsDir, type: 'component' });
  });

  // If the scope = solution, we need to insert the solution api-integration-test folder as part of the returned result
  if (isSolution) {
    result.push({
      name: 'solution',
      testsDir: path.join(solutionRoot, 'main/api-integration-tests'),
      type: 'solution',
    });
  }

  // Lets add the framework to the dependency graph so that it can contribute its own aws services, etc.
  result.unshift({
    name: 'framework',
    testsDir: path.join(solutionRoot, 'components/core/tests/api-testing-framework'),
    type: 'framework',
  });

  return result;
}

function getComponentsRootDir({ dir, scope }: { dir: string; scope: Scope }) {
  // If scope = component then dir should be pointing to the <component> folder
  // if scope = solution then dir should be pointing to the solution root folder

  // For the case of a component, components root is one level up
  if (scope === 'component') return path.join(dir, '..');

  // For the case of the solution, components root is the child folder 'components'
  return path.join(dir, 'components');
}

export function getSolutionRootDir({ dir, scope }: { dir: string; scope: Scope }): string {
  // If scope = component then dir should be pointing to the <component> folder
  // if scope = solution then dir should be pointing to the solution root folder

  // For the case of a component, solution root is two levels up
  if (scope === 'component') return path.join(dir, '../..');

  // For the case of the solution, solution root is the same as dir
  return dir;
}
