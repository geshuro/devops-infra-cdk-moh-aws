/* eslint-disable @typescript-eslint/no-var-requires */
const _ = require('lodash');
const { postAuthCookies, Oauth2ResourceNode } = require('./oauth2-resource-node');

class Oauth2RefreshNode extends Oauth2ResourceNode {
  constructor({ clientSession, parent }) {
    super({
      clientSession,
      type: 'refresh',
      parent,
    });
    if (_.isEmpty(parent)) throw Error('A parent resource was not provided to resource type [refresh]');

    this.api = `${parent.api}/${this.type}`;
  }

  post() {
    throw new Error(`use postCurrentCookieTokenAndReturnNewCookieToken instead`);
  }

  async postCurrentCookieTokenAndReturnNewCookieToken(refreshToken) {
    const response = await postAuthCookies.bind(this)({
      refreshToken,
    });
    const responseHeaders = response.headers;
    const newCookie = responseHeaders.Cookie || responseHeaders.cookie;
    return {
      newCookie,
    };
  }

  // ************************ Helpers methods ************************
}

// IMPORTANT: since this is a child resource, it should NOT have registerResources() function
module.exports = { Oauth2RefreshNode };
