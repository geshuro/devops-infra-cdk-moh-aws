import fs from 'fs-extra';
import yaml from 'js-yaml';

import * as errors from '../errors/error-messages';

export async function loadYaml<T = unknown>(file: string): Promise<T> {
  const exists = await fs.pathExists(file); // Note, we are using pathExists not exists, because fs.exists is deprecated

  if (!exists) throw errors.fileNotFound(file);

  let raw;

  try {
    raw = await fs.readFile(file, 'utf8');
  } catch (error) {
    throw errors.cannotReadFile(file, (error as Error).message).cause(error as Error);
  }

  let content;
  try {
    content = yaml.load(raw);
  } catch (error) {
    throw errors.notValidYaml(file, (error as Error).message).cause(error as Error);
  }

  return content;
}
