import { Readable } from 'node:stream'
import { googleDriveStreamUrl } from '~/utils/video'

const FILE_ID_RE = /^[a-zA-Z0-9_-]{10,128}$/

/**
 * Proxy Google Drive media with Range support.
 * Direct browser play fails: Drive rejects campus Referer and sets CORP same-site.
 * Auth is not required here — lesson pages already gate access; Drive links are
 * “anyone with the link”, and <video> cannot send Authorization headers.
 */
export default defineEventHandler(async (event) => {
  const fileId = getRouterParam(event, 'fileId')?.trim() || ''
  if (!FILE_ID_RE.test(fileId)) {
    throw createError({ statusCode: 400, statusMessage: 'ID de video inválido' })
  }

  const range = getHeader(event, 'range')
  const upstreamHeaders: Record<string, string> = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  }
  if (range) upstreamHeaders.Range = range

  let upstream: Response
  try {
    upstream = await fetch(googleDriveStreamUrl(fileId), {
      headers: upstreamHeaders,
      redirect: 'follow',
    })
  } catch {
    throw createError({ statusCode: 502, statusMessage: 'No se pudo conectar con Google Drive' })
  }

  const contentType = upstream.headers.get('content-type') || ''
  if (!upstream.ok || !contentType.includes('video')) {
    throw createError({
      statusCode: 502,
      statusMessage:
        'Google Drive no entregó el video. Compartilo como “Cualquiera con el enlace”.',
    })
  }

  if (!upstream.body) {
    throw createError({ statusCode: 502, statusMessage: 'Respuesta vacía de Drive' })
  }

  setResponseStatus(event, upstream.status)
  setHeader(event, 'Content-Type', contentType)
  setHeader(event, 'Accept-Ranges', upstream.headers.get('accept-ranges') || 'bytes')
  setHeader(event, 'Cache-Control', 'private, max-age=120')

  const contentLength = upstream.headers.get('content-length')
  if (contentLength) setHeader(event, 'Content-Length', contentLength)

  const contentRange = upstream.headers.get('content-range')
  if (contentRange) setHeader(event, 'Content-Range', contentRange)

  const nodeStream = Readable.fromWeb(upstream.body as import('stream/web').ReadableStream)
  return sendStream(event, nodeStream)
})
