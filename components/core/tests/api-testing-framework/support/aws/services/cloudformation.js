/* eslint-disable @typescript-eslint/no-var-requires */
const _ = require('lodash');

class CloudFormation {
  constructor({ aws, sdk }) {
    this.aws = aws;
    this.sdk = sdk;

    this.stackCache = {};
  }

  async getStackOutputValue(stackName, keyName) {
    const output = await this.getStackOutput(stackName);
    return output[keyName];
  }

  async getStackOutput(stackName) {
    if (!_.has(this.stackCache, stackName)) {
      this.stackCache[stackName] = await this.sdk.describeStacks({ StackName: stackName }).promise();
    }
    const output = _.get(this.stackCache[stackName], 'Stacks[0].Outputs', []);
    const result = {};

    _.forEach(output, ({ OutputKey, OutputValue }) => {
      result[OutputKey] = OutputValue;
    });

    return result;
  }
}

// The aws javascript sdk client name
CloudFormation.clientName = 'CloudFormation';

// The framework is expecting this method. This is how the framework registers your aws services.
async function registerServices({ registry }) {
  registry.set('cloudFormation', CloudFormation);
}

module.exports = { registerServices };
