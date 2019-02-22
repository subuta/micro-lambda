const { createServer, proxy } = require('aws-serverless-express')
const { run } = require('micro')
const handler = require('./handler')

// Handle HTTP Request with micro.
const server = createServer((req, res) => run(req, res, handler))

exports.handler = (event, context, cb) => {
  context.callbackWaitsForEmptyEventLoop = false
  proxy(server, event, context, 'CALLBACK', cb)
}
