import _ from 'lodash';

export const boom = {
  error: (friendlyOrErr: any, code: any, friendly = ''): Error => {
    if (typeof friendlyOrErr === 'string') {
      const e: any = new Error(friendlyOrErr);
      e.isBoom = true;
      e.code = code;
      e.friendly = friendlyOrErr; // the friendly argument is ignored and friendlyOrErr is used instead
      return e;
    }
    if (_.isError(friendlyOrErr)) {
      (friendlyOrErr as any).code = code; // eslint-disable-line no-param-reassign
      (friendlyOrErr as any).isBoom = true; // eslint-disable-line no-param-reassign
      (friendlyOrErr as any).friendly = friendly || _.startCase(code);
      return friendlyOrErr;
    }

    // if we are here, it means that the msgOrErr is an object
    const err = new Error(JSON.stringify(friendlyOrErr));
    (err as any).isBoom = true;
    (err as any).code = code;
    (err as any).friendly = friendly || _.startCase(code);

    return err;
  },

  apiError: (errOrFriendlyMsg: any, friendlyMsg?: string): Error =>
    boom.error(errOrFriendlyMsg, 'apiError', friendlyMsg),

  notFound: (errOrFriendlyMsg: any, friendlyMsg?: string): Error =>
    boom.error(errOrFriendlyMsg, 'notFound', friendlyMsg),

  badRequest: (errOrFriendlyMsg: any, friendlyMsg?: string): Error =>
    boom.error(errOrFriendlyMsg, 'badRequest', friendlyMsg),

  tokenExpired: (errOrFriendlyMsg: any, friendlyMsg?: string): Error =>
    boom.error(errOrFriendlyMsg, 'tokenExpired', friendlyMsg),

  incorrectImplementation: (errOrFriendlyMsg: any, friendlyMsg?: string): Error =>
    boom.error(errOrFriendlyMsg, 'incorrectImplementation', friendlyMsg),

  timeout: (errOrFriendlyMsg: any, friendlyMsg?: string): Error => boom.error(errOrFriendlyMsg, 'timeout', friendlyMsg),
};

export const isNotFound = (error: any): boolean => error?.code === 'notFound';

export const isTokenExpired = (error: any): boolean => error?.code === 'tokenExpired';

export const isForbidden = (error: any): boolean => error?.code === 'forbidden';
