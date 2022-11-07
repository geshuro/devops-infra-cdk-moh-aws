import { plainToClass, ClassConstructor } from 'class-transformer';
import { ValidationError } from 'class-validator';
import { validateSyncForbidUnknownValues } from './validate';
import { logger } from '../util/logger';

const logValidationError = (err: ValidationError) => {
  const errStr =
    err.toString(true) +
    Object.keys(err.constraints || {})
      .map(key => `   - ${err.constraints?.[key]}`)
      .join('\n');
  logger.error(errStr);
};

export const convertConfig = <T extends object>(
  cls: ClassConstructor<T>,
  plainSettings: T
): T => {
  const parsedSettings = plainToClass(cls, plainSettings, {
    enableImplicitConversion: true,
  });

  const errors = validateSyncForbidUnknownValues(parsedSettings);
  if (errors.length) {
    errors.forEach(logValidationError);
    throw new Error('Validation failed');
  }
  return parsedSettings;
};
