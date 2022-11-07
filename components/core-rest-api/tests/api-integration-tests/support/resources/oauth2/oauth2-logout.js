/* eslint-disable @typescript-eslint/no-var-requires */
const _ = require('lodash');
const { postAuthCookies, Oauth2ResourceNode } = require('./oauth2-resource-node');

class Oauth2LogoutNode extends Oauth2ResourceNode {
  constructor({ clientSession, parent }) {
    super({
      clientSession,
      type: 'logout',
      parent,
    });
    if (_.isEmpty(parent)) throw Error('A parent resource was not provided to resource type [logout]');

    this.api = `${parent.api}/${this.type}`;
  }

  post() {
    throw new Error(`use postAuthCookies instead`);
  }

  async postAuthCookies(...args) {
    // bind `this`
    const response = await postAuthCookies.bind(this)(...args);
    return response.data;
  }

  // ************************ Helpers methods ************************
}

// IMPORTANT: since this is a child resource, it should NOT have registerResources() function
module.exports = { Oauth2LogoutNode };
