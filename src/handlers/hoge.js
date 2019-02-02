import { json, send } from 'micro'

export default async (req, res) => {
  const data = await json(req);
  return send(res, 200, { hoge: 'piyo'})
}
