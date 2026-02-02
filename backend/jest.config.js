module.exports = {
  testEnvironment: 'node',
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    'mongoHelper\\.js',
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/src/__tests__/',
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/config/**',
    '!src/__tests__/**',
  ],
  coverageThreshold: {
    global: {
      branches: 35,
      functions: 62,
      lines: 59,
      statements: 59,
    },
  },
  testTimeout: 30000,
};
