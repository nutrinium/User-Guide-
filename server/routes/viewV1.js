import express from 'express'
import { viewAuth, assertApplicationScope } from '../middleware/viewAuth.js'
import { verifyMediaToken } from '../utils/signedToken.js'
import { parsePagination, paginate, sortItems } from '../utils/pagination.js'
import {
  getApplicationsList,
  getApplicationDetail,
  getModulesByApplicationCode,
  getScreensByModule,
  getScreenDetail,
  getScreenSteps,
  getWorkflow,
  globalSearch,
  getMediaFileForView,
  fetchApplicationByCode,
} from '../services/viewService.js'

const router = express.Router()

function decodeDataUrl(fileData) {
  if (!fileData) return null
  const match = fileData.match(/^data:([^;]+);base64,(.+)$/)
  if (match) {
    return { mimeType: match[1], buffer: Buffer.from(match[2], 'base64') }
  }
  if (fileData.startsWith('data:')) {
    const comma = fileData.indexOf(',')
    const header = fileData.slice(0, comma)
    const mimeType = header.replace('data:', '').replace(';base64', '')
    return { mimeType, buffer: Buffer.from(fileData.slice(comma + 1), 'base64') }
  }
  return { mimeType: 'application/octet-stream', buffer: Buffer.from(fileData, 'base64') }
}

router.get('/health', (_req, res) => {
  res.json({ ok: true, version: 'v1', scope: 'view' })
})

router.get('/applications', viewAuth, async (req, res) => {
  try {
    const { page, limit, sort, order } = parsePagination(req.query)
    let items = await getApplicationsList(req)

    if (req.viewAuth.applicationId) {
      const { pool } = await import('../db.js')
      const [rows] = await pool.query(`SELECT code FROM applications WHERE id = ?`, [
        req.viewAuth.applicationId,
      ])
      const scopedCode = rows[0]?.code
      if (scopedCode) {
        items = items.filter((i) => i.code === scopedCode)
      }
    }

    items = sortItems(items, sort === 'code' ? 'code' : 'name', order)
    res.json(paginate(items, { page, limit }))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/applications/:applicationCode', viewAuth, async (req, res) => {
  try {
    const detail = await getApplicationDetail(req, req.params.applicationCode.toUpperCase())
    if (!detail) return res.status(404).json({ error: 'Application not found' })

    const app = await fetchApplicationByCode(req.params.applicationCode)
    if (!assertApplicationScope(req.viewAuth, req.params.applicationCode, app)) {
      return res.status(403).json({ error: 'Access denied for this application' })
    }

    res.json(detail)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/applications/:applicationCode/modules', viewAuth, async (req, res) => {
  try {
    const app = await fetchApplicationByCode(req.params.applicationCode)
    if (!app) return res.status(404).json({ error: 'Application not found' })
    if (!assertApplicationScope(req.viewAuth, req.params.applicationCode, app)) {
      return res.status(403).json({ error: 'Access denied for this application' })
    }

    const { page, limit, sort, order } = parsePagination(req.query)
    let modules = await getModulesByApplicationCode(req.params.applicationCode)
    modules = sortItems(modules, sort === 'name' ? 'name' : 'name', order)
    res.json(paginate(modules, { page, limit }))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/applications/:applicationCode/screens', viewAuth, async (req, res) => {
  try {
    const app = await fetchApplicationByCode(req.params.applicationCode)
    if (!app) return res.status(404).json({ error: 'Application not found' })
    if (!assertApplicationScope(req.viewAuth, req.params.applicationCode, app)) {
      return res.status(403).json({ error: 'Access denied for this application' })
    }

    const { fetchPublishedGuides } = await import('../services/viewService.js')
    const { page, limit } = parsePagination(req.query)
    const guides = await fetchPublishedGuides({ applicationId: app.id, moduleId: '' })
    const screens = guides.map((g) => ({
      id: g.id,
      title: g.title,
      description: g.description,
      order: g.order,
      workflowId: g.id,
    }))
    res.json(paginate(screens, { page, limit }))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/modules/:moduleId/screens', viewAuth, async (req, res) => {
  try {
    const { page, limit } = parsePagination(req.query)
    const screens = await getScreensByModule(req, req.params.moduleId)
    if (screens === null) return res.status(404).json({ error: 'Module not found' })
    res.json(paginate(screens, { page, limit }))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/screens/:screenId', viewAuth, async (req, res) => {
  try {
    const detail = await getScreenDetail(req, req.params.screenId)
    if (!detail) return res.status(404).json({ error: 'Screen not found' })
    res.json(detail)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/screens/:screenId/steps', viewAuth, async (req, res) => {
  try {
    const detail = await getScreenSteps(req, req.params.screenId)
    if (!detail) return res.status(404).json({ error: 'Screen not found' })
    res.json(detail)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/workflows/:workflowId', viewAuth, async (req, res) => {
  try {
    const detail = await getWorkflow(req, req.params.workflowId)
    if (!detail) return res.status(404).json({ error: 'Workflow not found' })
    res.json(detail)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/search', viewAuth, async (req, res) => {
  try {
    const { page, limit } = parsePagination(req.query, { defaultLimit: 20 })
    const result = await globalSearch(req, {
      q: req.query.q || req.query.keyword,
      applicationCode: req.query.applicationCode || req.query.application,
      type: req.query.type || 'all',
      page,
      limit,
    })
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/media/:mediaId/file', async (req, res) => {
  try {
    const { mediaId } = req.params
    const token = req.query.token
    const apiKey = req.headers['x-api-key']
    const authHeader = req.headers.authorization || ''
    const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

    const tokenValid = verifyMediaToken(token, mediaId)
    if (!tokenValid && !apiKey && !bearer) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (!tokenValid && (apiKey || bearer)) {
      const { validateApiKey, validateViewJwt } = await import('../middleware/viewAuth.js')
      let auth = null
      if (apiKey) auth = await validateApiKey(apiKey)
      if (!auth && bearer) auth = validateViewJwt(bearer)
      if (!auth) return res.status(401).json({ error: 'Unauthorized' })
    }

    const row = await getMediaFileForView(mediaId)
    if (!row) return res.status(404).json({ error: 'File not found' })

    const decoded = decodeDataUrl(row.file_data)
    if (!decoded) return res.status(404).json({ error: 'File not found' })

    const mimeType = row.file_type || decoded.mimeType || 'application/octet-stream'
    res.setHeader('Content-Type', mimeType)
    res.setHeader('Cache-Control', 'public, max-age=86400')
    if (row.file_name) {
      res.setHeader('Content-Disposition', `inline; filename="${row.file_name}"`)
    }
    res.send(decoded.buffer)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
