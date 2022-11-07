// jest.config.js
module.exports = {
  // verbose: true,
  notify: false,
  testEnvironment: "node",
  // testPathIgnorePatterns: ['service.test.js'],
  modulePathIgnorePatterns: ["<rootDir>/dist/"],
  setupFilesAfterEnv: ["<rootDir>/setup-tests.ts"],
  collectCoverageFrom: [
    "./src/**/*.ts",
    "!**/*.test.ts",
    "!**/index.ts",
    "!**/*.config.ts",
    "!**/__fixtures__/**",
    "!/dist/",
  ],
  coverageThreshold: {
    global: {
      lines: 95,
    },
  },
  preset: "ts-jest",
};
