import promise from 'bluebird'
import _debug from 'debug'
import { PSQLURL } from '../config'
const debug = _debug('backend:store:psql')
var options = {
  promiseLib: promise
}
import pgp from 'pg-promise'
pgp = pgp(options)
var psql = pgp(PSQLURL)
debug('PSQL数据库连接已分配')
export default psql
