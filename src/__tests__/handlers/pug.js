import pug from 'pug'
import etag from 'etag'
import path from 'path'

import { wetag } from '../../utils'

const INDEX_PUG = path.resolve(__dirname, '../views/index.pug')

export default async (req, res) => {
  const html = pug.renderFile(INDEX_PUG, {
    apiUrl: req.apiGateway ? `https://${req.apiGateway.event.headers.Host}/${req.apiGateway.event.requestContext.stage}` : 'http://localhost:3000'
  })

  res.setHeader('content-type', 'text/html; charset=utf-8')
  res.setHeader('etag', wetag(html))

  return html
}
