import { json, send } from 'micro'
import { router, get, post, put, del } from 'microrouter'
import { wetag } from '../../utils'

import _ from 'lodash'

// Ephemeral in-memory data store
let users = [{
  id: 1,
  name: 'Joe'
}, {
  id: 2,
  name: 'Jane'
}]

export const setUsers = (nextUsers) => {
  users = nextUsers
}

let userIdCounter = users.length

const handleUserNotFound = (res) => {
  res.setHeader('etag', wetag(JSON.stringify({})))
  send(res, 404, {})
}

const indexHandler = get('/users', (req, res) => {
  res.setHeader('etag', wetag(users))
  return users
})

const showHandler = get('/users/:userId', (req, res) => {
  const user = getUser(req.params.userId)
  if (!user) return handleUserNotFound(res)

  res.setHeader('etag', wetag(JSON.stringify(user)))
  return user
})

const createHandler = post('/users', async (req, res) => {
  const body = await json(req)

  const user = {
    id: ++userIdCounter,
    name: body.name
  }

  users.push(user)

  res.setHeader('etag', wetag(JSON.stringify(user)))
  return send(res, 201, user)
})

const updateHandler = put('/users/:userId', async (req, res) => {
  const body = await json(req)

  const user = getUser(req.params.userId)
  if (!user) return handleUserNotFound(res)

  user.name = body.name
  res.setHeader('etag', wetag(JSON.stringify(user)))
  return user
})

const deleteHandler = del('/users/:userId', (req, res) => {
  const userIndex = getUserIndex(req.params.userId)

  if (userIndex === -1) return handleUserNotFound(res)

  const nextUsers = _.clone(users)

  nextUsers.splice(userIndex, 1)
  res.setHeader('etag', wetag(JSON.stringify(nextUsers)))
  return nextUsers
})

const notFoundHandler = get('/*', (req, res) => {
  res.setHeader('content-type', 'text/html; charset=utf-8')
  send(res, 404, 'Not found route')
})

const getUser = (userId) => _.clone(users.find(u => u.id === parseInt(userId)))
const getUserIndex = (userId) => _.clone(users.findIndex(u => u.id === parseInt(userId)))

export default router(
  indexHandler,
  showHandler,
  createHandler,
  updateHandler,
  deleteHandler,
  notFoundHandler
)
