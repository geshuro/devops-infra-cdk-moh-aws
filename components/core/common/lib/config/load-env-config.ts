import { plainToClass, ClassConstructor } from 'class-transformer';
import { validateSyncForbidUnknownValues } from './validate';

import { logger } from '../util/logger';

export const loadEnvConfig = <T extends object>(
  cls: ClassConstructor<T>
): T => {
  let parsedSettings;

  try {
    parsedSettings = plainToClass(cls, process.env, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });
  } catch (e) {
    logger.error(e as string);
    throw new Error(`Failed to validate the environment against ${cls.name}.`);
  }

  const errors = validateSyncForbidUnknownValues(parsedSettings);
  if (errors.length) {
    errors.forEach(e => logger.error(e.toString()));
    throw new Error(`Failed to validate the environment against ${cls.name}.`);
  }
  return parsedSettings;
};
