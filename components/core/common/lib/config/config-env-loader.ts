import { ClassConstructor } from 'class-transformer';

import { KeyHost } from './key-host';
import { loadEnvConfig } from './load-env-config';

export const configEnvLoader =
  <T extends object>(cls: ClassConstructor<T> & KeyHost) =>
  () => {
    const parsedSettings = loadEnvConfig(cls);
    return { ...parsedSettings, [cls.KEY]: parsedSettings };
  };
