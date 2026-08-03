import crypto from 'crypto'

const DEFAULT_TTL_SEC = 60 * 60 * 24 // 24 hours

function getSecret() {
  return process.env.VIEW_TOKEN_SECRET || process.env.JWT_SECRET || 'change-me-in-production'
}

export function signMediaToken(mediaId, ttlSec = DEFAULT_TTL_SEC) {
  const exp = Math.floor(Date.now() / 1000) + ttlSec
  const payload = `${mediaId}:${exp}`
  const sig = crypto.createHmac('sha256', getSecret()).update(payload).digest('hex')
  return Buffer.from(`${payload}:${sig}`).toString('base64url')
}

export function verifyMediaToken(token, mediaId) {
  if (!token) return false
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8')
    const [id, expStr, sig] = decoded.split(':')
    if (id !== mediaId) return false
    const exp = parseInt(expStr, 10)
    if (!exp || exp < Math.floor(Date.now() / 1000)) return false
    const payload = `${id}:${expStr}`
    const expected = crypto.createHmac('sha256', getSecret()).update(payload).digest('hex')
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  } catch {
    return false
  }
}
