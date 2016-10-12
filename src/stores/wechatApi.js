import Api from 'wechat-api'
import _debug from 'debug'
import redis from './redis'
import { WECHAT_APPID, WECHAT_SECRET } from '../config'

const debug = _debug('backend:middleware:wechatApi')

const wechatApi = new Api(WECHAT_APPID, WECHAT_SECRET, (callback) => {
  // 这里不使用promise化后的redis.getAsync
  redis.get('wechat:api', (err, result) => {
    if (err) {
      debug('在缓存中获取微信Api Token错误: %s', err)
      return callback(err)
    }
    if (!result) {
      debug('在缓存中微信Api Token为空')
      return callback(null, null)
    }
    return callback(null, JSON.parse(result))
  })
}, (token, callback) => {
  // 这里不使用promise化后的redis.setexAsync
  redis.setex('wechat:api', 3600, JSON.stringify(token), (err) => {
    if (err) {
      debug('向缓存中写入微信Api Token错误: %s', err)
      return callback(err)
    }
    return callback(null, token)
  })
})

/**
 * [registerTicketHandle 注册微信JSAPI TicketHandler]
 * 微信目前有四套Token系统，注意不要混淆:
 * 1) 主动调用微信api的access_token（同微信主动通知服务器接收消息后主动调用api的access_token）
 * 2) 主动调用微信js api的ticket
 * 3) 微信用户oauth授权后每个openid对应的access_token
 * 4) 微信卡券的access_token
 */
wechatApi.registerTicketHandle((type, callback) => {
  // 这里不使用promise化后的redis.getAsync
  redis.get('wechat:jsticket', (err, result) => {
    if (err) {
      debug('在缓存中获取微信JSApi Ticket错误: %s', err)
      return callback(err)
    }
    if (!result) {
      return callback(null, null)
    }
    return callback(null, JSON.parse(result))
  })
}, (type, ticket, callback) => {
  // 这里不使用promise化后的redis.setexAsync
  redis.setex('wechat:jsticket', 3600, JSON.stringify(ticket), (err) => {
    if (err) {
      debug('向缓存中写入微信JSApi Ticket错误: %s', err)
      return callback(err)
    }
    return callback(null, ticket)
  })
})

export default wechatApi
