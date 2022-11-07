/* eslint-disable @typescript-eslint/no-var-requires */
const _ = require('lodash');
const { Oauth2ResourceNode } = require('./oauth2-resource-node');

class Oauth2AuthorizeNode extends Oauth2ResourceNode {
  constructor({ clientSession, parent }) {
    super({
      clientSession,
      type: 'authorize',
      parent,
    });
    if (_.isEmpty(parent)) throw Error('A parent resource was not provided to resource type [authorize]');

    this.api = `${parent.api}/${this.type}`;
  }

  defaults({ redirectUrl = '', state = '', pkceChallenge = '' } = {}) {
    return {
      redirectUrl,
      state,
      pkceChallenge,
    };
  }

  // ************************ Helpers methods ************************
}

// IMPORTANT: since this is a child resource, it should NOT have registerResources() function
module.exports = { Oauth2AuthorizeNode };
