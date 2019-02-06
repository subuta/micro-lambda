import handler from 'serve-handler'
import path from 'path'

const ROOT_DIR = path.resolve(__dirname, '../')

export default (req, res) => handler(req, res, {
  public: ROOT_DIR,
  rewrites: [
    { source: '/ox', destination: '/ox.jpeg' }
  ]
})
