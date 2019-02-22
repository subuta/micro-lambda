// SEE: https://github.com/awslabs/aws-serverless-express/blob/master/__tests__/integration.js

import path from 'path'
import fs from 'fs'
import _ from 'lodash'
import apiGatewayEvent from './events/api-gw.json'

import { run } from 'micro'
import cors from 'micro-cors'

import {
  pug,
  rest,
  serve as _serve
} from './handlers'

import {
  setUsers
} from './handlers/rest'

import {
  proxy,
  createServer
} from 'aws-serverless-express'

const server = createServer((req, res) => run(req, res, cors({ allowCredentials: false })(pug)))

const createHandler = (listener) => (event, context, resolutionMode, callback, _server) => {
  if (!_server) {
    _server = createServer((req, res) => run(req, res, cors({ allowCredentials: false })(listener)))
  }
  return proxy(_server || server, event, context, resolutionMode, callback)
}

const pugHandler = createHandler(pug)
const restHandler = createHandler(rest)

const makeEvent = (eventOverrides) => {
  const baseEvent = _.clone(apiGatewayEvent)
  const headers = Object.assign({}, baseEvent.headers, eventOverrides.headers)
  const root = Object.assign({}, baseEvent, eventOverrides)
  root.headers = headers
  return root
}

function expectedRootResponse () {
  return makeResponse({
    'headers': {
      'content-length': '3563',
      'content-type': 'text/html; charset=utf-8',
      'etag': 'W/"deb-x+0UpCiuQnoKxcNHE3VgCiidxtM"'
    }
  })
}

function makeResponse (response) {
  const baseResponse = {
    'body': '',
    'isBase64Encoded': false,
    'statusCode': 200
  }
  const baseHeaders = {
    'access-control-allow-origin': '*',
    'connection': 'close',
    'content-type': 'application/json; charset=utf-8'
  }
  const headers = Object.assign({}, baseHeaders, response.headers)
  const finalResponse = Object.assign({}, baseResponse, response)
  finalResponse.headers = headers
  return finalResponse
}

const newName = 'Sandy Samantha Salamander'

describe('integration tests - server', () => {
  test('proxy returns server', async (done) => {
    const succeed = () => done()
    const server = await pugHandler(makeEvent({ path: '/', httpMethod: 'GET' }), { succeed })

    expect(server._socketPathSuffix).toBeTruthy()
  })

  test('server.onError EADDRINUSE', (done) => {
    const serverWithSameSocketPath = createServer((req, res) => res.end(''))
    serverWithSameSocketPath._socketPathSuffix = server._socketPathSuffix

    const succeed = response => {
      expect(response.statusCode).toBe(200)
      done()
      serverWithSameSocketPath.close()
    }
    proxy(serverWithSameSocketPath, makeEvent({}), {
      succeed
    })
  })
})

describe('integration tests - HTML(pug handler)', () => {
  test('GET HTML', (done) => {
    // GET HTML (initial request)
    const succeed = response => {
      delete response.headers.date
      expect(response.body.startsWith('<!DOCTYPE html>')).toBe(true)
      const expectedResponse = expectedRootResponse()
      delete response.body
      delete expectedResponse.body
      expect(response).toEqual(expectedResponse)
      done()
    }

    pugHandler(makeEvent({
      path: '/',
      httpMethod: 'GET'
    }), { succeed }, undefined, server)

    // GET HTML (subsequent request)
    const secondSucceed = response => {
      delete response.headers.date
      expect(response.body.startsWith('<!DOCTYPE html>')).toBe(true)
      const expectedResponse = expectedRootResponse()
      delete response.body
      delete expectedResponse.body
      expect(response).toEqual(expectedResponse)
      done()
    }

    pugHandler(makeEvent({
      path: '/',
      httpMethod: 'GET'
    }), { succeed: secondSucceed }, undefined, server)
  })
})

describe('integration tests - JSON(rest handler)', () => {
  beforeEach(() => {
    // Reset users.
    setUsers([{
      id: 1,
      name: 'Joe'
    }, {
      id: 2,
      name: 'Jane'
    }])
  })

  test('GET JSON collection', (done) => {
    const succeed = response => {
      delete response.headers.date
      expect(response).toEqual(makeResponse({
        'body': '[{"id":1,"name":"Joe"},{"id":2,"name":"Jane"}]',
        'headers': {
          'content-length': '46',
          'etag': 'W/"2-FIn5I8TcpykXiz4yM0WFUNjd3yk"'
        }
      }))
      done()
    }

    restHandler(makeEvent({
      path: '/users',
      httpMethod: 'GET'
    }), { succeed })
  })

  test('GET missing route', (done) => {
    const succeed = response => {
      delete response.headers.date
      // expect(response.body.startsWith('<!DOCTYPE html>')).toBe(true)
      const expectedResponse = makeResponse({
        'headers': {
          'content-length': '15',
          'content-type': 'text/html; charset=utf-8'
        },
        statusCode: 404
      })
      delete response.body
      delete expectedResponse.body
      expect(response).toEqual(expectedResponse)
      done()
    }

    restHandler(makeEvent({
      path: '/nothing-here',
      httpMethod: 'GET'
    }), { succeed })
  })

  test('GET JSON single', (done) => {
    const succeed = response => {
      delete response.headers.date
      expect(response).toEqual(makeResponse({
        'body': '{"id":1,"name":"Joe"}',
        'headers': {
          'content-length': '21',
          'etag': 'W/"15-rRboW+j/yFKqYqV6yklp53+fANQ"'
        }
      }))
      done()
    }

    restHandler(makeEvent({
      path: '/users/1',
      httpMethod: 'GET'
    }), { succeed })
  })

  test('GET JSON single (resolutionMode = CALLBACK)', (done) => {
    const callback = (e, response) => {
      delete response.headers.date
      expect(response).toEqual(makeResponse({
        'body': '{"id":1,"name":"Joe"}',
        'headers': {
          'content-length': '21',
          'etag': 'W/"15-rRboW+j/yFKqYqV6yklp53+fANQ"'
        }
      }))
      done()
    }

    restHandler(makeEvent({
      path: '/users/1',
      httpMethod: 'GET'
    }), {}, 'CALLBACK', callback)
  })

  test('GET JSON single (resolutionMode = PROMISE)', async (done) => {
    const succeed = response => {
      delete response.headers.date
      expect(response).toEqual(makeResponse({
        'body': '{"id":1,"name":"Joe"}',
        'headers': {
          'content-length': '21',
          'etag': 'W/"15-rRboW+j/yFKqYqV6yklp53+fANQ"'
        }
      }))
      done()
    }

    restHandler(makeEvent({
      path: '/users/1',
      httpMethod: 'GET'
    }), {}, 'PROMISE').promise.then(succeed)
  })

  test('GET JSON single (resolutionMode = PROMISE; new server)', (done) => {
    const succeed = response => {
      delete response.headers.date
      expect(response).toEqual(makeResponse({
        'body': '{"id":1,"name":"Joe"}',
        'headers': {
          'content-length': '21',
          'etag': 'W/"15-rRboW+j/yFKqYqV6yklp53+fANQ"'
        }
      }))
      newServer.close()
      done()
    }

    const newServer = createServer((req, res) => run(req, res, cors({ allowCredentials: false })(rest)))
    restHandler(makeEvent({
      path: '/users/1',
      httpMethod: 'GET'
    }), {}, 'PROMISE', null, newServer).promise.then(succeed)
  })

  test('GET JSON single 404', (done) => {
    const succeed = response => {
      delete response.headers.date
      expect(response).toEqual(makeResponse({
        'body': '{}',
        'headers': {
          'content-length': '2',
          'etag': 'W/"2-vyGp6PvFo4RvsFtPoIWeCReyIC8"'
        },
        statusCode: 404
      }))
      done()
    }

    restHandler(makeEvent({
      path: '/users/3',
      httpMethod: 'GET'
    }), { succeed })
  })

  test('POST JSON', async (done) => {
    const succeed = response => {
      delete response.headers.date
      expect(response).toEqual(makeResponse({
        'body': `{"id":3,"name":"${newName}"}`,
        'headers': {
          'content-length': '43',
          'etag': 'W/"2b-ksYHypm1DmDdjEzhtyiv73Bluqk"'
        },
        statusCode: 201
      }))
    }

    await restHandler(makeEvent({
      path: '/users',
      httpMethod: 'POST',
      body: `{"name": "${newName}"}`
    }), {}, 'PROMISE').promise.then(succeed)

    // GET JSON single (again; post-creation) 200
    const secondSucceed = response => {
      delete response.headers.date
      expect(response).toEqual(makeResponse({
        'body': `{"id":3,"name":"${newName}"}`,
        'headers': {
          'content-length': '43',
          'etag': 'W/"2b-ksYHypm1DmDdjEzhtyiv73Bluqk"'
        },
        statusCode: 200
      }))
      done()
    }

    await restHandler(makeEvent({
      path: '/users/3',
      httpMethod: 'GET'
    }), {}, 'PROMISE').promise.then(secondSucceed)
  })

  test('PUT JSON', (done) => {
    const succeed = response => {
      delete response.headers.date
      expect(response).toEqual(makeResponse({
        'body': '{"id":2,"name":"Samuel"}',
        'headers': {
          'content-length': '24',
          'etag': 'W/"18-uGyzhJdtXqacOe9WRxtXSNjIk5Q"'
        },
        statusCode: 200
      }))
      done()
    }

    restHandler(makeEvent({
      path: '/users/2',
      httpMethod: 'PUT',
      body: '{"name": "Samuel"}'
    }), { succeed })
  })

  test('DELETE JSON', (done) => {
    const succeed = response => {
      delete response.headers.date
      expect(response).toEqual(makeResponse({
        'body': `[{"id":2,"name":"Jane"}]`,
        'headers': {
          'content-length': '24',
          etag: 'W/"18-51C7Qo/CplTWyvH+9qGhjvBaExQ"'
        },
        statusCode: 200
      }))
      done()
    }

    restHandler(makeEvent({
      path: '/users/1',
      httpMethod: 'DELETE'
    }), { succeed })
  })
})

describe('integration tests - Image(serve handler)', () => {
  test('success - image response', (done) => {
    const serverWithBinaryTypes = createServer((req, res) => run(req, res, cors({ allowCredentials: false })(_serve)), null, ['image/*'])

    const succeed = response => {
      delete response.headers.date
      delete response.headers.etag
      delete response.headers['last-modified']

      const oxPath = path.resolve(path.join(__dirname, './ox.jpeg'))
      const oxImage = fs.readFileSync(oxPath)
      const oxBase64 = Buffer.from(oxImage).toString('base64')

      expect(response).toEqual(makeResponse({
        'body': oxBase64,
        'headers': {
          'content-length': '8313',
          'content-disposition': 'inline; filename="ox.jpeg"',
          'accept-ranges': 'bytes',
          'content-type': 'image/jpeg'
        },
        'isBase64Encoded': true
      }))

      serverWithBinaryTypes.close()
      done()
    }

    proxy(serverWithBinaryTypes, makeEvent({
      path: '/ox',
      httpMethod: 'GET'
    }), { succeed })
  })

  test('base64 encoded request', (done) => {
    const succeed = response => {
      delete response.headers.date
      expect(response).toEqual(makeResponse({
        'body': '{"id":2,"name":"Samuel"}',
        'headers': {
          'content-length': '24',
          'etag': 'W/"18-uGyzhJdtXqacOe9WRxtXSNjIk5Q"'
        },
        statusCode: 200
      }))
      done()
    }

    restHandler(makeEvent({
      path: '/users/2',
      httpMethod: 'PUT',
      body: global.btoa('{"name": "Samuel"}'),
      isBase64Encoded: true
    }), { succeed })
  })
})
