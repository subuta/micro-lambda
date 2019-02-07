const { createServer, proxy } = require('aws-serverless-express')
const withEventContext = require('./withEventContext')
const { run, json } = require('micro')

const handler = withEventContext(async (req, res) => {
  if (req.method === 'POST') {
    return json(req)
  }
  return { hoge: 'fuga' }
})

// Handle HTTP Request with micro.
const server = createServer((req, res) => run(req, res, handler))

exports.handler = (event, context, cb) => {
  context.callbackWaitsForEmptyEventLoop = false
  proxy(server, event, context, 'CALLBACK', cb)
}
