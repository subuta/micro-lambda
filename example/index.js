const { serve, proxy } = require('../lib')
const micro = require('micro')

const server = serve(micro(async (req, res) => {
  return { hoge: 'fuga' }
}))

exports.handler = (event, context, cb) => {
  proxy(server, event, context, cb)
}
