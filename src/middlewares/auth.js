import jwt from 'jsonwebtoken'
import _debug from 'debug'
import moment from 'moment'
import { SECRETKEY } from '../config'
import { createToken } from '../services/auth/login'

const setUnauthrization = (ctx) => {
  const reqId = ctx.state ? (ctx.state.reqId || '') : ''
  ctx.status = 401
  ctx.body = { reqId, message: '未授权的访问' }
}

export default () => {
  return async (ctx, next) => {
    const headers = ctx.headers
    const authorization = headers['authorization']
    const userAgent = headers['user-agent']
    const path = ctx.request.path
    const method = ctx.method
    let isAuthed = false
    if (authorization) {
      const parts = authorization.split(' ')
      if (parts.length === 2 && parts[0] === 'Bearer') {
        const token = parts[1]
        try {
          const user = jwt.verify(token, SECRETKEY)
          if (user && user.userAgent === userAgent) {
            isAuthed = true
            ctx.state = ctx.state || {}
            ctx.state['userId'] = user.userId
            // 判断是否需要续期TOKEN
            if (user.renewTime < moment().unix()) {
              const newToken = createToken(user.userId, userAgent, user.days)
              ctx.response.set('x-deerwar-token', newToken)
            }
          }
        } catch (e) {
          debug('TOKEN验证错误: %s', e)
        }
      }
    }
    if (!isAuthed) {
      setUnauthrization(ctx)
    } else {
      await next()
    }
  }
}
