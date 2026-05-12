module.exports = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: "src",
  testRegex: ".*\\.spec\\.ts$",
  transform: {
    "^.+\\.(t|j)s$": "ts-jest",
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  collectCoverageFrom: ["**/*.(t|j)s"],
  coverageDirectory: "../coverage",
  coverageThreshold: {
    global: {
      branches: 56,
      functions: 59,
      lines: 60,
      statements: 60,
    },
  },
  testEnvironment: "node",
  setupFiles: ["<rootDir>/../test/setup-env.ts"],
};
