export default () => {
  return async (ctx, next) => {
    // 客户端类型（wechat/desktop/android/ios）
    const client = ctx.headers['x-deerwar-client']
    if (client) {
      ctx.state = ctx.state || {}
      ctx.state['client'] = client
    }
    return await next()
  }
}
