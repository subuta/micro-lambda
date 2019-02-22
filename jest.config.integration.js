const _ = require('lodash')
const baseConfig = require('./jest.config.js')

// Config for integration(w/t docker-lambda) test (will runs tests within /tests)
module.exports = _.merge({}, baseConfig, {
  // Restore default config
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/functions/example'
  ]
})
