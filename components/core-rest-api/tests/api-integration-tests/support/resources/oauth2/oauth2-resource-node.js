/* eslint-disable @typescript-eslint/no-var-requires */
const _ = require('lodash');
const { ResourceNode } = require('@aws-ee/api-testing-framework');
const { transformAxiosError } = require('@aws-ee/api-testing-framework');

class Oauth2ResourceNode extends ResourceNode {
  create() {
    throw new Error(`child nodes of oauth2 aren't for creation, even though they are POST`);
  }

  // same as `ResourceNode#create`, but without cleanup
  post(body = {}, axiosParams = {}, { api = this.api, applyDefault = true } = {}) {
    const requestBody = applyDefault ? this.defaults(body) : body;
    return this.doCall(async () => this.axiosClient.post(api, requestBody, { params: axiosParams }));
  }

  /**
   * useful to access headers / cookies
   */
  postAxiosRaw(body = {}, axiosParams = {}, { api = this.api, applyDefault = true } = {}) {
    const requestBody = applyDefault ? this.defaults(body) : body;
    return this.axiosClient.post(api, requestBody, { params: axiosParams });
  }
}

/**
 * WARNING: bind `this` on usage
 */
async function postAuthCookies({ token = undefined, refreshToken = undefined } = {}) {
  try {
    const headers = this.axiosClient.defaults.headers;
    const cookie = (() => {
      // the assumption is this is in format `token=xxxxxx`, no other cookie appended
      const currentCookieToken = headers.Cookie || headers.cookie;
      const mainTokenString = token ? `token=${token}` : currentCookieToken;
      const refreshTokenString = refreshToken ? `refreshToken=${refreshToken}` : ``;
      return [mainTokenString, refreshTokenString].filter(Boolean).join('; ');
    })();
    const headersWithNewCookie = refreshToken ? { Cookie: cookie } : {};
    return await this.axiosClient.post(
      this.api,
      {},
      {
        headers: {
          ...headers,
          ...headersWithNewCookie,
        },
      },
    );
  } catch (e) {
    throw transformAxiosError(e);
  }
}

// IMPORTANT: since this is a child resource, it should NOT have registerResources() function
module.exports = { postAuthCookies, Oauth2ResourceNode };
