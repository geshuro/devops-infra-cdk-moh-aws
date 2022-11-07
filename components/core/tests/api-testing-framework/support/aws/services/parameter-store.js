/* eslint-disable @typescript-eslint/no-var-requires */
const _ = require('lodash');

class ParameterStore {
  constructor({ aws, sdk }) {
    this.aws = aws;
    this.sdk = sdk;
  }

  async getParameter(name) {
    const response = await this.sdk.getParameter({ Name: name, WithDecryption: true }).promise();
    return _.get(response, 'Parameter.Value');
  }

  async putParameter(name, value, overwrite = false) {
    const response = await this.sdk
      .putParameter({ Name: name, Value: value, Type: 'SecureString', Overwrite: overwrite })
      .promise();
    return { version: _.get(response, 'Version') };
  }
}

// The aws javascript sdk client name
ParameterStore.clientName = 'SSM';

// The framework is expecting this method. This is how the framework registers your aws services.
async function registerServices({ registry }) {
  registry.set('parameterStore', ParameterStore);
}

module.exports = { registerServices };
