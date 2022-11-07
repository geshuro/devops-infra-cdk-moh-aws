/* eslint-disable @typescript-eslint/no-var-requires */
const _ = require('lodash');
const { ResourceNode } = require('@aws-ee/api-testing-framework');

/** Decision resource node, used by ScreeningResourceNode */
class DecisionResourceNode extends ResourceNode {
  constructor({ clientSession, screeningId, parent, decision, articleId, query, screeningStage }) {
    super({
      clientSession,
      type: 'decision',
      parent,
    });
    this.screeningId = screeningId;

    /**
     * This node covers 4 APIs
     * - decision/{approve|reject|reset}
     * - decision/bulk/{approve|reject|reset}
     * - second/decision/{approve|reject|reset}
     * - second/decision/bulk/{approve|reject|reset}
     */

    const screeningStagePrefix = (() => {
      if (screeningStage === 'first') {
        return '';
      }
      if (screeningStage === 'second') {
        return 'second/';
      }
      throw new Error(`unknown screeningStage '${screeningStage}'`);
    })();

    if (['approve', 'reject', 'reset'].indexOf(decision) === -1) {
      throw new Error(`Decision '${decision}' not supported`);
    }

    if (!articleId) {
      // use-case for bulk
      this.api = `${this.parent.api}/${screeningStagePrefix}${this.type}/bulk/${decision}`;
      this.params = query;
    } else {
      this.api = `${this.parent.api}/${screeningStagePrefix}${this.type}/${decision}/${articleId}`;
    }
    if (_.isEmpty(parent)) throw Error(`A parent resource was not provided to resource type [${this.type}]`);
  }

  // Override
  get() {
    const params = this.params || {};
    return super.get(params);
  }
}

// IMPORTANT: since this is a child resource, it should NOT have registerResources() function
module.exports = { DecisionResourceNode };
