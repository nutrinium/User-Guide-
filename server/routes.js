import express from 'express'
import cors from 'cors'
import {
  pool,
  initSchema,
  mapApplication,
  mapModule,
  mapGuide,
  mapMedia,
  toMysqlDate,
  generateId,
} from './db.js'
import { slugifyAppCode } from './utils/appCode.js'

const router = express.Router()

router.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ ok: true, database: process.env.DB_NAME })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

router.get('/bootstrap', async (_req, res) => {
  try {
    const [apps] = await pool.query('SELECT * FROM applications ORDER BY created_at')
    const [modules] = await pool.query('SELECT * FROM modules ORDER BY created_at')
    const [guides] = await pool.query('SELECT * FROM guides ORDER BY sort_order, created_at')
    const [media] = await pool.query(
      `SELECT id, application_id, module_id, guide_id, section_id, guide_title, section_title,
              type, name, description, file_name, file_type, file_size, content_text,
              created_at, updated_at FROM media ORDER BY created_at`
    )

    res.json({
      applications: apps.map(mapApplication),
      modules: modules.map(mapModule),
      guides: guides.map(mapGuide),
      media: media.map((row) => mapMedia(row, false)),
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Applications
router.post('/applications', async (req, res) => {
  try {
    const now = new Date().toISOString()
    const code = req.body.code?.trim() || slugifyAppCode(req.body.name)
    const app = {
      id: generateId(),
      code,
      name: req.body.name,
      description: req.body.description || '',
      icon: req.body.icon || 'LayoutGrid',
      color: req.body.color || '#2563eb',
      logoUrl: req.body.logoUrl || null,
      isActive: req.body.isActive !== false,
      createdAt: now,
      updatedAt: now,
    }
    await pool.query(
      `INSERT INTO applications (id, code, name, description, icon, color, logo_url, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        app.id,
        app.code,
        app.name,
        app.description,
        app.icon,
        app.color,
        app.logoUrl,
        app.isActive ? 1 : 0,
        toMysqlDate(app.createdAt),
        toMysqlDate(app.updatedAt),
      ]
    )
    res.status(201).json(app)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/applications/:id', async (req, res) => {
  try {
    const updatedAt = new Date().toISOString()
    const { name, description, icon, color, isActive, code, logoUrl } = req.body
    await pool.query(
      `UPDATE applications SET name=?, description=?, icon=?, color=?, is_active=?, code=COALESCE(?, code), logo_url=COALESCE(?, logo_url), updated_at=? WHERE id=?`,
      [
        name,
        description || '',
        icon,
        color,
        isActive ? 1 : 0,
        code || null,
        logoUrl ?? null,
        toMysqlDate(updatedAt),
        req.params.id,
      ]
    )
    const [rows] = await pool.query('SELECT * FROM applications WHERE id=?', [req.params.id])
    res.json(mapApplication(rows[0]))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/applications/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM applications WHERE id=?', [req.params.id])
    res.status(204).end()
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Modules
router.post('/modules', async (req, res) => {
  try {
    const now = new Date().toISOString()
    const mod = {
      id: generateId(),
      applicationId: req.body.applicationId || '',
      name: req.body.name,
      description: req.body.description || '',
      icon: req.body.icon || 'FileText',
      color: req.body.color || '#2563eb',
      isActive: req.body.isActive !== false,
      createdAt: now,
      updatedAt: now,
    }
    await pool.query(
      `INSERT INTO modules (id, application_id, name, description, icon, color, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        mod.id,
        mod.applicationId,
        mod.name,
        mod.description,
        mod.icon,
        mod.color,
        mod.isActive ? 1 : 0,
        toMysqlDate(mod.createdAt),
        toMysqlDate(mod.updatedAt),
      ]
    )
    res.status(201).json(mod)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/modules/:id', async (req, res) => {
  try {
    const updatedAt = new Date().toISOString()
    const { applicationId, name, description, icon, color, isActive } = req.body
    await pool.query(
      `UPDATE modules SET application_id=?, name=?, description=?, icon=?, color=?, is_active=?, updated_at=? WHERE id=?`,
      [
        applicationId,
        name,
        description || '',
        icon,
        color,
        isActive ? 1 : 0,
        toMysqlDate(updatedAt),
        req.params.id,
      ]
    )
    const [rows] = await pool.query('SELECT * FROM modules WHERE id=?', [req.params.id])
    res.json(mapModule(rows[0]))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/modules/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM modules WHERE id=?', [req.params.id])
    res.status(204).end()
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Guides
router.post('/guides', async (req, res) => {
  try {
    const now = new Date().toISOString()
    const body = req.body
    const guide = {
      id: generateId(),
      applicationId: body.applicationId || '',
      moduleId: body.moduleId || '',
      title: body.title,
      description: body.description || '',
      sections: body.sections || [],
      status: body.status || 'draft',
      order: body.order ?? 0,
      createdAt: now,
      updatedAt: now,
      publishedAt: body.status === 'published' ? now : null,
    }
    await pool.query(
      `INSERT INTO guides (id, application_id, module_id, title, description, sections, status, sort_order, created_at, updated_at, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        guide.id,
        guide.applicationId,
        guide.moduleId,
        guide.title,
        guide.description,
        JSON.stringify(guide.sections),
        guide.status,
        guide.order,
        toMysqlDate(guide.createdAt),
        toMysqlDate(guide.updatedAt),
        toMysqlDate(guide.publishedAt),
      ]
    )
    res.status(201).json(guide)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/guides/:id', async (req, res) => {
  try {
    const updatedAt = new Date().toISOString()
    const body = req.body
    const [existingRows] = await pool.query('SELECT status FROM guides WHERE id=?', [req.params.id])
    const prevStatus = existingRows[0]?.status
    let publishedAt = body.publishedAt ?? null
    if (body.status === 'published' && prevStatus !== 'published') {
      publishedAt = updatedAt
    }
    if (body.status === 'draft') {
      publishedAt = null
    }
    await pool.query(
      `UPDATE guides SET application_id=?, module_id=?, title=?, description=?, sections=?, status=?, sort_order=?, updated_at=?, published_at=? WHERE id=?`,
      [
        body.applicationId,
        body.moduleId || '',
        body.title,
        body.description || '',
        JSON.stringify(body.sections || []),
        body.status,
        body.order ?? 0,
        toMysqlDate(updatedAt),
        toMysqlDate(publishedAt),
        req.params.id,
      ]
    )
    const [rows] = await pool.query('SELECT * FROM guides WHERE id=?', [req.params.id])
    res.json(mapGuide(rows[0]))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/guides/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM media WHERE guide_id=?', [req.params.id])
    await pool.query('DELETE FROM guides WHERE id=?', [req.params.id])
    res.status(204).end()
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Media
router.get('/media/:id/file', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT file_data, file_type, file_name FROM media WHERE id=?', [
      req.params.id,
    ])
    if (!rows[0]?.file_data) {
      return res.status(404).json({ error: 'File not found' })
    }
    res.json({ fileData: rows[0].file_data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/media', async (req, res) => {
  try {
    const now = new Date().toISOString()
    const body = req.body
    const item = {
      id: generateId(),
      applicationId: body.applicationId || '',
      moduleId: body.moduleId || '',
      guideId: body.guideId || '',
      sectionId: body.sectionId || '',
      guideTitle: body.guideTitle || '',
      sectionTitle: body.sectionTitle || '',
      type: body.type,
      name: body.name,
      description: body.description || '',
      fileName: body.fileName || '',
      fileType: body.fileType || '',
      fileSize: body.fileSize || 0,
      contentText: body.contentText || '',
      createdAt: now,
      updatedAt: now,
    }
    await pool.query(
      `INSERT INTO media (id, application_id, module_id, guide_id, section_id, guide_title, section_title,
        type, name, description, file_name, file_type, file_size, content_text, file_data, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item.id,
        item.applicationId,
        item.moduleId,
        item.guideId,
        item.sectionId,
        item.guideTitle,
        item.sectionTitle,
        item.type,
        item.name,
        item.description,
        item.fileName,
        item.fileType,
        item.fileSize,
        item.contentText,
        body.fileData || null,
        toMysqlDate(item.createdAt),
        toMysqlDate(item.updatedAt),
      ]
    )
    res.status(201).json(item)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/media/:id', async (req, res) => {
  try {
    const updatedAt = new Date().toISOString()
    const body = req.body
    const fields = [
      'application_id = ?',
      'module_id = ?',
      'guide_id = ?',
      'section_id = ?',
      'guide_title = ?',
      'section_title = ?',
      'type = ?',
      'name = ?',
      'description = ?',
      'file_name = ?',
      'file_type = ?',
      'file_size = ?',
      'content_text = ?',
      'updated_at = ?',
    ]
    const values = [
      body.applicationId || '',
      body.moduleId || '',
      body.guideId || '',
      body.sectionId || '',
      body.guideTitle || '',
      body.sectionTitle || '',
      body.type,
      body.name,
      body.description || '',
      body.fileName || '',
      body.fileType || '',
      body.fileSize || 0,
      body.contentText || '',
      toMysqlDate(updatedAt),
    ]
    if (body.fileData) {
      fields.push('file_data = ?')
      values.push(body.fileData)
    }
    values.push(req.params.id)
    await pool.query(`UPDATE media SET ${fields.join(', ')} WHERE id=?`, values)

    const [rows] = await pool.query(
      `SELECT id, application_id, module_id, guide_id, section_id, guide_title, section_title,
              type, name, description, file_name, file_type, file_size, content_text,
              created_at, updated_at FROM media WHERE id=?`,
      [req.params.id]
    )
    res.json(mapMedia(rows[0], false))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/media/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM media WHERE id=?', [req.params.id])
    res.status(204).end()
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export { initSchema }
export default router
