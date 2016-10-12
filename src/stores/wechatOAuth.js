import OAuth from 'wechat-oauth'
import _debug from 'debug'
import redis from './redis'
import { WECHAT_APPID, WECHAT_SECRET } from '../config'

const debug = _debug('backend:middleware:wechatOAuth')

const wechatOAuth = new OAuth(WECHAT_APPID, WECHAT_SECRET, (openid, callback) => {
  // 这里不使用promise化后的redis.hgetAsync
  redis.hget('wechat:oauth', openid, (err, result) => {
    if (err) {
      debug('在缓存中获取用户(openid: %s)微信OAuth Token错误: %s', openid, err)
      return callback(err)
    }
    if (!result) {
      debug('在缓存中获取用户(openid: %s)微信OAuth Token为空', openid)
      return callback(null, null)
    }
    return callback(null, JSON.parse(result))
  })
}, (openid, token, callback) => {
  // 这里不使用promise化后的redis.hsetAsync
  redis.hset('wechat:oauth', openid, JSON.stringify(token), (err) => {
    if (err) {
      debug('向缓存中写入用户(openid: %s)微信OAuth Token错误: %s', openid, err)
      return callback(err)
    }
    return callback(null, token)
  })
})

export default wechatOAuth
