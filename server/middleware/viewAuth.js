import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { pool, toMysqlDate } from '../db.js'

function hashKey(rawKey) {
  return crypto.createHash('sha256').update(rawKey).digest('hex')
}

function getJwtSecret() {
  return process.env.JWT_SECRET || process.env.VIEW_TOKEN_SECRET || 'change-me-in-production'
}

export function generateApiKey() {
  const raw = `ug_${crypto.randomBytes(32).toString('hex')}`
  return {
    raw,
    hash: hashKey(raw),
    prefix: raw.slice(0, 12),
  }
}

export async function validateApiKey(rawKey) {
  if (!rawKey) return null

  const envKeys = (process.env.VIEW_API_KEYS || '')
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean)
  if (envKeys.includes(rawKey)) {
    return { id: 'env', permission: 'read', applicationId: null, source: 'env' }
  }

  const hash = hashKey(rawKey)
  const [rows] = await pool.query(
    `SELECT id, application_id, permission, is_active, expires_at
     FROM api_keys WHERE key_hash = ? AND is_active = 1 LIMIT 1`,
    [hash]
  )
  const row = rows[0]
  if (!row) return null

  if (row.expires_at && new Date(row.expires_at) < new Date()) return null

  await pool.query(`UPDATE api_keys SET last_used_at = ? WHERE id = ?`, [
    toMysqlDate(new Date().toISOString()),
    row.id,
  ])

  return {
    id: row.id,
    permission: row.permission,
    applicationId: row.application_id || null,
    source: 'db',
  }
}

export function validateViewJwt(token) {
  if (!token) return null
  try {
    const payload = jwt.verify(token, getJwtSecret())
    if (payload.scope !== 'view:read') return null
    return {
      id: payload.sub || 'jwt',
      permission: 'read',
      applicationId: payload.applicationId || null,
      source: 'jwt',
    }
  } catch {
    return null
  }
}

export function issueViewJwt({ applicationId, expiresIn = '30d' } = {}) {
  return jwt.sign(
    {
      scope: 'view:read',
      applicationId: applicationId || null,
    },
    getJwtSecret(),
    { expiresIn, subject: applicationId || 'global' }
  )
}

export async function viewAuth(req, res, next) {
  const apiKey = req.headers['x-api-key']
  const authHeader = req.headers.authorization || ''
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

  let auth = null
  if (apiKey) auth = await validateApiKey(apiKey)
  if (!auth && bearer) auth = validateViewJwt(bearer)

  if (!auth) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Valid read-only API key or JWT required. Use X-API-Key header or Authorization: Bearer <token>.',
    })
  }

  if (auth.permission !== 'read') {
    return res.status(403).json({ error: 'Forbidden', message: 'Read-only access required.' })
  }

  req.viewAuth = auth
  next()
}

export function assertApplicationScope(auth, applicationCode, appRow) {
  if (!auth.applicationId) return true
  if (!appRow) return false
  return auth.applicationId === appRow.id
}
