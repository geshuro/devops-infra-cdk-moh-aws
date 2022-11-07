/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-var-requires */
const _ = require('lodash');
const { ResourceNode } = require('@aws-ee/api-testing-framework');
const { createArticle, deleteArticle } = require('../../complex/article');
const { getWithRetry } = require('../../complex/api');

/** Article resource node */
class ArticleResourceNode extends ResourceNode {
  constructor({ clientSession, id, screeningId, parent }) {
    super({
      clientSession,
      id,
      type: 'article',
      parent,
    });
    this.screeningId = screeningId;
    if (_.isEmpty(parent)) throw Error('A parent resource was not provided to resource type [article]');
  }

  /**
   * @description               creates this article (via DynamoDB since API does not support article create)
   *                            and adds cleanup task to delete in DynamoDB
   * @param       articleRecord containing data to override default article record
   * @returns                   object containing id of created article */
  async create(articleRecord) {
    createArticle({ aws: this.setup.aws, id: this.id, articleRecord: this.defaults(articleRecord) });
    this.clientSession.addCleanupTask({ id: `${this.type}-${this.id}`, task: async () => this.cleanup() });
    return { id: this.id };
  }

  async createPicoScore(picoScore) {
    return this.create({
      picoPScore: picoScore,
      picoIScore: picoScore,
      picoCScore: picoScore,
      picoOScore: picoScore,
      secondPicoPScore: picoScore,
      secondPicoIScore: picoScore,
      secondPicoCScore: picoScore,
      secondPicoOScore: picoScore,
    });
  }

  // in both screenings
  async createAutoApproved() {
    return this.createPicoScore(0.9);
  }

  // rejected by default, unless PICO score is high
  async createAutoRejected() {
    return this.create({});
  }

  /**
   * @description deletes this article from DynamoDB */
  async delete() {
    return deleteArticle({ aws: this.setup.aws, id: this.id });
  }

  /**
   * @description       gets this article with retry
   * @param {*} params  to use with get request
   * @returns           this article, or undefined if try times out */
  async getWithRetry(params = {}) {
    return getWithRetry(this.doCall, this.axiosClient, this.api, params);
  }

  /**
   * @description       gets this article, without retrying on failure
   * @param {*} params  to use with get request
   * @returns           this article */
  async get(params = {}) {
    return this.doCall(async () => this.axiosClient.get(this.api, { params }));
  }

  defaults(article = {}) {
    const gen = this.setup.gen;
    return {
      id: this.id,
      decisions: [],
      picoPScore: 0,
      picoIScore: 0,
      picoCScore: 0,
      picoOScore: 0,
      secondPicoPScore: 0,
      secondPicoIScore: 0,
      secondPicoCScore: 0,
      secondPicoOScore: 0,
      title: gen.description(),
      author: gen.string(),
      abstract: gen.description(),
      screeningId: this.screeningId,
      ...article,
    };
  }
}

// IMPORTANT: since this is a child resource, it should NOT have registerResources() function
module.exports = { ArticleResourceNode };
