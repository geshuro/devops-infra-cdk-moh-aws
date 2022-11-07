import type { ClassConstructor } from 'class-transformer';

import { convertConfig } from './convert-config';
import type { KeyHost } from './key-host';

export const configLoader =
  <T extends object>(cls: ClassConstructor<T> & KeyHost, plainSettings: T) =>
  () => {
    const parsedSettings = convertConfig(cls, plainSettings);
    return { [cls.KEY]: parsedSettings };
  };
