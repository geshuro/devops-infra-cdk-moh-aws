/* eslint-disable @typescript-eslint/no-var-requires */
const _ = require('lodash');
const { Oauth2ResourceNode } = require('./oauth2-resource-node');

class Oauth2TokenNode extends Oauth2ResourceNode {
  constructor({ clientSession, parent }) {
    super({
      clientSession,
      type: 'token',
      parent,
    });
    if (_.isEmpty(parent)) throw Error('A parent resource was not provided to resource type [token]');

    this.api = `${parent.api}/${this.type}`;
  }

  defaults({
    code = this.setup.gen.string({ prefix: 'token-code' }),
    redirectUrl = this.setup.gen.string(),
    pkceVerifier = this.setup.gen.string({ prefix: 'token-verifier' }),
  } = {}) {
    return {
      code,
      redirectUrl,
      pkceVerifier,
    };
  }

  // ************************ Helpers methods ************************
}

// IMPORTANT: since this is a child resource, it should NOT have registerResources() function
module.exports = { Oauth2TokenNode };
