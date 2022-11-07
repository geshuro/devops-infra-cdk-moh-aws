/* eslint-disable import/no-import-module-exports */
import path from 'path';
import _ from 'lodash';
import { bootstrap } from '@aws-ee/api-testing-framework';

// Jest might call the configuration function multiple times and we don't want to run the bootstrap logic multiple times
const initOnce = _.once(bootstrap);

module.exports = async () => {
  const initResult = await initOnce({
    dir: __dirname,
    // The path to the stage file (should NOT include the file name itself)
    stageFilePath: path.join(__dirname, '../../../../main/api-integration-tests/config/settings'),
    scope: 'component', // either component or solution
  });

  return {
    rootDir: __dirname,
    verbose: true,
    notify: false,
    testEnvironment: 'node',
    testTimeout: 120 * 60 * 1000,
    displayName: 'Base API',
    setupFilesAfterEnv: ['<rootDir>/setup-tests.ts'],

    // Configure JUnit reporter as CodeBuild currently only supports JUnit or Cucumber reports
    // See https://docs.aws.amazon.com/codebuild/latest/userguide/test-reporting.html
    reporters: [
      'default',
      ['jest-junit', { suiteName: 'Base API integration tests', outputDirectory: './.build/test' }],
    ],
    globals: initResult.globals,
    preset: 'ts-jest',
  };
};
