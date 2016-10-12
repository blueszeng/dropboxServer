import Router from 'koa-router'
import apiRoute from './api/index'

const router = Router()

router.use('/api', apiRoute.routes())

export default router
