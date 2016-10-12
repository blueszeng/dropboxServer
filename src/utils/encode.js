import { randomBytes, pbkdf2 } from 'crypto'
import Hashids from 'hashids'
import { HASHKEY } from '../config'

export const hashids8 = new Hashids(HASHKEY, 8)

const asyncRandomBytes = () => {
  return new Promise((resolve, reject) => {
    randomBytes(128, (err, salt) => {
      if (err) {
        return reject(err)
      } else {
        return resolve(salt.toString('hex'))
      }
    })
  })
}

const asyncPBKDBF2 = (plainText, salt) => {
  return new Promise((resolve, reject) => {
    pbkdf2(plainText, salt, 4096, 256, (err, hash) => {
      if (err) {
        reject(err)
      } else {
        resolve(hash.toString('hex'))
      }
    })
  })
}

/**
 * [async 使用PBKDF2算法加密字符串]
 * @param  {[String]} plainText [未加密的字符串]
 * @param  {[String]} salt      [盐值，可选参数，不提供则生成随机盐值]
 * @return {[Promise]}           [{
 *   encrypted: '加密后的字符串',
 *   salt: '盐值'
 * }]
 */
const encodePBKDF2 = async (plainText, salt) => {
  if (!salt) {
    salt = await asyncRandomBytes()
  }
  const encrypted = await asyncPBKDBF2(plainText, salt)
  return Promise.resolve({ encrypted, salt })
}

/**
 * [async 生成随机盐值]
 * @return {[Promise]} [256位长度的随机盐值]
 */
const randomSalt = async () => {
  const salt = await asyncRandomBytes()
  return Promise.resolve(salt)
}

export { randomSalt, encodePBKDF2 }
