import Router from 'koa-router'
import { validate, Joi } from '../../../utils/validator/validator'
import wrapRoute from '../../../utils/wrapRoute'
// import { DEVELOPMENT } from '../../../config'

const router = Router()

/**
 * method: get
 * path: /api/auth/load
 * desc: 客户端header检测是否已登录，如果已登录返回用户的profile对象
 * params: null
 * response: {}
 */
router.get('/load', wrapRoute(async (ctx) => {
  const userId = ctx.state.userId
  if (!userId) {
    return Promise.resolve('未授权的访问')
  }
  const userProfile = await getProfileByUser(userId)
  userProfile.subscribe = await getUserSubscribeByUserId({ userId })
  return Promise.resolve(userProfile)
}))

/**
 * method: post
 * path: /api/auth/loginLocal
 * test: http://localhost:3005/api/auth/loginLocal
 * testBody: {
 * 	mobile: '18926030755',
 * 	password: 'dirdell',
 * 	rememberMe: false
 * }
 * desc: 本地认证策略手机号加密码方式登录，如果登录成功返回用户的profile对象，并且在response header附加JWT Token
 * params: {
 *   mobile: '手机号码',
 *   password: '登录密码',
 *   rememberMe: '是否保存登录状态'
 * }
 * response: {}
 */
router.post('/loginLocal', wrapRoute(async (ctx) => {
  const validSchema = Joi.object().keys({
    mobile: Joi.string().regex(/^1[34578]\d{9}$/).length(11).required().label('手机号码'),
    password: Joi.string().min(3).max(64).required().label('登录密码'),
    rememberMe: Joi.boolean().optional().label('记住我')
  })
  const { body } = ctx.request
  await validate(body, validSchema)
  const { mobile, password, rememberMe } = body
  const userProfile = await loginLocal(mobile, password)
  const token = createToken(userProfile.id, ctx.headers['user-agent'], rememberMe ? 7 : 1)
  ctx.response.set('x-deerwar-token', token)
  return Promise.resolve(userProfile)
}))


/**
 * method: post
 * path: /api/auth/loginWechat
 * test: http://localhost:3005/api/auth/loginWechat
 * testBody: {
 * 	code: '031amDqz1dLuj308ZWoz1pZBqz1amDqv'
 * }
 * desc: 微信oauth授权后code登录，如果登录成功返回用户的profile对象，并且在response header附加JWT Token
 * params: {
 *   code: '微信oauth授权后回调的code'
 * }
 * response: {}
 */
router.post('/loginWechat', wrapRoute(async (ctx) => {
  const validSchema = Joi.object().keys({
    code: Joi.string().length(32).required().label('微信身份验证代码')
  })
  const { code } = await validate(ctx.request.body, validSchema)
  const openid = await getOpenid(code)
  const userProfile = await loginOrRegisterWechat(openid)
  const token = createToken(userProfile.id, ctx.headers['user-agent'], 1)
  ctx.response.set('x-deerwar-token', token)
  return Promise.resolve(userProfile)
}))
