import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  Link2,
  Loader2,
} from 'lucide-react'
import { createViewApiClient } from './viewApiClient'

/**
 * Drop-in User Guide tab for external apps (MRR, Store, Asset, etc.).
 *
 * @example
 * <UserGuideTab
 *   apiBaseUrl="https://guides.example.com/api/v1/view"
 *   apiKey={process.env.REACT_APP_UGMS_API_KEY}
 *   applicationCode="MRR"
 *   appTitle="MRR"
 * />
 */
export default function UserGuideTab({
  apiBaseUrl,
  apiKey,
  applicationCode = 'MRR',
  appTitle,
  className = '',
}) {
  const client = useMemo(
    () => createViewApiClient({ baseUrl: apiBaseUrl, apiKey }),
    [apiBaseUrl, apiKey]
  )

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [application, setApplication] = useState(null)
  const [modules, setModules] = useState([])

  const [view, setView] = useState('modules')
  const [activeModule, setActiveModule] = useState(null)
  const [screens, setScreens] = useState([])
  const [activeScreen, setActiveScreen] = useState(null)
  const [screenDetail, setScreenDetail] = useState(null)
  const [activeStep, setActiveStep] = useState(0)
  const [screenLoading, setScreenLoading] = useState(false)

  const displayTitle = appTitle || application?.name || applicationCode

  const loadApplication = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const detail = await client.getApplication(applicationCode)
      setApplication(detail.application)
      setModules(detail.modules || [])
      setView('modules')
      setActiveModule(null)
      setScreens([])
      setActiveScreen(null)
      setScreenDetail(null)
      setActiveStep(0)
    } catch (err) {
      const message =
        err.status === 401
          ? 'Unauthorized — check VITE_UGMS_API_KEY in .env and restart the dev server.'
          : err.message || 'Failed to load user guide'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [client, applicationCode])

  useEffect(() => {
    loadApplication()
  }, [loadApplication])

  const openModule = async (mod) => {
    setActiveModule(mod)
    setScreenLoading(true)
    setError(null)
    try {
      const result = await client.getScreens(mod.id)
      const list = result.data || result
      setScreens(list)
      if (list.length === 1) {
        await openScreen(list[0], mod)
      } else {
        setView('screens')
        setActiveScreen(null)
        setScreenDetail(null)
      }
    } catch (err) {
      setError(err.message || 'Failed to load screens')
    } finally {
      setScreenLoading(false)
    }
  }

  const openScreen = async (screen, mod = activeModule) => {
    if (mod) setActiveModule(mod)
    setActiveScreen(screen)
    setScreenLoading(true)
    setError(null)
    setActiveStep(0)
    try {
      const detail = await client.getScreen(screen.id)
      setScreenDetail(detail)
      setView('guide')
    } catch (err) {
      setError(err.message || 'Failed to load guide')
    } finally {
      setScreenLoading(false)
    }
  }

  const switchModule = async (mod) => {
    setActiveStep(0)
    await openModule(mod)
  }

  const switchScreen = async (screen) => {
    setActiveStep(0)
    await openScreen(screen)
  }

  const goBack = () => {
    if (view === 'guide') {
      if (screens.length > 1) {
        setView('screens')
        setScreenDetail(null)
        setActiveScreen(null)
      } else {
        setView('modules')
        setActiveModule(null)
        setScreens([])
        setScreenDetail(null)
        setActiveScreen(null)
      }
    } else if (view === 'screens') {
      setView('modules')
      setActiveModule(null)
      setScreens([])
    }
    setActiveStep(0)
  }

  if (loading) {
    return (
      <div className={`flex min-h-[320px] items-center justify-center ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error && !screenDetail) {
    return (
      <div className={`mx-auto max-w-lg px-4 py-12 text-center ${className}`}>
        <p className="text-sm font-medium text-red-600">{error}</p>
        <p className="mt-2 text-xs text-slate-500">API: {apiBaseUrl}</p>
        <button
          type="button"
          onClick={loadApplication}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    )
  }

  if (view === 'modules') {
    return (
      <div className={`mx-auto max-w-6xl px-4 py-8 sm:px-6 ${className}`}>
        <header className="mb-8 flex items-center gap-4">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${application?.themeColor || '#2563eb'}18` }}
          >
            <BookOpen size={28} style={{ color: application?.themeColor || '#2563eb' }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{displayTitle} | User Guide</h1>
            <p className="text-sm text-slate-500">
              {modules.length} module{modules.length !== 1 ? 's' : ''} available
            </p>
          </div>
        </header>

        {modules.length === 0 ? (
          <EmptyState message="No published modules for this application yet." />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((mod) => (
              <button
                key={mod.id}
                type="button"
                onClick={() => openModule(mod)}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
              >
                <div
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${mod.themeColor || '#2563eb'}18` }}
                >
                  <FileText size={24} style={{ color: mod.themeColor || '#2563eb' }} />
                </div>
                <h3 className="text-lg font-bold text-slate-900">{mod.name}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {mod.screenCount ?? 0} guide{(mod.screenCount ?? 0) !== 1 ? 's' : ''}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-600">
                  Open
                  <ArrowRight size={14} />
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (view === 'screens') {
    return (
      <div className={`mx-auto max-w-6xl px-4 py-8 sm:px-6 ${className}`}>
        <button
          type="button"
          onClick={goBack}
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600"
        >
          <ArrowLeft size={16} />
          {displayTitle}
        </button>

        <div className="mb-8 flex items-center gap-4">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${activeModule?.themeColor || '#2563eb'}18` }}
          >
            <FileText size={24} style={{ color: activeModule?.themeColor || '#2563eb' }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{activeModule?.name}</h1>
            <p className="text-sm text-slate-500">Select a guide to view step-by-step instructions</p>
          </div>
        </div>

        {screenLoading ? (
          <LoadingBlock />
        ) : screens.length === 0 ? (
          <EmptyState message="No published guides in this module yet." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {screens.map((screen) => (
              <button
                key={screen.id}
                type="button"
                onClick={() => openScreen(screen)}
                className="rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
              >
                <h3 className="text-lg font-bold text-slate-900">{screen.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                  {screen.description || 'View guide'}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-600">
                  View guide
                  <ArrowRight size={14} />
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  const steps = screenDetail?.steps || []
  const currentStep = steps[activeStep]

  return (
    <div className={`mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 ${className}`}>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">{displayTitle} | User Guide</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <button type="button" onClick={goBack} className="inline-flex items-center gap-1 hover:text-blue-600">
              <ArrowLeft size={14} />
              Back
            </button>
            {activeModule && (
              <>
                <span>/</span>
                <span>{activeModule.name}</span>
              </>
            )}
            <span>/</span>
            <span className="font-medium text-slate-800">{screenDetail?.screen?.title}</span>
          </div>
        </div>
      </div>

      {modules.length > 0 && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {modules.map((mod) => {
            const isActive = activeModule?.id === mod.id
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => switchModule(mod)}
                className={`flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
                }`}
              >
                {mod.name}
              </button>
            )
          })}
        </div>
      )}

      {screens.length > 1 && (
        <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
          {screens.map((screen) => (
            <button
              key={screen.id}
              type="button"
              onClick={() => switchScreen(screen)}
              className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
                screen.id === activeScreen?.id
                  ? 'bg-blue-600 text-white ring-2 ring-blue-200'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
              }`}
            >
              {screen.title}
            </button>
          ))}
        </div>
      )}

      {screenLoading ? (
        <LoadingBlock />
      ) : steps.length === 0 ? (
        <EmptyState message="This guide has no sections yet." />
      ) : (
        <>
          <div className="mb-8 overflow-x-auto pb-2">
            <div className="flex min-w-max items-center gap-0">
              {steps.map((step, i) => {
                const isDone = i < activeStep
                const isActive = i === activeStep
                return (
                  <div key={step.id} className="flex items-center">
                    <button
                      type="button"
                      onClick={() => setActiveStep(i)}
                      className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white ring-2 ring-blue-200'
                          : isDone
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-white text-slate-500 ring-1 ring-slate-200'
                      }`}
                    >
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                          isActive
                            ? 'bg-white text-blue-600'
                            : isDone
                              ? 'bg-emerald-500 text-white'
                              : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {isDone ? <Check size={14} /> : i + 1}
                      </span>
                      <span className="max-w-[120px] truncate sm:max-w-none">
                        {step.title?.trim() || `Section ${i + 1}`}
                      </span>
                    </button>
                    {i < steps.length - 1 && <div className="mx-1 h-px w-6 bg-slate-200" />}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <SectionMediaPanel step={currentStep} stepIndex={activeStep} />

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                Step {activeStep + 1} of {steps.length}
              </p>
              <h2 className="mt-2 font-serif text-2xl font-bold text-slate-900">
                {currentStep?.title?.trim() || `Section ${activeStep + 1}`}
              </h2>

              {currentStep?.steps?.length > 0 ? (
                <ol className="mt-6 space-y-4">
                  {currentStep.steps.map((line, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-700">
                        {i + 1}
                      </span>
                      <p className="pt-0.5 text-sm leading-relaxed text-slate-700">{line}</p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-6 text-sm text-slate-500">
                  {currentStep?.description || 'No written content for this section yet.'}
                </p>
              )}

              <div className="mt-8 flex gap-3 border-t border-slate-100 pt-6">
                <button
                  type="button"
                  disabled={activeStep === 0}
                  onClick={() => setActiveStep((s) => s - 1)}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>
                <button
                  type="button"
                  disabled={activeStep >= steps.length - 1}
                  onClick={() => setActiveStep((s) => s + 1)}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40"
                >
                  Next step
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function SectionMediaPanel({ step, stepIndex }) {
  const video = step?.video
  const image = step?.image
  const primary = video || image

  return (
    <div className="overflow-hidden rounded-2xl bg-slate-900 shadow-xl">
      <div className="flex items-center gap-2 border-b border-slate-700 px-4 py-3">
        <div className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-red-500" />
          <span className="h-3 w-3 rounded-full bg-amber-400" />
          <span className="h-3 w-3 rounded-full bg-emerald-500" />
        </div>
        <span className="ml-2 text-sm text-slate-400">Step {stepIndex + 1}</span>
      </div>

      <div className="flex min-h-[280px] items-center justify-center p-4 sm:min-h-[360px]">
        {video?.url ? (
          <video
            src={video.url}
            className="max-h-[400px] w-full rounded-lg object-contain"
            controls
            autoPlay
            muted
            playsInline
          />
        ) : image?.url ? (
          <img
            src={image.url}
            alt={image.name || step?.title}
            className="max-h-[400px] w-full rounded-lg object-contain"
          />
        ) : (
          <div className="text-center">
            <FileText size={48} className="mx-auto text-slate-600" />
            <p className="mt-3 text-sm text-slate-400">No video or photo for this section</p>
            <p className="mt-1 text-xs text-slate-500">{step?.title}</p>
          </div>
        )}
      </div>

      {step?.attachments?.length > 0 && (
        <div className="border-t border-slate-700 px-4 py-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
            Linked Documents
          </p>
          <div className="flex flex-wrap gap-2">
            {step.attachments.map((doc) => (
              <a
                key={doc.id}
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-2 py-1 text-xs text-slate-300 transition-colors hover:bg-slate-700"
              >
                <Link2 size={12} />
                {doc.name}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function EmptyState({ message }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
      <BookOpen size={40} className="mx-auto text-slate-300" />
      <p className="mt-4 text-slate-500">{message}</p>
    </div>
  )
}

function LoadingBlock() {
  return (
    <div className="flex min-h-[240px] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  )
}
