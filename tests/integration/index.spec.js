import sinon from 'sinon'
import _ from 'lodash'
import path from "path"

import lambda from 'docker-lambda'

const ROOT_DIR = path.resolve(__dirname, '../../')
const SRC_DIR = path.resolve(ROOT_DIR, './src')

beforeEach(async () => {
})

afterEach(async () => {
})

test('Should run without error with docker-lambda', async () => {
  const result = lambda({
    taskDir: SRC_DIR,
    dockerImage: 'lambci/lambda:nodejs8.10',
    handler: 'index.handler',
    event: {
      some: 'event'
    }
  })
  expect(result).toEqual('done!')
})
