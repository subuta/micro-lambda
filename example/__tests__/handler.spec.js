import micro from 'micro'
import request from 'supertest'

import hoge from '../handler'

let client = null

beforeEach(async () => {
  client = request(micro(hoge))
})

afterEach(async () => {
})

// Unit test
test('should return valid json', async () => {
  const response = await client.post('/')
    .send({ hoge: 'fuga' })
    .expect(200)
  expect(response.body).toEqual({ hoge: 'piyo' })
})
