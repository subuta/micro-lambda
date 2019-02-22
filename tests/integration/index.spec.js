import path from 'path'
import lambda from 'docker-lambda'

import getEvent from '../../functions/example/__tests__/events/api-gw.json'
import postEvent from '../../functions/example/__tests__/events/api-gw-post.json'

const ROOT_DIR = path.resolve(__dirname, '../../')

beforeEach(async () => {
})

afterEach(async () => {
})

test('handle GET request', async () => {
  const response = lambda({
    taskDir: ROOT_DIR,
    dockerImage: 'lambci/lambda:nodejs8.10',
    handler: 'functions/example/index.handler',
    event: getEvent
  })

  expect(response.statusCode).toEqual(200)
  expect(response.body).toEqual(jasmine.any(String))
  expect(JSON.parse(response.body)).toEqual({
    method: 'GET',
    url: '/users'
  })
})

test('handle POST request', async () => {
  const response = lambda({
    taskDir: ROOT_DIR,
    dockerImage: 'lambci/lambda:nodejs8.10',
    handler: 'functions/example/index.handler',
    event: postEvent
  })

  expect(response.statusCode).toEqual(200)
  expect(response.body).toEqual(jasmine.any(String))
  expect(JSON.parse(response.body)).toEqual({
    method: 'POST',
    url: '/users',
    body: {
      name: 'Sam'
    }
  })
})
