const withEventContext = (fn, options = {}) => async (req, res) => {
  const {
    reqPropKey = 'apiGateway',
    deleteHeaders = true
  } = options

  if (!req.headers['x-apigateway-event'] || !req.headers['x-apigateway-context']) {
    console.error('Missing x-apigateway-event or x-apigateway-context header(s)')
    return fn(req, res)
  }

  req[reqPropKey] = {
    event: JSON.parse(decodeURIComponent(req.headers['x-apigateway-event'])),
    context: JSON.parse(decodeURIComponent(req.headers['x-apigateway-context']))
  }

  if (deleteHeaders) {
    delete req.headers['x-apigateway-event']
    delete req.headers['x-apigateway-context']
  }

  return fn(req, res)
}

export {
  withEventContext
}

export default withEventContext
