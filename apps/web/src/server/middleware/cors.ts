import {
  defineEventHandler,
  getMethod,
  getRequestHeader,
  setHeader,
  setResponseStatus,
} from 'h3'

const allowedOrigins =
  process.env.OCTOCOPY_ALLOWED_ORIGIN?.split(',').map((o) => o.trim()) ?? ['*']

const allowAll = allowedOrigins.includes('*')

export default defineEventHandler((event) => {
  const origin = getRequestHeader(event, 'origin') ?? ''
  const matchedOrigin =
    allowAll || !origin
      ? '*'
      : allowedOrigins.find((allowed) => allowed === origin) ??
        allowedOrigins[0]

  setHeader(event, 'Access-Control-Allow-Origin', matchedOrigin)
  setHeader(event, 'Access-Control-Allow-Headers', 'content-type,x-octocopy-key')
  setHeader(event, 'Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  setHeader(event, 'Access-Control-Allow-Credentials', 'true')
  setHeader(event, 'Access-Control-Max-Age', '600')
  setHeader(event, 'Vary', 'Origin')

  if (getMethod(event) === 'OPTIONS') {
    setResponseStatus(event, 204)
    return ''
  }
})
