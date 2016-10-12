import fetch from 'isomorphic-fetch'

const removeTailAnd = (str) => {
  return str.replace(/&$/, '')
}

const makeGetUrl = (path, params) => {
  if (params && Object.keys(params).length > 0) {
    let uri = `${path}?`
    for (let key of Object.keys(params)) {
      uri += `${key}=${encodeURIComponent(params[key])}&`
    }
    return removeTailAnd(uri)
  } else {
    return removeTailAnd(path)
  }
}

/**
 * 使用 isomorphic-fetch 进行封装, 更方便地进行各种 HTTP 方法的 JSON 请求
 * @param  {String} method) 请求方法
 * @return {Fucntio]}       返回一个函数，可以用于发起请求
 */
const jsonRequestTemplate = (method) => async (url, body = {}, headers = {}) => {
  const allHeaders = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...headers
  }

  if (method === 'GET') {
    url = makeGetUrl(url, body).replace(/&$/, '')
  }

  const res = await fetch(url, {
    method,
    headers: allHeaders,
    body: method === 'GET' ? null : JSON.stringify(body) // A payload within a GET request message has no defined semantics; sending a payload body on a GET request might cause some existing implementations to reject the request.
  })

  return new Promise((resolve, reject) => {
    let body = ''
    res.body.on('data', (chunk) => {
      body += chunk.toString('utf8')
    })
    res.body.on('end', () => {
      try {
        resolve(JSON.parse(body))
      } catch (e) {
        reject(`发生错误 ${url}, ${body}`)
      }
    })
  })
}

/**
 * 使用 isomorphic-fetch 进行封装, 更方便地进行各种 HTTP 方法的 JSON 请求
 * @param  {String} method) 请求方法
 * @return {Fucntio]}       返回一个函数，可以用于发起请求
 */
const jsonRequestHead = (method) => async (url, body = {}, headers = {}) => {
  const allHeaders = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...headers
  }
  const res = await fetch(url, {
    method,
    headers: allHeaders,
    body: method === 'GET' ? null : JSON.stringify(body)
  })
  return Promise.resolve(res.headers._headers)
}

/**
 * Usage:
 *
 * ```
 *  import http from 'utils/http'
 *  const res = await http.post('http://localhost:3005/api/auth/loginLocal', {
 *    mobile: 'xxxx',
 *    passworld: 'xxxx'
 *  })
 *  res.data.nickName === '老步' // => true
 * ```
 */
export default {
  get: jsonRequestTemplate('GET'),
  post: jsonRequestTemplate('POST'),
  put: jsonRequestTemplate('PUT'),
  delete: jsonRequestTemplate('DELETE'),
  postAndHead: jsonRequestHead('POST')
}
