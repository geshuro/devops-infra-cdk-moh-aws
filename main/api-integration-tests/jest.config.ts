/* eslint-disable import/no-import-module-exports */
/* eslint-disable arrow-body-style */
import path from 'path';
import _ from 'lodash';
import { bootstrap, getProjectConfigs } from '@aws-ee/api-testing-framework';

// Jest might call the configuration function multiple times and we don't want to run the init logic multiple times
const runOnce = _.once(async () => {
  const initResult = await bootstrap({
    dir: __dirname,
    // The path to the stage file (should NOT include the file name itself)
    stageFilePath: path.join(__dirname, './config/settings'),
    scope: 'solution', // either component or solution
  });

  // eslint-disable-next-line no-unused-vars
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const projectConfigs = await getProjectConfigs(initResult.globals, async (config, node) => {
    // 'config' is a jest project configuration already prepared. You can do a few things here
    // to customize the project configuration:
    //
    // 1 - If you want to skip all the tests for a specific component, then return undefined instead
    //     of the config object.
    //
    //     Example:
    //     if (node.name === 'ee-component-base') return;
    //
    // 2 - If you want to skip specific tests for a specific component, then add 'testPathIgnorePatterns'
    //     to the config object.
    //
    //     Example:
    //     if (node.name === 'ee-component-base') return { ...config, testPathIgnorePatterns: ['no.test.js']}
    //
    // What is this 'config' object? it is a Jest project configuration as described here
    // https://jestjs.io/docs/configuration#projects-arraystring--projectconfig

    return config;
  });

  return {
    rootDir: __dirname,
    testEnvironment: 'node',
    testTimeout: 120 * 60 * 1000,
    setupFilesAfterEnv: ['<rootDir>/setup-tests.ts'],

    // Configure JUnit reporter as CodeBuild currently only supports JUnit or Cucumber reports
    // See https://docs.aws.amazon.com/codebuild/latest/userguide/test-reporting.html
    reporters: [
      'default',
      ['jest-junit', { suiteName: 'Solution integration tests', outputDirectory: './.build/test' }],
    ],

    projects: projectConfigs,
    globals: initResult.globals,
    preset: 'ts-jest',
  };
});

module.exports = runOnce;
