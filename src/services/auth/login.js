import jwt from 'jsonwebtoken'
import moment from 'moment'
import { SECRETKEY, USER_INIT_DEER_COINS } from '../../config'
import {
  DEER_COINS_TRANSACTIONS_TRADE_TYPE_OFFICIAL_GIFT,
  DEER_COINS_TRANSACTIONS_STATUS_PAID
    } from '../../utils/constant'
import { encodePBKDF2 } from '../../utils/encode'
import { searchUserInfoByMobile } from '../../daos/user/strategy/local'
import { insertUserWechatStrategy, searchUserByUnionId, searchUserByOpenId } from '../../daos/user/strategy/wechat'
import { searchUserByStaff, insertUserStaffStrategy } from '../../daos/user/strategy/staff'
import { insertUser } from '../../daos/user/user'
import { insertUserProfile } from '../../daos/user/profile'
import { insertUserSetting } from '../../daos/user/setting'
import { insertUserDeerCoins, insertDeerCoinsTransaction } from '../../daos/deercoins/user'
import { insertUserDeerPoints } from '../../daos/deerpoints/user'
import { insertUserNotice } from '../../daos/user/notice'
import { getProfileByUser } from '../../services/user/profile'
import { getUserWechatProfile } from '../../services/wechat/oauth'
import mysql from '../../stores/mysql'
import MysqlError from '../../utils/error/MysqlError'

/**
 * [async 根据用户登录提供的手机号码和密码判断用户身份，成功则返回用户基本信息，否则提示错误信息]
 * @param  {[String]} mobile   [用户手机号码]
 * @param  {[String]} password [用户明文登录密码]
 * @return {[Object]}          [用户基本信息对象]
 */
const loginLocal = async (mobile, password) => {
  let user
  try {
    user = await searchUserInfoByMobile(mobile)
  } catch (e) {
    return Promise.reject('错误的手机号码或登录密码')
  }
  const { encrypted } = await encodePBKDF2(password, user.salt)
  if (encrypted !== user.password) {
    return Promise.reject('错误的手机号码或登录密码')
  }
  const userProfile = await getProfileByUser(user.id)
  return Promise.resolve(userProfile)
}

const createUserCommonInfo = async (userId, connection) => {
  await Promise.all([
    insertUserDeerCoins({ userId, deerCoins: USER_INIT_DEER_COINS }, connection),
    insertDeerCoinsTransaction({userId, tradeType: DEER_COINS_TRANSACTIONS_TRADE_TYPE_OFFICIAL_GIFT, deerCoins: USER_INIT_DEER_COINS, status: DEER_COINS_TRANSACTIONS_STATUS_PAID}, connection),
    insertUserDeerPoints(userId, connection),
    insertUserNotice({ userId, hasExchangeNotice: false }, connection)
  ])
}

const registerWechat = async (openid) => {
  const wechatProfile = await getUserWechatProfile(openid)
  // 开始保存事务
  const connection = await mysql.getConnection()
  try {
    await connection.beginTransaction()
    const userId = await insertUser({
      nickName: wechatProfile.nickname,
      avatarUrl: wechatProfile.headimgurl
    }, connection)

    await Promise.all([
      insertUserWechatStrategy({
        userId,
        openid,
        unionId: wechatProfile.unionid
      }, connection),
      insertUserProfile({
        userId,
        sex: wechatProfile.sex,
        province: wechatProfile.province,
        city: wechatProfile.city,
        country: wechatProfile.country
      }, connection),
      insertUserSetting({
        userId,
        lang: wechatProfile.language
      }, connection),
      createUserCommonInfo(userId, connection)
    ])

    await connection.commit()
    return Promise.resolve({
      openid,
      userId
    })
  } catch (e) {
    await connection.rollback()
    return Promise.reject(new MysqlError(e))
  } finally {
    await mysql.releaseConnection(connection)
  }
}

const registerStaff = async (staffName) => {
  // 开始保存事务
  const connection = await mysql.getConnection()
  try {
    await connection.beginTransaction()
    const userId = await insertUser({
      nickName: staffName
    }, connection)

    await Promise.all([
      insertUserStaffStrategy({
        userId,
        staffName
      }, connection),
      insertUserProfile({
        userId,
        sex: 0,
        province: '广东',
        city: '深圳',
        country: '中国'
      }, connection),
      insertUserSetting({
        userId,
        lang: 'zh_CN'
      }, connection),
      createUserCommonInfo(userId, connection)
    ])

    await connection.commit()
    return Promise.resolve({
      staffName,
      id: userId
    })
  } catch (e) {
    await connection.rollback()
    return Promise.reject(new MysqlError(e))
  } finally {
    await mysql.releaseConnection(connection)
  }
}

/**
 * [async 根据微信oauth授权回调的code换取用户openid，判断用户是否已在系统中，已经存在直接返回用户信息对象，否则创建用户的微信认证策略以及调用微信api获取用户的头像，昵称等资料保存并返回用户信息对象]
 * @param  {[String]} code [微信oauth授权回调的code]
 * @return {[Object]}      [用户基本信息对象]
 */
const loginOrRegisterWechat = async (openid) => {
  const wechatProfile = await getUserWechatProfile(openid)
  let user = null

  if (wechatProfile.unionid) {
    user = await searchUserByUnionId(wechatProfile.unionid)
  } else {
    user = await searchUserByOpenId(openid)
  }

  let isNewUser = false
  if (!user) {
    user = await registerWechat(openid)
    isNewUser = true
  }

  const userProfile = await getProfileByUser(user.userId)
  userProfile.isNewUser = isNewUser
  return Promise.resolve(userProfile)
}

const loginOrRegisterStaff = async (staffName) => {
  let user = null
  let isNewUser = false
  try {
    user = await searchUserByStaff(staffName)
  } catch (e) {
    user = await registerStaff(staffName)
    isNewUser = true
  }
  const userProfile = await getProfileByUser(user.id)
  userProfile.isNewUser = isNewUser
  return Promise.resolve(userProfile)
}

/**
 * [创建jwt授权token]
 * @param  {[Number]} userId    [用户id]
 * @param  {[String]} userAgent [用户浏览器代理字串]
 * @param  {[Number]} days      [token有效期天数]
 * @return {[String]}           [jwt字符串]
 */
const createToken = (userId, userAgent, days) => {
  return jwt.sign({
    userId,
    userAgent,
    days,
    renewTime: moment().add(1, 'h').unix()
  }, SECRETKEY, {
    expiresIn: `${days}d`
  })
}

export { loginLocal, loginOrRegisterWechat, loginOrRegisterStaff, createToken }
