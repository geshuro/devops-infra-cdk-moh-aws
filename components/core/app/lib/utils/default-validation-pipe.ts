import { ValidationPipeOptions, ValidationError, BadRequestException, ValidationPipe } from '@nestjs/common';
import { Boom } from './boom';

/**
 * Use this in a NestJs `ValidationPipe`
 *
 * It configures the translation pipe to return a `400` error
 * and to return the validation errors via the API.
 *
 * @example
 * new ValidationPipe(defaultValidationOptions)
 */
export const defaultValidationOptions: ValidationPipeOptions = {
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
  exceptionFactory: (errors: ValidationError[]) =>
    new BadRequestException(
      Boom.safeMsg('Validation failed.').withPayload(
        errors.map(condenseValidationError).reduce((prev, curr) => [...prev, ...curr], []),
      ),
    ),
};

/**
 * The default API validation pipe
 */
export const defaultValidationPipe = new ValidationPipe(defaultValidationOptions);

const condenseValidationError = (error: ValidationError): string[] => Object.values(error.constraints || {});
