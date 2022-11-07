import _ from 'lodash';

import errorCode from './error-code';

/**
 * An error class that matches its counter part from the server side.
 */
export class BoomError extends Error {
  readonly boom = true;
  readonly code: string;
  readonly status: number;
  root?: Error;
  payload?: unknown;

  /**
   * @param msg Error message
   * @param code Error code
   * @param status The http status code
   */
  constructor(msg: string | Error = '', code: string | null = null, status = 500) {
    super(_.isError(msg) ? msg.message : _.get(msg, 'message', msg || ''));

    this.code =
      code || _.findKey(errorCode.http.status, (httpStatus) => httpStatus === status) || `unknown (${status})`;
    this.status = status;
    if (_.isError(msg)) {
      this.root = msg;
    }
  }

  /**
   * A method to add extra payload information to the error. This payload can then be used by
   * the clients to read additional information about the error.
   * @param payload The payload to add to this error
   *
   * @returns {BoomError}
   */
  withPayload(payload: unknown): this {
    this.payload = payload;
    return this;
  }

  cause(root: Error): this {
    this.root = root;
    return this;
  }
}
