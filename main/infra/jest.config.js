module.exports = {
  notify: false,
  testEnvironment: 'node',
  modulePathIgnorePatterns: ['./cdk.out'],
  setupFilesAfterEnv: ['<rootDir>/setup-tests.ts'],
  preset: 'ts-jest',
};
