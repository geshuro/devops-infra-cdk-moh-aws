/* eslint-disable @typescript-eslint/no-var-requires */
const { ResourceNode } = require('@aws-ee/api-testing-framework');

const { Oauth2AuthorizeNode } = require('./oauth2-authorize');
const { Oauth2RefreshNode } = require('./oauth2-refresh');
const { Oauth2TokenNode } = require('./oauth2-token');
const { Oauth2LogoutNode } = require('./oauth2-logout');

class Oauth2Node extends ResourceNode {
  constructor({ clientSession }) {
    super({
      clientSession,
      type: 'authentication',
    });
    this.api = '/api/oauth2';
  }

  get authorize() {
    return new Oauth2AuthorizeNode({ clientSession: this.clientSession, parent: this });
  }

  get token() {
    return new Oauth2TokenNode({ clientSession: this.clientSession, parent: this });
  }

  get refresh() {
    return new Oauth2RefreshNode({ clientSession: this.clientSession, parent: this });
  }

  get logout() {
    return new Oauth2LogoutNode({ clientSession: this.clientSession, parent: this });
  }

  create() {
    throw new Error(`child nodes of oauth2 aren't for creation, even though they are POST`);
  }

  // ************************ Helpers methods ************************
}

// IMPORTANT: only define registerResources for top level resource nodes,
// child resource nodes should NOT have this method.
async function registerResources({ clientSession, registry }) {
  const node = new Oauth2Node({ clientSession });
  registry.set('oauth2', node);
}

module.exports = { registerResources, Oauth2Node };
