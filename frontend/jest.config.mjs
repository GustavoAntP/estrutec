import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  dir: "./",
});

const config = {
  coverageProvider: "v8",
  testEnvironment: "jsdom",

  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],

  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },

  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/*.test.{ts,tsx}",
    "!src/**/__tests__/**",
  ],

  coverageDirectory: "coverage",

  coverageReporters: [
    "text",
    "html",
    "lcov",
  ],

  testMatch: [
    "**/?(*.)+(spec|test).[tj]s?(x)",
  ],

  clearMocks: true,
};

export default createJestConfig(config);
