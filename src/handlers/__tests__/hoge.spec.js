import sinon from 'sinon'
import _ from 'lodash'

import request from 'supertest'

import hoge from '../hoge'

let client = null

beforeEach(async () => {
  client = request(hoge)
})

afterEach(async () => {
})

test('should return valid json', async () => {
  const response = await client.post('/')
    .send({ hoge: 'fuga' })
    .expect(200)
  expect(response.body).toEqual({ hoge: 'piyo' })
})
