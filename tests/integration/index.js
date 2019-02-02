import _ from 'lodash'
import assert from 'assert'
import path from 'path'

import lambda from 'docker-lambda'

const ROOT_DIR = path.resolve(__dirname, '../../')
const SRC_DIR = path.resolve(ROOT_DIR, './src')

const runIndex = lambda({
  taskDir: SRC_DIR,
  dockerImage: 'lambci/lambda:nodejs8.10',
  handler: 'index.handler',
  event: {
    some: 'event'
  }
})

assert.strictEqual(runIndex, 'done!')
