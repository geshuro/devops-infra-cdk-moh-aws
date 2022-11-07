import _ from 'lodash';
import type { AxiosError } from 'axios';

import { BoomError } from './boom-error';
import errorCode from './error-code';

/**
 * Transforms axios error to a boom error so that we can capture the boom code and payload attributes passed from the
 * server.
 */
export function transformAxiosError(error: AxiosError): BoomError {
  // See description of axios error at
  // https://github.com/axios/axios#handling-errors

  let boom;

  if (error.response) {
    // From axios doc:
    // "The request was made and the server responded with a status code"
    // "that falls out of the range of 2xx"
    const response = error.response;
    const status = _.get(response, 'status');
    const code = _.get(response, 'data.code');
    const msg = _.get(
      response,
      'data.message',
      status === 404 ? 'Resource not found' : `Something went wrong calling the server (${status})`,
    );
    const payload = _.get(response, 'data.payload');
    const requestPath = _.get(error, 'request.path', '');
    const requestMethod = _.get(error, 'request.method', '');

    boom = new BoomError(msg, code, status);
    boom.request = `${requestMethod} ${requestPath}`;

    if (payload) {
      boom.withPayload(payload);
    }
  } else if (error.request) {
    // From axios doc:
    // "The request was made but no response was received"
    // "`error.request` is an instance of XMLHttpRequest in the browser and an instance of"
    // "http.ClientRequest in node.js"
    boom = new BoomError(error, errorCode.others.noResponse);
  } else {
    // From axios doc:
    // "Something happened in setting up the request that triggered an Error"
    boom = new BoomError(error, errorCode.others.incorrectRequest);
  }

  return boom;
}
