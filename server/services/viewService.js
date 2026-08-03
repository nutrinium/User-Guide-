import { pool, mapApplication, mapModule, mapGuide, mapMedia } from '../db.js'
import { parseSteps } from '../utils/parseSteps.js'
import { signMediaToken } from '../utils/signedToken.js'

export function getPublicBaseUrl(req) {
  return (
    process.env.PUBLIC_API_BASE_URL ||
    `${req.protocol}://${req.get('host')}`
  ).replace(/\/$/, '')
}

export function buildMediaUrl(req, mediaId) {
  const token = signMediaToken(mediaId)
  return `${getPublicBaseUrl(req)}/api/v1/view/media/${mediaId}/file?token=${token}`
}

function toPublicApplication(app, req) {
  return {
    name: app.name,
    code: app.code,
    description: app.description,
    logo: app.logoUrl || null,
    icon: app.icon,
    themeColor: app.color,
    status: app.isActive ? 'active' : 'inactive',
  }
}

function toPublicModule(mod) {
  return {
    id: mod.id,
    name: mod.name,
    description: mod.description,
    icon: mod.icon,
    themeColor: mod.color,
    status: mod.isActive ? 'active' : 'inactive',
  }
}

function toPublicScreen(guide) {
  return {
    id: guide.id,
    moduleId: guide.moduleId || null,
    title: guide.title,
    description: guide.description,
    order: guide.order,
    workflowId: guide.id,
  }
}

function enrichMediaItem(media, req) {
  const base = {
    id: media.id,
    type: media.type,
    name: media.name,
    description: media.description || '',
  }
  if (media.type === 'content') {
    return { ...base, contentText: media.contentText || '' }
  }
  if (['photo', 'video', 'document'].includes(media.type) && media.fileName) {
    return {
      ...base,
      url: buildMediaUrl(req, media.id),
      fileName: media.fileName,
      mimeType: media.fileType || '',
      fileSize: media.fileSize || 0,
    }
  }
  return base
}

function buildStep(section, guideId, mediaBySection, req) {
  const sectionMedia = mediaBySection[`${guideId}:${section.id}`] || []
  const contentItems = sectionMedia.filter((m) => m.type === 'content')
  const steps = parseSteps(section, contentItems)
  const video = sectionMedia.find((m) => m.type === 'video')
  const photo = sectionMedia.find((m) => m.type === 'photo')
  const image = photo || null

  return {
    stepNumber: (section.order ?? 0) + 1,
    id: section.id,
    title: section.title || '',
    description: section.content || '',
    notes: section.content || '',
    steps,
    image: image ? enrichMediaItem(image, req) : null,
    video: video ? enrichMediaItem(video, req) : null,
    attachments: sectionMedia
      .filter((m) => m.type === 'document')
      .map((m) => enrichMediaItem(m, req)),
    contentItems: contentItems.map((m) => enrichMediaItem(m, req)),
  }
}

async function loadPublishedGuideIds() {
  const [rows] = await pool.query(`SELECT id FROM guides WHERE status = 'published'`)
  return new Set(rows.map((r) => r.id))
}

async function loadPublishedMedia(publishedGuideIds) {
  if (publishedGuideIds.size === 0) return []
  const ids = [...publishedGuideIds]
  const placeholders = ids.map(() => '?').join(',')
  const [rows] = await pool.query(
    `SELECT id, application_id, module_id, guide_id, section_id, guide_title, section_title,
            type, name, description, file_name, file_type, file_size, content_text,
            created_at, updated_at
     FROM media WHERE guide_id IN (${placeholders})`,
    ids
  )
  return rows.map((r) => mapMedia(r, false))
}

function groupMediaBySection(mediaList) {
  const map = {}
  for (const m of mediaList) {
    const key = `${m.guideId}:${m.sectionId}`
    if (!map[key]) map[key] = []
    map[key].push(m)
  }
  return map
}

export async function fetchActiveApplications() {
  const [rows] = await pool.query(
    `SELECT * FROM applications WHERE is_active = 1 ORDER BY name`
  )
  return rows.map(mapApplication)
}

export async function fetchApplicationByCode(code) {
  const [rows] = await pool.query(
    `SELECT * FROM applications WHERE UPPER(code) = ? AND is_active = 1 LIMIT 1`,
    [String(code).toUpperCase()]
  )
  return rows[0] ? mapApplication(rows[0]) : null
}

export async function fetchActiveModules(applicationId) {
  const [rows] = await pool.query(
    `SELECT * FROM modules WHERE application_id = ? AND is_active = 1 ORDER BY name`,
    [applicationId]
  )
  return rows.map(mapModule)
}

export async function fetchPublishedGuides({ applicationId, moduleId } = {}) {
  let sql = `SELECT * FROM guides WHERE status = 'published'`
  const params = []
  if (applicationId) {
    sql += ` AND application_id = ?`
    params.push(applicationId)
  }
  if (moduleId !== undefined) {
    sql += ` AND module_id = ?`
    params.push(moduleId)
  }
  sql += ` ORDER BY sort_order, created_at`
  const [rows] = await pool.query(sql, params)
  return rows.map(mapGuide)
}

export async function fetchPublishedGuideById(guideId) {
  const [rows] = await pool.query(
    `SELECT * FROM guides WHERE id = ? AND status = 'published' LIMIT 1`,
    [guideId]
  )
  return rows[0] ? mapGuide(rows[0]) : null
}

export async function fetchModuleById(moduleId) {
  const [rows] = await pool.query(
    `SELECT * FROM modules WHERE id = ? AND is_active = 1 LIMIT 1`,
    [moduleId]
  )
  return rows[0] ? mapModule(rows[0]) : null
}

export async function getApplicationsList(req) {
  const apps = await fetchActiveApplications()
  const allGuides = await fetchPublishedGuides({})

  const [modRows] = await pool.query(
    `SELECT application_id, COUNT(*) AS cnt FROM modules WHERE is_active = 1 GROUP BY application_id`
  )
  const modCounts = {}
  for (const row of modRows) {
    modCounts[row.application_id] = row.cnt
  }

  return apps.map((app) => ({
    ...toPublicApplication(app, req),
    moduleCount: modCounts[app.id] || 0,
    screenCount: allGuides.filter((g) => g.applicationId === app.id).length,
  }))
}

export async function getApplicationDetail(req, applicationCode) {
  const app = await fetchApplicationByCode(applicationCode)
  if (!app) return null

  const modules = await fetchActiveModules(app.id)
  const guides = await fetchPublishedGuides({ applicationId: app.id })
  const directScreens = guides.filter((g) => !g.moduleId)

    return {
      application: toPublicApplication(app, req),
      modules: modules.map((mod) => ({
        ...toPublicModule(mod),
        screenCount: guides.filter((g) => g.moduleId === mod.id).length,
      })),
    overview: {
      moduleCount: modules.length,
      screenCount: guides.length,
      directScreenCount: directScreens.length,
      publishedGuideCount: guides.length,
    },
  }
}

export async function getModulesByApplicationCode(applicationCode) {
  const app = await fetchApplicationByCode(applicationCode)
  if (!app) return null
  const modules = await fetchActiveModules(app.id)
  const guides = await fetchPublishedGuides({ applicationId: app.id })

  return modules.map((mod) => ({
    ...toPublicModule(mod),
    screenCount: guides.filter((g) => g.moduleId === mod.id).length,
  }))
}

export async function getScreensByModule(req, moduleId) {
  const mod = await fetchModuleById(moduleId)
  if (!mod) return null
  const guides = await fetchPublishedGuides({ applicationId: mod.applicationId, moduleId })
  return guides.map(toPublicScreen)
}

export async function getScreenDetail(req, screenId) {
  const guide = await fetchPublishedGuideById(screenId)
  if (!guide) return null

  const app = (await pool.query(`SELECT * FROM applications WHERE id = ? AND is_active = 1`, [guide.applicationId]))[0][0]
  if (!app) return null

  let mod = null
  if (guide.moduleId) {
    mod = await fetchModuleById(guide.moduleId)
    if (!mod) return null
  }

  const publishedIds = new Set([guide.id])
  const mediaList = await loadPublishedMedia(publishedIds)
  const mediaBySection = groupMediaBySection(mediaList)

  const sections = [...guide.sections].sort((a, b) => a.order - b.order)
  const steps = sections.map((sec) => buildStep(sec, guide.id, mediaBySection, req))

  const allMedia = mediaList.map((m) => enrichMediaItem(m, req))
  const images = allMedia.filter((m) => m.type === 'photo')
  const videos = allMedia.filter((m) => m.type === 'video')
  const attachments = allMedia.filter((m) => m.type === 'document')

  return {
    screen: {
      id: guide.id,
      title: guide.title,
      description: guide.description,
      moduleId: guide.moduleId || null,
      applicationCode: mapApplication(app).code,
      workflowId: guide.id,
    },
    workflow: {
      id: guide.id,
      title: guide.title,
      stepCount: sections.length,
    },
    images,
    videos,
    attachments,
    steps,
  }
}

export async function getScreenSteps(req, screenId) {
  const guide = await fetchPublishedGuideById(screenId)
  if (!guide) return null

  const publishedIds = new Set([guide.id])
  const mediaList = await loadPublishedMedia(publishedIds)
  const mediaBySection = groupMediaBySection(mediaList)
  const sections = [...guide.sections].sort((a, b) => a.order - b.order)

  return {
    screenId: guide.id,
    title: guide.title,
    steps: sections.map((sec) => buildStep(sec, guide.id, mediaBySection, req)),
  }
}

export async function getWorkflow(req, workflowId) {
  const guide = await fetchPublishedGuideById(workflowId)
  if (!guide) return null

  const publishedIds = new Set([guide.id])
  const mediaList = await loadPublishedMedia(publishedIds)
  const mediaBySection = groupMediaBySection(mediaList)
  const sections = [...guide.sections].sort((a, b) => a.order - b.order)

  return {
    workflow: {
      id: guide.id,
      title: guide.title,
      description: guide.description,
    },
    steps: sections.map((sec, i) => {
      const step = buildStep(sec, guide.id, mediaBySection, req)
      return {
        stepNumber: i + 1,
        id: sec.id,
        title: sec.title || `Step ${i + 1}`,
        description: sec.content || '',
        image: step.image,
        video: step.video,
        notes: sec.content || '',
        subSteps: step.steps,
        attachments: step.attachments,
      }
    }),
    images: mediaList
      .filter((m) => m.type === 'photo')
      .map((m) => enrichMediaItem(m, req)),
  }
}

export async function globalSearch(req, { q, applicationCode, type, page, limit }) {
  const keyword = (q || '').trim().toLowerCase()
  if (!keyword) {
    return { data: [], pagination: { page, limit, total: 0, totalPages: 1, hasNext: false, hasPrev: false } }
  }

  let appFilter = null
  if (applicationCode) {
    appFilter = await fetchApplicationByCode(applicationCode)
    if (!appFilter) {
      return { data: [], pagination: { page, limit, total: 0, totalPages: 1, hasNext: false, hasPrev: false } }
    }
  }

  const apps = appFilter ? [appFilter] : await fetchActiveApplications()
  const appIds = apps.map((a) => a.id)
  if (appIds.length === 0) {
    return { data: [], pagination: { page, limit, total: 0, totalPages: 1, hasNext: false, hasPrev: false } }
  }

  const placeholders = appIds.map(() => '?').join(',')
  const [modRows] = await pool.query(
    `SELECT * FROM modules WHERE application_id IN (${placeholders}) AND is_active = 1`,
    appIds
  )
  const modules = modRows.map(mapModule)

  const guides = await fetchPublishedGuides({})
  const filteredGuides = guides.filter((g) => appIds.includes(g.applicationId))

  const publishedIds = new Set(filteredGuides.map((g) => g.id))
  const mediaList = await loadPublishedMedia(publishedIds)

  const results = []

  if (!type || type === 'application' || type === 'all') {
    for (const app of apps) {
      if (
        app.name.toLowerCase().includes(keyword) ||
        app.code.toLowerCase().includes(keyword) ||
        app.description.toLowerCase().includes(keyword)
      ) {
        results.push({
          type: 'application',
          code: app.code,
          name: app.name,
          description: app.description,
          themeColor: app.color,
        })
      }
    }
  }

  if (!type || type === 'module' || type === 'all') {
    for (const mod of modules) {
      if (
        mod.name.toLowerCase().includes(keyword) ||
        mod.description.toLowerCase().includes(keyword)
      ) {
        const app = apps.find((a) => a.id === mod.applicationId)
        results.push({
          type: 'module',
          id: mod.id,
          name: mod.name,
          description: mod.description,
          applicationCode: app?.code,
        })
      }
    }
  }

  if (!type || type === 'screen' || type === 'all') {
    for (const guide of filteredGuides) {
      if (
        guide.title.toLowerCase().includes(keyword) ||
        guide.description.toLowerCase().includes(keyword)
      ) {
        const app = apps.find((a) => a.id === guide.applicationId)
        results.push({
          type: 'screen',
          id: guide.id,
          title: guide.title,
          description: guide.description,
          applicationCode: app?.code,
          moduleId: guide.moduleId || null,
          workflowId: guide.id,
        })
      }
    }
  }

  if (!type || type === 'step' || type === 'all') {
    for (const guide of filteredGuides) {
      const mediaBySection = groupMediaBySection(
        mediaList.filter((m) => m.guideId === guide.id)
      )
      for (const section of guide.sections || []) {
        const contentItems = (mediaBySection[`${guide.id}:${section.id}`] || []).filter(
          (m) => m.type === 'content'
        )
        const steps = parseSteps(section, contentItems)
        const app = apps.find((a) => a.id === guide.applicationId)

        if (
          section.title?.toLowerCase().includes(keyword) ||
          section.content?.toLowerCase().includes(keyword)
        ) {
          results.push({
            type: 'step',
            screenId: guide.id,
            stepId: section.id,
            title: section.title,
            applicationCode: app?.code,
            screenTitle: guide.title,
          })
        }

        steps.forEach((stepText, i) => {
          if (stepText.toLowerCase().includes(keyword)) {
            results.push({
              type: 'step',
              screenId: guide.id,
              stepId: section.id,
              stepNumber: i + 1,
              title: stepText,
              applicationCode: app?.code,
              screenTitle: guide.title,
            })
          }
        })
      }
    }
  }

  const total = results.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const data = results.slice((page - 1) * limit, page * limit)

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  }
}

export async function getMediaFileForView(mediaId) {
  const [rows] = await pool.query(
    `SELECT m.file_data, m.file_type, m.file_name, m.type, m.guide_id, g.status AS guide_status
     FROM media m
     LEFT JOIN guides g ON g.id = m.guide_id
     WHERE m.id = ? LIMIT 1`,
    [mediaId]
  )
  const row = rows[0]
  if (!row?.file_data) return null
  if (row.guide_id && row.guide_status !== 'published') return null
  return row
}

export async function isMediaPublished(mediaId) {
  const [rows] = await pool.query(
    `SELECT g.status FROM media m
     LEFT JOIN guides g ON g.id = m.guide_id
     WHERE m.id = ? LIMIT 1`,
    [mediaId]
  )
  if (!rows[0]) return false
  if (!rows[0].status) return true
  return rows[0].status === 'published'
}
