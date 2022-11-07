export interface BoomProps {
  /**
   * The message
   */
  message?: string;

  /**
   * The underlying error
   */
  error?: Error;

  /**
   * Is the message safe
   *
   * @default false
   */
  safe?: boolean;

  /**
   * Additional information about an error
   */
  payload?: unknown;
}

/**
 * Errors
 * This is intended for use together with NestJs Exceptions:
 * @example
 * throw new BadRequestException(Boom.create({ message: 'Careful now!' }))
 */
export class Boom {
  readonly boom = true;
  readonly message?: string;
  readonly error?: Error;
  readonly safe: boolean;
  readonly payload: unknown;

  /**
   * Creates a new Boom
   *
   * @param props Options
   * @returns The created Boom
   */
  static create(props: BoomProps): Boom {
    return new Boom(props);
  }

  /**
   * Create an error from a message.
   * The message is treated as "unsafe"
   * and will not be returned via the API
   *
   * @param message The message
   * @returns The created Boom
   */
  static msg(message: string): Boom {
    return Boom.create({ message });
  }

  /**
   * Create an error from a message.
   * The message is treated as "safe" and will be returned
   * as part of the API response. DO NOT include sensitive data.
   *
   *
   * @param message The message
   * @returns The created Boom
   */
  static safeMsg(message: string): Boom {
    return Boom.create({ message, safe: true });
  }

  /**
   * Is the passed in exception a `Boom`
   *
   * @param exception The exception
   * @returns `true` if the exception is a `Boom`
   */
  static isBoom(exception: unknown): exception is Boom {
    return !!(exception as { boom?: boolean })?.boom;
  }

  /**
   * A method to add extra payload information to the error. This payload can then be used by
   * the clients to read additional information about the error.
   * @param payload The payload to add to this error
   */
  withPayload(payload: unknown): Boom {
    return Boom.create({ ...this.props, payload });
  }

  private constructor(props: BoomProps) {
    this.message = props.message;
    this.error = props.error;
    this.safe = props.safe ?? false;
    this.payload = props.payload;
  }

  private get props(): BoomProps {
    return {
      message: this.message,
      error: this.error,
      payload: this.payload,
      safe: this.safe,
    };
  }
}
