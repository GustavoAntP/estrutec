module.exports = {
  testEnvironment: "node",

  testMatch: [
    "**/tests/**/*.test.js"
  ],

  collectCoverage: true,

  collectCoverageFrom: [
    "src/**/*.js",
    "!src/**/*.test.js"
  ],

  coverageDirectory: "coverage",

  coverageReporters: [
    "text",
    "html",
    "lcov"
  ],

  clearMocks: true
};