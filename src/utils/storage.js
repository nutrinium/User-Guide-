import { migrateMediaFilesToDb } from './mediaDb'

const STORAGE_KEY = 'ugms_data'

export const DEFAULT_DATA = {
  applications: [],
  modules: [],
  guides: [],
  media: [],
}

function migrateGuidesAndMedia(data) {
  const guides = (data.guides || []).map((g) => {
    if (g.applicationId) return g
    const mod = data.modules.find((m) => m.id === g.moduleId)
    return { ...g, applicationId: mod?.applicationId || '' }
  })

  const media = (data.media || []).map((m) => {
    if (m.applicationId) return m
    const mod = data.modules.find((mod) => mod.id === m.moduleId)
    const guide = guides.find((g) => g.id === m.guideId)
    return {
      ...m,
      applicationId: mod?.applicationId || guide?.applicationId || '',
    }
  })

  return { ...data, guides, media }
}

function stripMediaFileData(parsed) {
  const base = {
    applications: Array.isArray(parsed.applications) ? parsed.applications : [],
    modules: Array.isArray(parsed.modules) ? parsed.modules : [],
    guides: Array.isArray(parsed.guides) ? parsed.guides : [],
    media: Array.isArray(parsed.media)
      ? parsed.media.map(({ fileData, ...rest }) => rest)
      : [],
  }
  return migrateGuidesAndMedia(base)
}

export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_DATA }

    if (raw.length > 800_000) {
      const parsed = JSON.parse(raw)
      const cleaned = stripMediaFileData(parsed)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned))
      return cleaned
    }

    const parsed = JSON.parse(raw)
    return stripMediaFileData(parsed)
  } catch {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
    return { ...DEFAULT_DATA }
  }
}

export async function loadAndMigrateData() {
  const data = loadData()
  const hasEmbedded = data.media.some((m) => m.fileData)
  if (!hasEmbedded) return data
  const migratedMedia = await migrateMediaFilesToDb(data.media)
  const cleaned = { ...data, media: migratedMedia }
  saveData(cleaned)
  return cleaned
}

export function saveData(data) {
  const toSave = {
    ...data,
    media: data.media.map(({ fileData, ...rest }) => rest),
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
  } catch (err) {
    console.error('Failed to save to localStorage:', err)
    throw new Error('Storage limit reached. Try deleting old files or use smaller uploads.')
  }
}

export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export const MEDIA_TYPES = {
  videos: { label: 'Videos', type: 'video' },
  photos: { label: 'Photos', type: 'photo' },
  documents: { label: 'Linked Documents', type: 'document' },
  content: { label: 'Content', type: 'content' },
}
