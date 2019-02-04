const _ = require('lodash')
const path = require('path')

module.exports = (wallaby) => {
  return {
    files: [
      { pattern: 'src/index.js', instrument: false },
      'src/**/*.js',
      'micro-lambda/**/*',
      'tests/**/*.js',
      '!micro-lambda/**/__tests__/*.js',
      '!src/**/__tests__/*.js'
    ],

    tests: [
      'src/**/__tests__/*.js',
      'micro-lambda/**/__tests__/*.js',
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
