import { defineEventHandler } from 'h3'

export default defineEventHandler((event) => {
  event.res.headers.set('Access-Control-Allow-Origin', '*')
  event.res.headers.set(
    'Access-Control-Allow-Headers',
    'content-type,x-octocopy-key',
  )
  event.res.headers.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  event.res.headers.set('Access-Control-Allow-Credentials', 'true')
  event.res.headers.set('Access-Control-Max-Age', '600')
  event.res.headers.set('Vary', 'Origin')

  if (event.req.method === 'OPTIONS') {
    event.res.status = 204
    return ''
  }
})
