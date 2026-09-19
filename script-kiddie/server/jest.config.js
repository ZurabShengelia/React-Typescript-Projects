module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/src/tests/**/*.test.ts"],
  setupFilesAfterEnv: ["<rootDir>/src/tests/setup.ts"],
  testTimeout: 30000,

  transform: {
    "^.+\\.ts$": ["ts-jest", { isolatedModules: true }],
  },
};
