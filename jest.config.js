export default {
  testEnvironment: 'jsdom',
  transform: {},
  moduleNameMapper: {
    '^@modules/(.*)$': '<rootDir>/public/modules/$1',
    '^@/(.*)$': '<rootDir>/public/$1',
  },
  testMatch: ['**/__tests__/**/*.js', '**/*.test.js'],
  collectCoverage: true,
  collectCoverageFrom: [
    'public/modules/**/*.js',
    '!public/**/*.test.js',
  ],
  coverageDirectory: 'test-results/coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true,
};
