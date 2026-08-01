import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Check,
  Copy,
  Link2,
  FileText,
} from 'lucide-react'
import { useGuideContext } from '../../context/GuideContext'
import { useMediaSource } from '../../hooks/useMediaSource'
import { openFileInNewTab } from '../../utils/fileUpload'
import { DynamicIcon } from '../../utils/icons'

function SectionMediaViewer({ sectionMedia, sectionTitle, stepIndex }) {
  const video = sectionMedia.find((m) => m.type === 'video')
  const photo = sectionMedia.find((m) => m.type === 'photo')
  const primary = video || photo
  const { src, loading } = useMediaSource(primary)

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
        {loading ? (
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : video && src ? (
          <video
            src={src}
            className="max-h-[400px] w-full rounded-lg object-contain"
            controls
            autoPlay
            muted
            playsInline
          />
        ) : photo && src ? (
          <img
            src={src}
            alt={photo.name}
            className="max-h-[400px] w-full rounded-lg object-contain"
          />
        ) : (
          <div className="text-center">
            <FileText size={48} className="mx-auto text-slate-600" />
            <p className="mt-3 text-sm text-slate-400">No video or photo for this section</p>
            <p className="mt-1 text-xs text-slate-500">{sectionTitle}</p>
          </div>
        )}
      </div>

      {sectionMedia.filter((m) => m.type === 'document').length > 0 && (
        <div className="border-t border-slate-700 px-4 py-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
            Linked Documents
          </p>
          <div className="flex flex-wrap gap-2">
            {sectionMedia
              .filter((m) => m.type === 'document')
              .map((doc) => (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => openFileInNewTab(doc)}
                  className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-2 py-1 text-xs text-slate-300 transition-colors hover:bg-slate-700"
                >
                  <Link2 size={12} />
                  {doc.name}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

function parseSteps(section, contentItems) {
  const steps = []

  contentItems.forEach((item) => {
    if (item.contentText?.trim()) {
      item.contentText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .forEach((line) => steps.push(line.replace(/^\d+[\).\s]+/, '')))
    }
  })

  if (section?.content?.trim()) {
    section.content
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .forEach((line) => {
        const cleaned = line.replace(/^\d+[\).\s]+/, '')
        if (!steps.includes(cleaned)) steps.push(cleaned)
      })
  }

  if (steps.length === 0 && section?.content?.trim()) {
    steps.push(section.content.trim())
  }

  return steps
}

function ViewerGuide() {
  const { appId, moduleId, guideId } = useParams()
  const navigate = useNavigate()
  const {
    getApplicationById,
    getModuleById,
    getGuideById,
    getModulesByApplication,
    getPublishedGuidesByModule,
    getPublishedDirectGuidesByApplication,
    getMediaByGuideSection,
  } = useGuideContext()

  const app = getApplicationById(appId)
  const mod = moduleId ? getModuleById(moduleId) : null
  const guide = getGuideById(guideId)

  const appModules = useMemo(
    () => (getModulesByApplication(appId) || []).filter((m) => m.isActive),
    [appId, getModulesByApplication]
  )

  const guideList = moduleId
    ? getPublishedGuidesByModule(moduleId)
    : getPublishedDirectGuidesByApplication(appId)

  const sections = useMemo(
    () =>
      guide?.sections?.length
        ? [...guide.sections].sort((a, b) => a.order - b.order)
        : [],
    [guide]
  )

  const [activeStep, setActiveStep] = useState(0)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setActiveStep(0)
  }, [guideId])

  if (!app || !guide || guide.status !== 'published') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Guide not available</h2>
        <Link to={`/viewer/app/${appId}`} className="mt-4 inline-block text-blue-600 hover:underline">
          Back
        </Link>
      </div>
    )
  }

  const currentSection = sections[activeStep]
  const sectionMedia = currentSection
    ? getMediaByGuideSection(guide.id, currentSection.id)
    : []
  const contentItems = sectionMedia.filter((m) => m.type === 'content')
  const steps = parseSteps(currentSection, contentItems)

  const breadcrumbModule = mod?.name || null
  const backUrl = moduleId ? `/viewer/app/${appId}/module/${moduleId}` : `/viewer/app/${appId}`

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const switchGuide = (id) => {
    if (moduleId) {
      navigate(`/viewer/app/${appId}/module/${moduleId}/guide/${id}`)
    } else {
      navigate(`/viewer/app/${appId}/guide/${id}`)
    }
  }

  const switchModule = (modId) => {
    const guides = getPublishedGuidesByModule(modId)
    if (guides.length > 0) {
      navigate(`/viewer/app/${appId}/module/${modId}/guide/${guides[0].id}`)
    } else {
      navigate(`/viewer/app/${appId}/module/${modId}`)
    }
  }

  const switchDirectGuides = () => {
    const direct = getPublishedDirectGuidesByApplication(appId)
    if (direct.length > 0) {
      navigate(`/viewer/app/${appId}/guide/${direct[0].id}`)
    }
  }

  const directGuides = getPublishedDirectGuidesByApplication(appId)
  const showModuleTabs = appModules.length > 0 || directGuides.length > 0

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            {app.name} | User Guide
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-white">
            <Link to="/viewer" className="inline-flex items-center gap-1 hover:text-blue-600">
              <ArrowLeft size={14} />
              All guides
            </Link>
            <span>/</span>
            {breadcrumbModule && (
              <>
                <Link to={backUrl} className="hover:text-blue-600">
                  {breadcrumbModule}
                </Link>
                <span>/</span>
              </>
            )}
            <span className="font-medium text-slate-800 dark:text-white">{guide.title}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={copyLink}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-white dark:hover:bg-slate-800"
        >
          <Copy size={14} />
          {copied ? 'Copied!' : 'Copy link'}
        </button>
      </div>

      {showModuleTabs && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {appModules.map((m) => {
            const isActive = moduleId === m.id
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => switchModule(m.id)}
                className={`flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-white dark:ring-slate-600'
                }`}
              >
                <DynamicIcon
                  name={m.icon}
                  size={16}
                  style={{ color: isActive ? '#ffffff' : m.color }}
                />
                {m.name}
              </button>
            )
          })}
          {directGuides.length > 0 && (
            <button
              type="button"
              onClick={switchDirectGuides}
              className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
                !moduleId
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-white dark:ring-slate-600'
              }`}
            >
              Application Guides
            </button>
          )}
        </div>
      )}

      {guideList.length > 0 && (
        <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
          {guideList.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => switchGuide(g.id)}
              className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
                g.id === guideId
                  ? 'bg-blue-600 text-white ring-2 ring-blue-200 dark:ring-blue-800'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-white dark:ring-slate-600'
              }`}
            >
              {g.title}
            </button>
          ))}
        </div>
      )}

      {sections.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="text-slate-500 dark:text-white">This guide has no sections yet.</p>
        </div>
      ) : (
        <>
          <div className="mb-8 overflow-x-auto pb-2">
            <div className="flex min-w-max items-center gap-0">
              {sections.map((sec, i) => {
                const isDone = i < activeStep
                const isActive = i === activeStep
                return (
                  <div key={sec.id} className="flex items-center">
                    <button
                      type="button"
                      onClick={() => setActiveStep(i)}
                      className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white ring-2 ring-blue-200'
                          : isDone
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-white text-slate-500 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-white dark:ring-slate-600'
                      }`}
                    >
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                          isActive
                            ? 'bg-white text-blue-600'
                            : isDone
                              ? 'bg-emerald-500 text-white'
                              : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-white'
                        }`}
                      >
                        {isDone ? <Check size={14} /> : i + 1}
                      </span>
                      <span className="max-w-[120px] truncate sm:max-w-none">
                        {sec.title?.trim() || `Section ${i + 1}`}
                      </span>
                    </button>
                    {i < sections.length - 1 && (
                      <div className="mx-1 h-px w-6 bg-slate-200 dark:bg-slate-600" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <SectionMediaViewer
              sectionMedia={sectionMedia}
              sectionTitle={currentSection?.title}
              stepIndex={activeStep}
            />

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                Step {activeStep + 1} of {sections.length}
              </p>
              <h2 className="mt-2 font-serif text-2xl font-bold text-slate-900 dark:text-white">
                {currentSection?.title?.trim() || `Section ${activeStep + 1}`}
              </h2>

              {steps.length > 0 ? (
                <ol className="mt-6 space-y-4">
                  {steps.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        {i + 1}
                      </span>
                      <p className="pt-0.5 text-sm leading-relaxed text-slate-700 dark:text-white">
                        {step}
                      </p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-6 text-sm text-slate-500 dark:text-white">
                  No written content for this section yet. Add content in the Content section of
                  the admin panel.
                </p>
              )}

              <div className="mt-8 flex gap-3 border-t border-slate-100 pt-6 dark:border-slate-700">
                <button
                  type="button"
                  disabled={activeStep === 0}
                  onClick={() => setActiveStep((s) => s - 1)}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40 dark:border-slate-600 dark:text-white dark:hover:bg-slate-800"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>
                <button
                  type="button"
                  disabled={activeStep >= sections.length - 1}
                  onClick={() => setActiveStep((s) => s + 1)}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-40"
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

export default ViewerGuide
