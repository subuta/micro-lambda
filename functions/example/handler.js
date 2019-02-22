const withEventContext = require('./withEventContext')
const { json } = require('micro')

module.exports = withEventContext(async (req, res) => {
  let result = {
    url: req.url,
    method: req.method
  }
  if (req.method === 'POST') {
    result.body = await json(req)
  }
  return result
})
