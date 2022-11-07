/* eslint-disable @typescript-eslint/no-var-requires */
const _ = require('lodash');
const { ResourceNode } = require('@aws-ee/api-testing-framework');
const { getItemsWithRetry } = require('../../../complex/api');

/** Auto rejected resource node, used by ScreeningNode */
class AutoRejectedResourceNode extends ResourceNode {
  constructor({ clientSession, id, screeningId, parent, screeningStage }) {
    super({
      clientSession,
      type: 'autoRejected',
      id,
      parent,
    });
    if (screeningStage === 'first') {
      this.api = `${this.parent.api}/${this.type}`;
    } else if (screeningStage === 'second') {
      this.api = `${this.parent.api}/second/${this.type}`;
    }
    this.screeningId = screeningId;

    if (_.isEmpty(parent)) throw Error(`A parent resource was not provided to resource type [${this.type}]`);
  }

  async getWithRetry(params = {}) {
    return getItemsWithRetry(this.doCall, this.axiosClient, this.api, params);
  }

  async getTotalItems() {
    return this.getWithRetry().then(item => item.totalItems);
  }
}

// IMPORTANT: since this is a child resource, it should NOT have registerResources() function
module.exports = { AutoRejectedResourceNode };
