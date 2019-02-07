import etagFn from 'etag'

const createETagGenerator = (options) => {
  return function generateETag (body, encoding) {
    const buf = !Buffer.isBuffer(body)
      ? Buffer.from(body, encoding)
      : body
    return etagFn(buf, options)
  }
}

// Express compatible etag function.
// SEE: https://github.com/expressjs/express/blob/master/lib/utils.js#L274
const etag = createETagGenerator({ weak: false })
const wetag = createETagGenerator({ weak: true })

export {
  etag,
  wetag
}

export default {
  etag,
  wetag
}
