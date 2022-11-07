/**
 * The abstract class for logger.
 *
 * To define a logger, provide it in a module using this class.
 *
 * @example <caption>Use the console as logger</caption>
 * const providers = [{ provide: LoggerService, useValue: console }]
 *
 * @description
 * The interface of this class is designed to be compatible
 * with `console` and `winston` but any other compatible logger will work.
 * To log to targets like DynamoDB we recommend using `winston` with a Dynamo transport.
 *
 * @example <caption>Using the logger</caption>
 * // Inject it into your service like any other dependency
 * constructor(private logger: LoggerService) {}
 *
 * myMethod() {
 *           this.logger.info('Hello from my service');
 * }
 */
export abstract class LoggerService {
  abstract error: LeveledLogMethod;
  abstract warn: LeveledLogMethod;
  abstract info: LeveledLogMethod;
  abstract debug: LeveledLogMethod;
  abstract verbose: LeveledLogMethod;
}

interface LeveledLogMethod {
  (message: string, ...meta: unknown[]): void;
  (message: unknown): void;
}
