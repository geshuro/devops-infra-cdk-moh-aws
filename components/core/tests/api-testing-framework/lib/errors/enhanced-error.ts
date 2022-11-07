import _ from 'lodash';

/**
 * The purpose of this class is to allow us to create error objects with extra information, such as
 * errorCode.
 */
export default class EnhancedError extends Error {
  /**
   * The error code in human readable form
   */
  readonly errorCode: string;

  root: string | Error | undefined;

  /**
   * @param msg Error message, make the error message user friendly as much as possible.
   * If you pass an Error instance, then its message is used and it is assigned as the root cause.
   * @param errorCode should be a string (camelCase) to spaces and should make unit testing easier.
   * This is because unit tests can check against the errorCode instead of the exact error message content.
   */
  constructor(errorCode: string, msg: string | Error = '') {
    super(_.isError(msg) ? msg.message : _.get(msg, 'message', msg));
    this.errorCode = errorCode;

    if (_.isError(msg)) {
      this.root = msg;
    }
  }

  cause(root: string | Error): this {
    this.root = root;
    return this;
  }
}
