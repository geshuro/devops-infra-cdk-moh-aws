import _ from 'lodash';
import path from 'path';
import fs from 'fs-extra';

/**
 * Return the full path of each child file. This function does not go deep,
 * just the direct child files are returned.
 *
 * @param  dir A folder to return all its files
 */
export async function listFiles(dir: string, filter: (dir?: string) => boolean = () => true): Promise<string[]> {
  const result: string[] = [];

  // We first check if the dir exists
  const exists = await fs.pathExists(dir);
  if (!exists) return result;

  const items = await fs.readdir(dir);

  for (const item of items) {
    const possibleFile = path.join(dir, item);
    const stats = await fs.stat(possibleFile);
    if (stats.isFile() && filter(possibleFile)) result.push(possibleFile);
  }

  return result;
}

interface ScanEntries {
  parentDir: string;
  childPath: string;
}

/**
 * Return the full path of each child file. This function will go into child directories.
 *
 * @param dir A folder to return all its files and all the child files in all child directories,
 * as deep as there are child directories;
 */
export async function listFilesDeep(dir: string, filter: (dir?: string) => boolean = () => true): Promise<string[]> {
  const result: string[] = [];
  const queue: ScanEntries[] = [];

  // We first check if the dir exists
  const exists = await fs.pathExists(dir);
  if (!exists) return result;

  let items = await fs.readdir(dir);
  let entries = createEntries(dir, items);
  if (!_.isEmpty(entries)) queue.push(...entries);

  while (!_.isEmpty(queue)) {
    const { parentDir, childPath } = queue.shift()!;
    const possibleFile = path.join(parentDir, childPath);
    const stats = await fs.stat(possibleFile);
    if (stats.isFile() && filter(possibleFile)) {
      result.push(possibleFile);
    } else if (stats.isDirectory()) {
      items = await fs.readdir(possibleFile);
      entries = createEntries(possibleFile, items);
      if (!_.isEmpty(entries)) queue.push(...entries);
    }
  }

  return result;
}

function createEntries(parentDir: string, childPaths: string[]): ScanEntries[] {
  return _.map(childPaths, (childPath) => ({ parentDir, childPath }));
}
