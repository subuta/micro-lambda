import { send } from 'micro'

export default async (req, res) => {
  return send(res, 200, { hoge: 'piyo' })
}
