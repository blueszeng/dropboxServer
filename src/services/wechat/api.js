import wechatApi from '../../stores/wechatApi'
import _debug from 'debug'
const debug = _debug('dropbox:service:wechat:api')
const getMedia = async (mediaId) => {
  return new Promise((resolve, reject) => {
    wechatApi.getMedia(mediaId, (err, result) => {
      if (err) {
        debug('getMedia错误: %s', err)
        return reject('获取微信媒体文件错误')
      }
      return resolve(result)
    })
  })
}

export { getMedia }
