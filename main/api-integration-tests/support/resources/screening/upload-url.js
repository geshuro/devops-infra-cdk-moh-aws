/* eslint-disable @typescript-eslint/no-var-requires */
const _ = require('lodash');
const { ResourceNode } = require('@aws-ee/api-testing-framework');

/** Upload URL resource node, used by ScreeningResourceNode */
class UploadUrlResourceNode extends ResourceNode {
  constructor({ clientSession, id, parent }) {
    super({
      clientSession,
      type: 'uploadUrl',
      id,
      parent,
    });
    this.api = `${this.parent.api}/${this.type}`;

    if (_.isEmpty(parent)) throw Error('A parent resource was not provided to resource type [uploadUrl]');
  }
}

// IMPORTANT: since this is a child resource, it should NOT have registerResources() function
module.exports = { UploadUrlResourceNode };
