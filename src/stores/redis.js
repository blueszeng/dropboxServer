import redis from 'redis'
import _debug from 'debug'
import bluebird from 'bluebird'
import { REDISURL, REDISPWD } from '../config'

const debug = _debug('backend:store:redis')
const createClient = (n) => {
  debug('连接Redis（%s）', n)
  let tempClient = redis.createClient(REDISURL(n), {
    password: REDISPWD
  })

  tempClient.on('error', (err) => {
    debug('Redis错误: %s', err)
  })

  tempClient.on('connect', () => {
    debug('Redis服务已连接')
  })

  tempClient.on('ready', () => {
    debug('Redis服务已准备好')
  })

  return tempClient
}

export default client
