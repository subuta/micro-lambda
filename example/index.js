const { serve, proxy, withEventContext } = require('../lib')
const micro = require('micro')

// Handle HTTP Request with micro.
const server = serve(micro(withEventContext(async (req, res) => {
  if (req.method === 'POST') {
    return micro.json(req)
  }
  return { hoge: 'fuga' }
})))

exports.handler = (event, context, cb) => {
  context.callbackWaitsForEmptyEventLoop = false
  proxy(server, event, context, cb)
}
