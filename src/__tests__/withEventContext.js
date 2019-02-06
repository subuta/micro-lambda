// https://github.com/awslabs/aws-serverless-express/blob/master/__tests__/middleware.js

import withEventContext from '../withEventContext'

const mockNext = jest.fn()
const mockRes = {}

const generateMockReq = () => {
  return {
    headers: {
      'x-apigateway-event': encodeURIComponent(JSON.stringify({
        path: '/foo/bar',
        queryStringParameters: {
          foo: '🖖',
          bar: '~!@#$%^&*()_+`-=;\':",./<>?`'
        }
      })),
      'x-apigateway-context': encodeURIComponent(JSON.stringify({ foo: 'bar' }))
    }
  }
}

afterEach(() => {
  mockNext.mockRestore()
})

test('defaults', () => {
  const req = generateMockReq()
  const originalHeaders = Object.assign({}, req.headers)

  withEventContext(mockNext)(req, mockRes)

  expect(mockNext).toHaveBeenCalledWith(req, mockRes)

  expect(req.apiGateway.event).toEqual(JSON.parse(decodeURIComponent(originalHeaders['x-apigateway-event'])))
  expect(req.apiGateway.context).toEqual(JSON.parse(decodeURIComponent(originalHeaders['x-apigateway-context'])))
  expect(req.headers['x-apigateway-event']).toBe(undefined)
  expect(req.headers['x-apigateway-context']).toBe(undefined)
})

test('options.reqPropKey', () => {
  const req = generateMockReq()
  const originalHeaders = Object.assign({}, req.headers)

  withEventContext(mockNext, { reqPropKey: '_apiGateway' })(req, mockRes)

  expect(mockNext).toHaveBeenCalledWith(req, mockRes)

  expect(req._apiGateway.event).toEqual(JSON.parse(decodeURIComponent(originalHeaders['x-apigateway-event'])))
  expect(req._apiGateway.context).toEqual(JSON.parse(decodeURIComponent(originalHeaders['x-apigateway-context'])))
  expect(req.headers['x-apigateway-event']).toBe(undefined)
  expect(req.headers['x-apigateway-context']).toBe(undefined)
})

test('options.deleteHeaders = false', () => {
  const req = generateMockReq()
  const originalHeaders = Object.assign({}, req.headers)

  withEventContext(mockNext, { deleteHeaders: false })(req, mockRes)

  expect(mockNext).toHaveBeenCalledWith(req, mockRes)

  expect(req.apiGateway.event).toEqual(JSON.parse(decodeURIComponent(originalHeaders['x-apigateway-event'])))
  expect(req.apiGateway.context).toEqual(JSON.parse(decodeURIComponent(originalHeaders['x-apigateway-context'])))
  expect(req.headers['x-apigateway-event']).toEqual(originalHeaders['x-apigateway-event'])
  expect(req.headers['x-apigateway-context']).toEqual(originalHeaders['x-apigateway-context'])
})

test('Missing x-apigateway-event', () => {
  const req = generateMockReq()
  delete req.headers['x-apigateway-event']

  withEventContext(mockNext, { deleteHeaders: false })(req, mockRes)

  expect(mockNext).toHaveBeenCalledWith(req, mockRes)

  expect(req.apiGateway).toBe(undefined)
})

test('Missing x-apigateway-context', () => {
  const req = generateMockReq()
  delete req.headers['x-apigateway-context']

  withEventContext(mockNext, { deleteHeaders: false })(req, mockRes)

  expect(mockNext).toHaveBeenCalledWith(req, mockRes)

  expect(req.apiGateway).toBe(undefined)
})
