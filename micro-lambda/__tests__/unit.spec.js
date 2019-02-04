// https://github.com/awslabs/aws-serverless-express/blob/master/__tests__/unit.js

import path from 'path'

import {
  getPathWithQueryStringParams,
  mapApiGatewayEventToHttpRequest,
  forwardConnectionErrorResponseToApiGateway,
  forwardLibraryErrorResponseToApiGateway,
  forwardResponseToApiGateway,
  getSocketPath,
  makeResolver
} from '../utils'

describe('getPathWithQueryStringParams', () => {
  test('getPathWithQueryStringParams: no params', () => {
    const event = {
      path: '/foo/bar'
    }
    const pathWithQueryStringParams = getPathWithQueryStringParams(event)
    expect(pathWithQueryStringParams).toEqual('/foo/bar')
  })

  test('1 param', () => {
    const event = {
      path: '/foo/bar',
      queryStringParameters: {
        'bizz': 'bazz'
      }
    }
    const pathWithQueryStringParams = getPathWithQueryStringParams(event)
    expect(pathWithQueryStringParams).toEqual('/foo/bar?bizz=bazz')
  })

  test('to be url-encoded param', () => {
    const event = {
      path: '/foo/bar',
      queryStringParameters: {
        'redirect_uri': 'http://lvh.me:3000/cb'
      }
    }
    const pathWithQueryStringParams = getPathWithQueryStringParams(event)
    expect(pathWithQueryStringParams).toEqual('/foo/bar?redirect_uri=http%3A%2F%2Flvh.me%3A3000%2Fcb')
  })

  test('2 params', () => {
    const event = {
      path: '/foo/bar',
      queryStringParameters: {
        'bizz': 'bazz',
        'buzz': 'bozz'
      }
    }
    const pathWithQueryStringParams = getPathWithQueryStringParams(event)
    expect(pathWithQueryStringParams).toEqual('/foo/bar?bizz=bazz&buzz=bozz')
  })
})

describe('mapApiGatewayEventToHttpRequest', () => {
  function mapApiGatewayEventToHttpRequestTest (headers) {
    const event = {
      path: '/foo',
      httpMethod: 'GET',
      body: 'Hello serverless!',
      headers
    }
    const eventClone = JSON.parse(JSON.stringify(event))
    delete eventClone.body
    const context = {
      'foo': 'bar'
    }
    const socketPath = '/tmp/server0.sock'
    const httpRequest = mapApiGatewayEventToHttpRequest(event, context, socketPath)

    return { httpRequest, eventClone, context }
  }

  test('mapApiGatewayEventToHttpRequest: with headers', () => {
    const r = mapApiGatewayEventToHttpRequestTest({ 'x-foo': 'foo' })

    expect(r.httpRequest).toEqual({
      method: 'GET',
      path: '/foo',
      headers: {
        'x-foo': 'foo',
        'Content-Length': Buffer.byteLength('Hello serverless!'),
        'x-apigateway-event': encodeURIComponent(JSON.stringify(r.eventClone)),
        'x-apigateway-context': encodeURIComponent(JSON.stringify(r.context))
      },
      socketPath: '/tmp/server0.sock'
    })
  })

  test('mapApiGatewayEventToHttpRequest: without headers', () => {
    const r = mapApiGatewayEventToHttpRequestTest()

    expect(r.httpRequest).toEqual({
      method: 'GET',
      path: '/foo',
      headers: {
        'Content-Length': Buffer.byteLength('Hello serverless!'),
        'x-apigateway-event': encodeURIComponent(JSON.stringify(r.eventClone)),
        'x-apigateway-context': encodeURIComponent(JSON.stringify(r.context))
      },
      socketPath: '/tmp/server0.sock'
    })
  })
})

test('getSocketPath', () => {
  const socketPath = getSocketPath('12345abcdef')
  const isWin = process.platform === 'win32'
  const expectedSocketPath = isWin ? path.join('\\\\?\\\\pipe\\\\', process.cwd(), 'server-12345abcdef') : '/tmp/server-12345abcdef.sock'
  expect(socketPath).toBe(expectedSocketPath)
})

const PassThrough = require('stream').PassThrough

class MockResponse extends PassThrough {
  constructor (statusCode, headers, body) {
    super()
    this.statusCode = statusCode
    this.headers = headers || {}
    this.write(body)
    this.end()
  }
}

class MockServer {
  constructor (binaryTypes) {
    this._binaryTypes = binaryTypes || []
  }
}

class MockContext {
  constructor (resolve) {
    this.resolve = resolve
  }

  succeed (successResponse) {
    this.resolve(successResponse)
  }
}

describe('forwardConnectionErrorResponseToApiGateway', () => {
  test('responds with 502 status', () => {
    return new Promise(
      (resolve, reject) => {
        const context = new MockContext(resolve)
        const contextResolver = {
          succeed: (p) => context.succeed(p.response)
        }
        forwardConnectionErrorResponseToApiGateway('ERROR', contextResolver)
      }
    ).then(successResponse => expect(successResponse).toEqual({
      statusCode: 502,
      body: '',
      headers: {}
    }))
  })
})

describe('forwardLibraryErrorResponseToApiGateway', () => {
  test('responds with 500 status', () => {
    return new Promise(
      (resolve, reject) => {
        const context = new MockContext(resolve)
        const contextResolver = {
          succeed: (p) => context.succeed(p.response)
        }
        forwardLibraryErrorResponseToApiGateway('ERROR', contextResolver)
      }
    ).then(successResponse => expect(successResponse).toEqual({
      statusCode: 500,
      body: '',
      headers: {}
    }))
  })
})

function getContextResolver (resolve) {
  const context = new MockContext(resolve)
  const contextResolver = {
    succeed: (p) => context.succeed(p.response)
  }

  return contextResolver
}

describe('forwardResponseToApiGateway', () => {
  describe('header handling', () => {
    test('multiple headers with the same name get transformed', () => {
      const server = new MockServer()
      const headers = { 'foo': ['bar', 'baz'], 'Set-Cookie': ['bar', 'baz'] }
      const body = 'hello world'
      const response = new MockResponse(200, headers, body)
      return new Promise(
        (resolve, reject) => {
          const contextResolver = getContextResolver(resolve)
          forwardResponseToApiGateway(server, response, contextResolver)
        }
      ).then(successResponse => expect(successResponse).toEqual({
        statusCode: 200,
        body: body,
        headers: { foo: 'bar,baz', 'SEt-Cookie': 'baz', 'set-Cookie': 'bar' },
        isBase64Encoded: false
      }))
    })
  })

  describe('content-type encoding', () => {
    test('content-type header missing', () => {
      const server = new MockServer()
      const headers = { 'foo': 'bar' }
      const body = 'hello world'
      const response = new MockResponse(200, headers, body)
      return new Promise(
        (resolve, reject) => {
          const contextResolver = getContextResolver(resolve)
          forwardResponseToApiGateway(server, response, contextResolver)
        }
      ).then(successResponse => expect(successResponse).toEqual({
        statusCode: 200,
        body: body,
        headers: headers,
        isBase64Encoded: false
      }))
    })

    test('content-type image/jpeg base64 encoded', () => {
      const server = new MockServer(['image/jpeg'])
      const headers = { 'content-type': 'image/jpeg' }
      const body = 'hello world'
      const response = new MockResponse(200, headers, body)
      return new Promise(
        (resolve, reject) => {
          const contextResolver = getContextResolver(resolve)
          forwardResponseToApiGateway(server, response, contextResolver)
        }
      ).then(successResponse => expect(successResponse).toEqual({
        statusCode: 200,
        body: Buffer.from(body).toString('base64'),
        headers: headers,
        isBase64Encoded: true
      }))
    })

    test('content-type application/json', () => {
      const server = new MockServer()
      const headers = { 'content-type': 'application/json' }
      const body = JSON.stringify({ 'hello': 'world' })
      const response = new MockResponse(200, headers, body)
      return new Promise(
        (resolve, reject) => {
          const contextResolver = getContextResolver(resolve)
          forwardResponseToApiGateway(server, response, contextResolver)
        }
      ).then(successResponse => expect(successResponse).toEqual({
        statusCode: 200,
        body: body,
        headers: headers,
        isBase64Encoded: false
      }))
    })

    test('wildcards in binary types array', () => {
      const server = new MockServer(['image/*'])
      const headers = { 'content-type': 'image/jpeg' }
      const body = 'hello world'
      const response = new MockResponse(200, headers, body)
      return new Promise(
        (resolve, reject) => {
          const contextResolver = getContextResolver(resolve)
          forwardResponseToApiGateway(server, response, contextResolver)
        }
      ).then(successResponse => expect(successResponse).toEqual({
        statusCode: 200,
        body: Buffer.from(body).toString('base64'),
        headers: headers,
        isBase64Encoded: true
      }))
    })

    test('extensions in binary types array', () => {
      const server = new MockServer(['.png'])
      const headers = { 'content-type': 'image/png' }
      const body = 'hello world'
      const response = new MockResponse(200, headers, body)
      return new Promise(
        (resolve, reject) => {
          const contextResolver = getContextResolver(resolve)
          forwardResponseToApiGateway(server, response, contextResolver)
        }
      ).then(successResponse => expect(successResponse).toEqual({
        statusCode: 200,
        body: Buffer.from(body).toString('base64'),
        headers: headers,
        isBase64Encoded: true
      }))
    })
  })
})

describe('makeResolver', () => {
  test('CONTEXT_SUCCEED (specified)', () => {
    return new Promise(
      (resolve, reject) => {
        const context = new MockContext(resolve)
        const contextResolver = makeResolver({
          context,
          resolutionMode: 'CONTEXT_SUCCEED'
        })

        return contextResolver.succeed({
          response: 'success'
        })
      }).then(successResponse => expect(successResponse).toEqual('success'))
  })

  test('CALLBACK', () => {
    const callback = (e, response) => response
    const callbackResolver = makeResolver({
      callback
    })
    const successResponse = callbackResolver.succeed({
      response: 'success'
    })

    expect(successResponse).toEqual('success')
  })

  test('PROMISE', () => {
    return new Promise((resolve, reject) => {
      const promise = {
        resolve,
        reject
      }
      const promiseResolver = makeResolver({
        promise
      })

      return promiseResolver.succeed({
        response: 'success'
      })
    }).then(successResponse => {
      expect(successResponse).toEqual('success')
    })
  })
})
