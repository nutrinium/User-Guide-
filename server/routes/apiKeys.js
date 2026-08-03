import express from 'express'
import { pool, generateId, toMysqlDate } from '../db.js'
import { generateApiKey, issueViewJwt } from '../middleware/viewAuth.js'
import { requireAdminSecret } from '../middleware/adminAuth.js'

const router = express.Router()

router.get('/', async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, key_prefix, application_id, permission, is_active, created_at, expires_at, last_used_at
       FROM api_keys ORDER BY created_at DESC`
    )
    res.json({
      data: rows.map((row) => ({
        id: row.id,
        name: row.name,
        keyPrefix: row.key_prefix,
        applicationId: row.application_id,
        permission: row.permission,
        isActive: Number(row.is_active) === 1,
        createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
        expiresAt: row.expires_at ? new Date(row.expires_at).toISOString() : null,
        lastUsedAt: row.last_used_at ? new Date(row.last_used_at).toISOString() : null,
      })),
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', requireAdminSecret, async (req, res) => {
  try {
    const now = new Date().toISOString()
    const { name, applicationId, expiresAt } = req.body
    if (!name?.trim()) {
      return res.status(400).json({ error: 'name is required' })
    }

    const { raw, hash, prefix } = generateApiKey()
    const id = generateId()

    await pool.query(
      `INSERT INTO api_keys (id, name, key_hash, key_prefix, application_id, permission, is_active, created_at, expires_at)
       VALUES (?, ?, ?, ?, ?, 'read', 1, ?, ?)`,
      [
        id,
        name.trim(),
        hash,
        prefix,
        applicationId || null,
        toMysqlDate(now),
        expiresAt ? toMysqlDate(expiresAt) : null,
      ]
    )

    res.status(201).json({
      id,
      name: name.trim(),
      keyPrefix: prefix,
      applicationId: applicationId || null,
      permission: 'read',
      apiKey: raw,
      message: 'Store this API key securely. It will not be shown again.',
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/token', requireAdminSecret, async (req, res) => {
  try {
    const { applicationId, expiresIn } = req.body
    const token = issueViewJwt({ applicationId, expiresIn })
    res.json({
      token,
      type: 'Bearer',
      scope: 'view:read',
      expiresIn: expiresIn || '30d',
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', requireAdminSecret, async (req, res) => {
  try {
    await pool.query(`UPDATE api_keys SET is_active = 0 WHERE id = ?`, [req.params.id])
    res.status(204).end()
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
