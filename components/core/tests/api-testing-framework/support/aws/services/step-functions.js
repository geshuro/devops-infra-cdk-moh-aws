class StepFunctions {
  constructor({ aws, sdk }) {
    this.aws = aws;
    this.sdk = sdk;
  }

  async stopExecution(executionArn) {
    const params = {
      executionArn,
      error: 'test-teardown',
      cause: 'test-cleanup-logic',
    };

    return this.sdk.stopExecution(params).promise();
  }
}

// The aws javascript sdk client name
StepFunctions.clientName = 'StepFunctions';

// The framework is expecting this method. This is how the framework registers your aws services.
async function registerServices({ registry }) {
  registry.set('stepFunctions', StepFunctions);
}

module.exports = { registerServices };
