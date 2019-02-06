import path from 'path'
import lambda from 'docker-lambda'

import apiGatewayEvent from '../../src/__tests__/events/api-gw.json'

const ROOT_DIR = path.resolve(__dirname, '../../')

beforeEach(async () => {
})

afterEach(async () => {
})

test('Run without error with docker-lambda', async () => {
  const response = lambda({
    taskDir: ROOT_DIR,
    dockerImage: 'lambci/lambda:nodejs8.10',
    handler: 'example/index.handler',
    event: apiGatewayEvent
  })

  expect(response.statusCode).toEqual(200)
  expect(response.body).toEqual(jasmine.any(String))
  expect(JSON.parse(response.body)).toEqual({ hoge: 'fuga' })
})
