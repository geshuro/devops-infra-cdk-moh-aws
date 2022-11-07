/* eslint-disable no-continue */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
import _ from 'lodash';
import fs from 'fs-extra';

import { listFiles, listFilesDeep } from '../files/list-files';

/**
 * Find all the js files in a folder and if they export the provided method name then call the callback function.
 * The callback function receives the file and the bounded method.
 */
export async function invokeMethodInDir(
  { dir, methodName, deep = true }: { dir: string; methodName: string; deep?: boolean },
  callback: (file: string, method: any) => Promise<void>,
): Promise<void> {
  // We find all the js files in the provided folder
  let files: string[] = [];
  const isJsOrTsFile = (file?: string) => ['.ts', '.js'].some((ending) => _.endsWith(file, ending));
  if (deep) {
    files = await listFilesDeep(dir, isJsOrTsFile);
  } else {
    files = await listFiles(dir, isJsOrTsFile);
  }

  for (const file of files) {
    const content = require(file) || {};
    if (!_.isFunction(content[methodName])) continue;
    await callback(file, content[methodName].bind(content));
  }
}

/**
 * Find the provided method name in the given file (if the file exists and if the method exists) then call the
 * callback function. The callback function receives the bounded method.
 */
export async function invokeMethodInFile(
  { file, methodName }: { file: string; methodName: string },
  callback: (method: any) => Promise<void>,
): Promise<void> {
  const exists = await fs.pathExists(file);

  if (!exists) return;

  const content = require(file) || {};
  if (!_.isFunction(content[methodName])) return;
  await callback(content[methodName].bind(content));
}
