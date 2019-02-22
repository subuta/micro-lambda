const _ = require('lodash')

module.exports = (wallaby) => {
  return {
    files: [
      { pattern: 'example/index.js', instrument: false },
      'functions/example/**/*',
      'tests/**/*.js',
      '!**/node_modules/**/*',
      '!functions/example/**/__tests__/*.spec.js'
    ],

    tests: [
      'functions/example/**/__tests__/*.spec.js'
    ],

    env: {
      type: 'node',
      runner: 'node',

      params: {
        env: _.reduce({
          NODE_ENV: 'test',
          NODE_PATH: wallaby.projectCacheDir, // or whatever the folder is
          // DEBUG: 'knex:client'
        }, (str, value, key) => str + `${key}=${value};`, '')
      }
    },

    compilers: {
      '**/*.js?(x)': wallaby.compilers.babel({
        babel: require('@babel/core')
      })
    },

    testFramework: 'jest'
  }
}
