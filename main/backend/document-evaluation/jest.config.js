// jest.config.js
module.exports = {
  // verbose: true,
  notify: false,
  testEnvironment: "node",
  // testPathIgnorePatterns: ['service.test.js'],
  modulePathIgnorePatterns: ["<rootDir>/dist/"],
  testPathIgnorePatterns: ["./lib/document-evaluation/__tests__/__utils__"],
  setupFilesAfterEnv: ["<rootDir>/setup-tests.ts"],
  collectCoverageFrom: [
    "./lib/**/*.ts",
    "!**/*.test.ts",
    "!**/index.ts",
    "!**/*.config.ts",
    "!**/__fixtures__/**",
    "!/dist/",
  ],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  preset: "ts-jest",
};
