import Koa from 'koa'
import http from 'http'
import compress from 'koa-compress'
import bodyParser from 'koa-bodyparser'
import _debug from 'debug'
import { PORT } from './config'
import logMiddleware from './middlewares/log'
import headerMiddleware from './middlewares/header'
import authMiddleware from './middlewares/auth'
import router from './routes/index'
const debug = _debug('backend:server')
debug('服务启动中')

const app = new Koa()
// http压缩中间件
app.use(compress({
  threshold: 1024
}))
// 解析请求数据到requestBody中间件
app.use(bodyParser())
// 日志中间件
app.use(logMiddleware())
// 处理自定义http头中间件
app.use(headerMiddleware())
// 认证中间件
app.use(authMiddleware())
// 路由控制器中间件
app.use(router.routes())
// 创建监听服务
const server = http.createServer(app.callback())
server.listen(PORT, () => {
  debug(`服务已成功在 http://localhost:${PORT}/ 启动`)
})
