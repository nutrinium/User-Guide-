import { createContext, useContext, useEffect, useState } from 'react'
import { generateId, loadAndMigrateData, saveData } from '../utils/storage'
import { saveMediaFile, deleteMediaFile, deleteMediaFiles } from '../utils/mediaDb'

const GuideContext = createContext(null)

export function GuideProvider({ children }) {
  const [data, setData] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    loadAndMigrateData()
      .then(setData)
      .finally(() => setReady(true))
  }, [])

  useEffect(() => {
    if (!ready || !data) return
    try {
      saveData(data)
    } catch {
      // save errors handled at upload time
    }
  }, [data, ready])

  const addApplication = (application) => {
    const now = new Date().toISOString()
    const newApp = {
      id: generateId(),
      name: application.name,
      description: application.description || '',
      icon: application.icon || 'LayoutGrid',
      color: application.color || '#2563eb',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    }
    setData((prev) => ({ ...prev, applications: [...prev.applications, newApp] }))
    return newApp
  }

  const updateApplication = (id, updates) => {
    setData((prev) => ({
      ...prev,
      applications: prev.applications.map((a) =>
        a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a
      ),
    }))
  }

  const deleteApplication = async (id) => {
    const moduleIds = data.modules.filter((m) => m.applicationId === id).map((m) => m.id)
    const directGuideIds = data.guides
      .filter((g) => g.applicationId === id && !g.moduleId)
      .map((g) => g.id)
    const guideIdsToRemove = [
      ...data.guides.filter((g) => moduleIds.includes(g.moduleId)).map((g) => g.id),
      ...directGuideIds,
    ]
    const mediaIds = data.media
      .filter(
        (m) =>
          moduleIds.includes(m.moduleId) ||
          (m.applicationId === id && !m.moduleId) ||
          guideIdsToRemove.includes(m.guideId)
      )
      .map((m) => m.id)
    await deleteMediaFiles(mediaIds)
    setData((prev) => ({
      applications: prev.applications.filter((a) => a.id !== id),
      modules: prev.modules.filter((m) => m.applicationId !== id),
      guides: prev.guides.filter(
        (g) => !moduleIds.includes(g.moduleId) && !(g.applicationId === id && !g.moduleId)
      ),
      media: prev.media.filter((m) => !mediaIds.includes(m.id)),
    }))
  }

  const addModule = (module) => {
    const now = new Date().toISOString()
    const newModule = {
      id: generateId(),
      applicationId: module.applicationId || '',
      name: module.name,
      description: module.description || '',
      icon: module.icon || 'FileText',
      color: module.color || '#2563eb',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    }
    setData((prev) => ({ ...prev, modules: [...prev.modules, newModule] }))
    return newModule
  }

  const updateModule = (id, updates) => {
    setData((prev) => ({
      ...prev,
      modules: prev.modules.map((m) =>
        m.id === id ? { ...m, ...updates, updatedAt: new Date().toISOString() } : m
      ),
    }))
  }

  const deleteModule = async (id) => {
    const mediaIds = data.media.filter((m) => m.moduleId === id).map((m) => m.id)
    await deleteMediaFiles(mediaIds)
    setData((prev) => ({
      ...prev,
      modules: prev.modules.filter((m) => m.id !== id),
      guides: prev.guides.filter((g) => g.moduleId !== id),
      media: prev.media.filter((m) => m.moduleId !== id),
    }))
  }

  const addGuide = (guide) => {
    const now = new Date().toISOString()
    const moduleId = guide.moduleId || ''
    const applicationId =
      guide.applicationId ||
      (moduleId ? data.modules.find((m) => m.id === moduleId)?.applicationId : '') ||
      ''
    const siblingGuides = moduleId
      ? data.guides.filter((g) => g.moduleId === moduleId)
      : data.guides.filter((g) => g.applicationId === applicationId && !g.moduleId)
    const newGuide = {
      id: generateId(),
      applicationId,
      moduleId,
      title: guide.title,
      description: guide.description || '',
      sections: guide.sections || [],
      status: guide.status || 'draft',
      order: siblingGuides.length,
      createdAt: now,
      updatedAt: now,
      publishedAt: guide.status === 'published' ? now : null,
    }
    setData((prev) => ({ ...prev, guides: [...prev.guides, newGuide] }))
    return newGuide
  }

  const updateGuide = (id, updates) => {
    setData((prev) => ({
      ...prev,
      guides: prev.guides.map((g) => {
        if (g.id !== id) return g
        const updated = { ...g, ...updates, updatedAt: new Date().toISOString() }
        if (updates.status === 'published' && g.status !== 'published') {
          updated.publishedAt = new Date().toISOString()
        }
        if (updates.status === 'draft') {
          updated.publishedAt = null
        }
        return updated
      }),
    }))
  }

  const deleteGuide = async (id) => {
    const mediaIds = data.media.filter((m) => m.guideId === id).map((m) => m.id)
    await deleteMediaFiles(mediaIds)
    setData((prev) => ({
      ...prev,
      guides: prev.guides.filter((g) => g.id !== id),
      media: prev.media.filter((m) => m.guideId !== id),
    }))
  }

  const addMedia = async (item) => {
    const now = new Date().toISOString()
    const id = generateId()
    const fileData = item.fileData || ''

    if (fileData) {
      await saveMediaFile(id, fileData)
    }

    const newItem = {
      id,
      applicationId: item.applicationId || '',
      moduleId: item.moduleId || '',
      guideId: item.guideId || '',
      sectionId: item.sectionId || '',
      guideTitle: item.guideTitle || '',
      sectionTitle: item.sectionTitle || '',
      type: item.type,
      name: item.name,
      description: item.description || '',
      fileName: item.fileName || '',
      fileType: item.fileType || '',
      fileSize: item.fileSize || 0,
      contentText: item.contentText || '',
      createdAt: now,
      updatedAt: now,
    }

    setData((prev) => ({ ...prev, media: [...prev.media, newItem] }))
    return newItem
  }

  const updateMedia = async (id, updates) => {
    if (updates.fileData) {
      await saveMediaFile(id, updates.fileData)
    }

    setData((prev) => ({
      ...prev,
      media: prev.media.map((m) => {
        if (m.id !== id) return m
        const { fileData, ...rest } = updates
        return { ...m, ...rest, updatedAt: new Date().toISOString() }
      }),
    }))
  }

  const deleteMedia = async (id) => {
    await deleteMediaFile(id)
    setData((prev) => ({
      ...prev,
      media: prev.media.filter((m) => m.id !== id),
    }))
  }

  const getApplicationById = (id) => data?.applications.find((a) => a.id === id)
  const getModulesByApplication = (applicationId) =>
    data?.modules.filter((m) => m.applicationId === applicationId) || []
  const getModuleById = (id) => data?.modules.find((m) => m.id === id)
  const getGuidesByModule = (moduleId) =>
    (data?.guides.filter((g) => g.moduleId === moduleId) || []).sort((a, b) => a.order - b.order)

  const getDirectGuidesByApplication = (applicationId) =>
    (data?.guides.filter((g) => g.applicationId === applicationId && !g.moduleId) || []).sort(
      (a, b) => a.order - b.order
    )

  const getGuideApplication = (guide) => {
    if (!guide) return null
    if (guide.moduleId) {
      const mod = getModuleById(guide.moduleId)
      return mod ? getApplicationById(mod.applicationId) : null
    }
    return guide.applicationId ? getApplicationById(guide.applicationId) : null
  }

  const getGuideById = (id) => data?.guides.find((g) => g.id === id)
  const getMediaByModule = (moduleId, type) =>
    data?.media.filter((m) => m.moduleId === moduleId && m.type === type) || []

  const getMediaByApplicationDirect = (applicationId, type) =>
    data?.media.filter(
      (m) => m.applicationId === applicationId && !m.moduleId && m.type === type
    ) || []

  const getMediaByGuideSection = (guideId, sectionId) =>
    data?.media.filter((m) => m.guideId === guideId && m.sectionId === sectionId) || []

  const getPublishedGuidesByModule = (moduleId) =>
    getGuidesByModule(moduleId).filter((g) => g.status === 'published')

  const getPublishedDirectGuidesByApplication = (applicationId) =>
    getDirectGuidesByApplication(applicationId).filter((g) => g.status === 'published')

  const stats = {
    totalApplications: data?.applications.length || 0,
    activeApplications: data?.applications.filter((a) => a.isActive).length || 0,
    totalModules: data?.modules.length || 0,
    activeModules: data?.modules.filter((m) => m.isActive).length || 0,
    totalGuides: data?.guides.length || 0,
    publishedGuides: data?.guides.filter((g) => g.status === 'published').length || 0,
    draftGuides: data?.guides.filter((g) => g.status === 'draft').length || 0,
    totalMedia: data?.media.length || 0,
    totalVideos: data?.media.filter((m) => m.type === 'video').length || 0,
    totalPhotos: data?.media.filter((m) => m.type === 'photo').length || 0,
    totalDocuments: data?.media.filter((m) => m.type === 'document').length || 0,
  }

  if (!ready || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    )
  }

  return (
    <GuideContext.Provider
      value={{
        applications: data.applications,
        modules: data.modules,
        guides: data.guides,
        media: data.media,
        stats,
        addApplication,
        updateApplication,
        deleteApplication,
        addModule,
        updateModule,
        deleteModule,
        addGuide,
        updateGuide,
        deleteGuide,
        addMedia,
        updateMedia,
        deleteMedia,
        getApplicationById,
        getModulesByApplication,
        getModuleById,
        getGuidesByModule,
        getDirectGuidesByApplication,
        getGuideApplication,
        getGuideById,
        getMediaByModule,
        getMediaByApplicationDirect,
        getMediaByGuideSection,
        getPublishedGuidesByModule,
        getPublishedDirectGuidesByApplication,
      }}
    >
      {children}
    </GuideContext.Provider>
  )
}

export function useGuideContext() {
  const ctx = useContext(GuideContext)
  if (!ctx) throw new Error('useGuideContext must be used within GuideProvider')
  return ctx
}
