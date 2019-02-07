import path from 'path'
import lambda from 'docker-lambda'

import getEvent from '../../example/__tests__/events/api-gw.json'
import postEvent from '../../example/__tests__/events/api-gw-post.json'

const ROOT_DIR = path.resolve(__dirname, '../../')

beforeEach(async () => {
})

afterEach(async () => {
})

test('handle GET request', async () => {
  const response = lambda({
    taskDir: ROOT_DIR,
    dockerImage: 'lambci/lambda:nodejs8.10',
    handler: 'example/index.handler',
    event: getEvent
  })

  expect(response.statusCode).toEqual(200)
  expect(response.body).toEqual(jasmine.any(String))
  expect(JSON.parse(response.body)).toEqual({ hoge: 'fuga' })
})

test('handle POST request', async () => {
  const response = lambda({
    taskDir: ROOT_DIR,
    dockerImage: 'lambci/lambda:nodejs8.10',
    handler: 'example/index.handler',
    event: postEvent
  })

  expect(response.statusCode).toEqual(200)
  expect(response.body).toEqual(jasmine.any(String))
  expect(JSON.parse(response.body)).toEqual({ name: 'Sam' })
})
