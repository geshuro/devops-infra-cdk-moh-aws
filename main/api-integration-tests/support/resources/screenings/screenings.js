/* eslint-disable @typescript-eslint/no-var-requires */
const { CollectionResourceNode } = require('@aws-ee/api-testing-framework');

const { ScreeningNode } = require('./screening');

const type = 'screenings';

/** Screenings collection resource node, mounted at /api/screenings */
class ScreeningsNode extends CollectionResourceNode {
  constructor({ clientSession }) {
    super({
      clientSession,
      type,
      childType: 'screening',
    });

    this.api = `/api/${type}`;
  }

  screening(id) {
    return new ScreeningNode({ clientSession: this.clientSession, id, parent: this });
  }

  /**
   * @param id      of screening to test
   * @param wait    seconds to wait before retry
   * @param maxWait maximum seconds to spend retrying
   * @returns       true unless after retrying every *wait* seconds up to a maximum of *maxWait* seconds this
   *                screenings does not contain a screening with specified id. The retry logic is included since
   *                there is a delay between creating a screening and the screening being available */
  async includes(id, wait = 1, maxWait = 10) {
    let totalWait = 0;
    while (totalWait < maxWait) {
      const screenings = await this.get();
      const ids = screenings.items.map(item => item.id);
      if (ids.includes(id)) return Promise.resolve(true);
      await new Promise(a => setTimeout(a, wait * 1000));
      totalWait += wait;
    }
    throw new Error(`didn't have item with ID: ${id}`);
  }

  /**
   * @description     provides default values when creating a child resource
   * @param screening optional object containing values to override defaults
   * @returns         screening with default values, except where overriden by the parameter. The clinical question
   *                  contains the run ID, which is used when deleting screenings to guard against accidental deletion
   *                  of non-test data */
  defaults(screening = {}) {
    const gen = this.setup.gen;
    return {
      clinicalQuestion: gen.description(),
      keywords: gen.string(),
      picoP: gen.string(),
      picoI: gen.string(),
      picoC: gen.string(),
      picoO: gen.string(),
      picoD: gen.string(),
      ...screening,
    };
  }
}

// IMPORTANT: only define registerResources for top level resource nodes,
// child resource nodes should NOT have this method.
async function registerResources({ clientSession, registry }) {
  registry.set(type, new ScreeningsNode({ clientSession }));
}

module.exports = { registerResources, ScreeningsNode };
