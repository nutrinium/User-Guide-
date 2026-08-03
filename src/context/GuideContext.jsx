import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../utils/api'

const GuideContext = createContext(null)

const EMPTY_DATA = {
  applications: [],
  modules: [],
  guides: [],
  media: [],
}

export function GuideProvider({ children }) {
  const [data, setData] = useState(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(null)

  const reload = async () => {
    const payload = await api.bootstrap()
    setData(payload)
    return payload
  }

  useEffect(() => {
    api
      .bootstrap()
      .then((payload) => {
        setData(payload)
        setError(null)
      })
      .catch((err) => {
        setError(err.message)
        setData(EMPTY_DATA)
      })
      .finally(() => setReady(true))
  }, [])

  const addApplication = async (application) => {
    const created = await api.createApplication(application)
    setData((prev) => ({ ...prev, applications: [...prev.applications, created] }))
    return created
  }

  const updateApplication = async (id, updates) => {
    const current = data.applications.find((a) => a.id === id)
    const updated = await api.updateApplication(id, { ...current, ...updates })
    setData((prev) => ({
      ...prev,
      applications: prev.applications.map((a) => (a.id === id ? updated : a)),
    }))
  }

  const deleteApplication = async (id) => {
    await api.deleteApplication(id)
    setData((prev) => ({
      applications: prev.applications.filter((a) => a.id !== id),
      modules: prev.modules.filter((m) => m.applicationId !== id),
      guides: prev.guides.filter((g) => g.applicationId !== id),
      media: prev.media.filter((m) => m.applicationId !== id),
    }))
  }

  const addModule = async (module) => {
    const created = await api.createModule(module)
    setData((prev) => ({ ...prev, modules: [...prev.modules, created] }))
    return created
  }

  const updateModule = async (id, updates) => {
    const current = data.modules.find((m) => m.id === id)
    const updated = await api.updateModule(id, { ...current, ...updates })
    setData((prev) => ({
      ...prev,
      modules: prev.modules.map((m) => (m.id === id ? updated : m)),
    }))
  }

  const deleteModule = async (id) => {
    await api.deleteModule(id)
    setData((prev) => ({
      ...prev,
      modules: prev.modules.filter((m) => m.id !== id),
      guides: prev.guides.filter((g) => g.moduleId !== id),
      media: prev.media.filter((m) => m.moduleId !== id),
    }))
  }

  const addGuide = async (guide) => {
    const moduleId = guide.moduleId || ''
    const applicationId = guide.applicationId || ''
    const siblingGuides = moduleId
      ? data.guides.filter((g) => g.moduleId === moduleId)
      : data.guides.filter((g) => g.applicationId === applicationId && !g.moduleId)
    const created = await api.createGuide({ ...guide, order: siblingGuides.length })
    setData((prev) => ({ ...prev, guides: [...prev.guides, created] }))
    return created
  }

  const updateGuide = async (id, updates) => {
    const current = data.guides.find((g) => g.id === id)
    const updated = await api.updateGuide(id, { ...current, ...updates })
    setData((prev) => ({
      ...prev,
      guides: prev.guides.map((g) => (g.id === id ? updated : g)),
    }))
  }

  const deleteGuide = async (id) => {
    await api.deleteGuide(id)
    setData((prev) => ({
      ...prev,
      guides: prev.guides.filter((g) => g.id !== id),
      media: prev.media.filter((m) => m.guideId !== id),
    }))
  }

  const addMedia = async (item) => {
    const created = await api.createMedia(item)
    setData((prev) => ({ ...prev, media: [...prev.media, created] }))
    return created
  }

  const updateMedia = async (id, updates) => {
    const current = data.media.find((m) => m.id === id)
    const { fileData, ...rest } = updates
    const payload = { ...current, ...rest }
    if (fileData) payload.fileData = fileData
    const updated = await api.updateMedia(id, payload)
    setData((prev) => ({
      ...prev,
      media: prev.media.map((m) => (m.id === id ? updated : m)),
    }))
  }

  const deleteMedia = async (id) => {
    await api.deleteMedia(id)
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
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 dark:bg-slate-950">
        <p className="text-sm text-slate-500 dark:text-slate-400">Connecting to database...</p>
      </div>
    )
  }

  if (error) {
    const isApiDown =
      error.includes('API server') ||
      error.includes('Cannot reach') ||
      error.includes('Bad Gateway') ||
      error.includes('Failed to fetch')

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-4 dark:bg-slate-950">
        <p className="text-center text-sm font-medium text-red-600">
          {isApiDown ? 'Backend API is not running' : 'Database connection failed'}
        </p>
        <p className="mt-2 max-w-md text-center text-xs text-slate-500">{error}</p>
        {isApiDown && (
          <div className="mt-4 max-w-md rounded-xl border border-slate-200 bg-white p-4 text-left text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900">
            <p className="font-semibold text-slate-800 dark:text-white">Fix — run in project root:</p>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-100 p-3 font-mono dark:bg-slate-800">
{`# Terminal 1
npm run dev:server

# Terminal 2
npm run dev

# Or one command (both):
npm run dev:all`}
            </pre>
            <p className="mt-2">First time? Copy <code className="rounded bg-slate-100 px-1">.env.example</code> to{' '}
              <code className="rounded bg-slate-100 px-1">.env</code> and set DB password.
            </p>
          </div>
        )}
        <button
          type="button"
          onClick={() => {
            setReady(false)
            reload()
              .then(() => setError(null))
              .catch((err) => setError(err.message))
              .finally(() => setReady(true))
          }}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          Retry
        </button>
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
        reload,
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
