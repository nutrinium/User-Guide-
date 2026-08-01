import { Link, useNavigate, useParams } from 'react-router-dom'
import { useEffect } from 'react'
import { ArrowLeft, ArrowRight, BookOpen } from 'lucide-react'
import { useGuideContext } from '../../context/GuideContext'
import { DynamicIcon } from '../../utils/icons'
import { getAppEntryPath } from '../../utils/viewerNavigation'

function ViewerApp() {
  const { appId, moduleId } = useParams()
  const navigate = useNavigate()
  const {
    getApplicationById,
    getModulesByApplication,
    getPublishedGuidesByModule,
    getPublishedDirectGuidesByApplication,
  } = useGuideContext()

  const app = getApplicationById(appId)
  const appModules = (getModulesByApplication(appId) || []).filter((m) => m.isActive)
  const directGuides = getPublishedDirectGuidesByApplication(appId)

  useEffect(() => {
    if (!appId || moduleId) return
    const currentApp = getApplicationById(appId)
    if (!currentApp?.isActive) return
    const entry = getAppEntryPath(appId, {
      getModulesByApplication,
      getPublishedGuidesByModule,
      getPublishedDirectGuidesByApplication,
    })
    if (entry.includes('/guide/')) {
      navigate(entry, { replace: true })
    }
  }, [
    appId,
    moduleId,
    getApplicationById,
    getModulesByApplication,
    getPublishedGuidesByModule,
    getPublishedDirectGuidesByApplication,
    navigate,
  ])

  if (!app || !app.isActive) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Application not found</h2>
        <Link to="/viewer" className="mt-4 inline-block text-blue-600 hover:underline">
          Back to home
        </Link>
      </div>
    )
  }

  if (moduleId) {
    const mod = appModules.find((m) => m.id === moduleId)
    const guides = getPublishedGuidesByModule(moduleId)

    if (!mod) {
      return (
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Module not found</h2>
          <Link to={`/viewer/app/${appId}`} className="mt-4 inline-block text-blue-600 hover:underline">
            Back to application
          </Link>
        </div>
      )
    }

    if (guides.length === 1) {
      navigate(`/viewer/app/${appId}/module/${moduleId}/guide/${guides[0].id}`, { replace: true })
      return null
    }

    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <Link
          to={`/viewer/app/${appId}`}
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 dark:text-white"
        >
          <ArrowLeft size={16} />
          {app.name}
        </Link>

        <div className="mb-8 flex items-center gap-4">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${mod.color}18` }}
          >
            <DynamicIcon name={mod.icon} size={24} style={{ color: mod.color }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{mod.name}</h1>
            <p className="text-sm text-slate-500 dark:text-white">
              Select a guide to view step-by-step instructions
            </p>
          </div>
        </div>

        {guides.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center dark:border-slate-700 dark:bg-slate-900">
            <BookOpen size={40} className="mx-auto text-slate-300" />
            <p className="mt-4 text-slate-500 dark:text-white">No published guides in this module yet.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {guides.map((guide) => (
              <Link
                key={guide.id}
                to={`/viewer/app/${appId}/module/${moduleId}/guide/${guide.id}`}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-blue-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
              >
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{guide.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-slate-500 dark:text-white">
                  {guide.description || `${guide.sections.length} sections`}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-600">
                  View guide
                  <ArrowRight size={14} />
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    )
  }

  const modulesToShow = appModules

  if (appModules.length === 0 && directGuides.length === 1) {
    navigate(`/viewer/app/${appId}/guide/${directGuides[0].id}`, { replace: true })
    return null
  }

  if (appModules.length === 0 && directGuides.length > 1) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <Link
          to="/viewer"
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 dark:text-white"
        >
          <ArrowLeft size={16} />
          All applications
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{app.name}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-white">Select a guide</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {directGuides.map((guide) => (
            <Link
              key={guide.id}
              to={`/viewer/app/${appId}/guide/${guide.id}`}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-blue-300 dark:border-slate-700 dark:bg-slate-900"
            >
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{guide.title}</h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-white">
                {guide.description || `${guide.sections.length} sections`}
              </p>
            </Link>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link
        to="/viewer"
        className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 dark:text-white"
      >
        <ArrowLeft size={16} />
        All applications
      </Link>

      <div className="mb-8 flex items-center gap-4">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${app.color}18` }}
        >
          <DynamicIcon name={app.icon} size={28} style={{ color: app.color }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{app.name}</h1>
          <p className="text-sm text-slate-500 dark:text-white">
            {modulesToShow.length} module{modulesToShow.length !== 1 ? 's' : ''} available
          </p>
        </div>
      </div>

      {modulesToShow.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {modulesToShow.map((mod) => {
            const guideCount = getPublishedGuidesByModule(mod.id).length
            return (
              <Link
                key={mod.id}
                to={`/viewer/app/${appId}/module/${mod.id}`}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-blue-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
              >
                <div
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${mod.color}18` }}
                >
                  <DynamicIcon name={mod.icon} size={24} style={{ color: mod.color }} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{mod.name}</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-white">
                  {guideCount} guide{guideCount !== 1 ? 's' : ''}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-600">
                  Open
                  <ArrowRight size={14} />
                </span>
              </Link>
            )
          })}
        </div>
      )}

      {directGuides.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Application Guides</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {directGuides.map((guide) => (
              <Link
                key={guide.id}
                to={`/viewer/app/${appId}/guide/${guide.id}`}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-blue-300 dark:border-slate-700 dark:bg-slate-900"
              >
                <h3 className="font-bold text-slate-900 dark:text-white">{guide.title}</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-white">
                  {guide.sections.length} sections
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {modulesToShow.length === 0 && directGuides.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center dark:border-slate-700 dark:bg-slate-900">
          <BookOpen size={40} className="mx-auto text-slate-300" />
          <p className="mt-4 text-slate-500 dark:text-white">No published guides for this application yet.</p>
        </div>
      )}
    </div>
  )
}

export default ViewerApp
