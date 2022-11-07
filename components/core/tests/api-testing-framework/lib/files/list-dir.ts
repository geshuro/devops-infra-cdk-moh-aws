import path from 'path';
import fs from 'fs-extra';

/**
 * Return the full path of each child directory. This function does not go deep,
 * just the direct child directories are returned.
 *
 * @param {string} dir A folder to return all its
 */
export async function listDir(dir: string): Promise<string[]> {
  const result: string[] = [];

  // We first check if the dir exists
  const exists = await fs.pathExists(dir);
  if (!exists) return result;

  const items = await fs.readdir(dir);

  for (const item of items) {
    const possibleDir = path.join(dir, item);
    const stats = await fs.stat(possibleDir);
    if (stats.isDirectory()) result.push(possibleDir);
  }

  return result;
}
