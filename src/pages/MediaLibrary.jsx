import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Upload,
  Download,
  FileText,
  X,
  Share2,
  PenLine,
  AlignLeft,
} from 'lucide-react'
import { useGuideContext } from '../context/GuideContext'
import { useMediaSource } from '../hooks/useMediaSource'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import { DynamicIcon } from '../utils/icons'
import { MEDIA_TYPES } from '../utils/storage'
import {
  ACCEPT_TYPES,
  processUpload,
  formatFileSize,
  formatDate,
  getFileExtension,
  downloadFile,
  openFileInNewTab,
} from '../utils/fileUpload'

const ROUTE_TYPES = ['videos', 'photos', 'documents', 'content']

const emptyForm = {
  applicationId: '',
  moduleId: '',
  guideId: '',
  sectionId: '',
  guideTitle: '',
  sectionTitle: '',
  name: '',
  description: '',
  contentText: '',
  fileName: '',
  fileType: '',
  fileSize: 0,
  fileData: '',
}

function buildGuideWithAllSections(guideId, items, getGuideById) {
  const guide = getGuideById(guideId)
  if (!guide) return null

  const guideItems = items.filter((item) => item.guideId === guideId)
  const sectionMap = {}

  guideItems.forEach((item) => {
    const sKey = item.sectionId || '__none__'
    if (!sectionMap[sKey]) {
      sectionMap[sKey] = {
        sectionId: item.sectionId,
        sectionTitle: item.sectionTitle || 'Uncategorized',
        items: [],
      }
    }
    sectionMap[sKey].items.push(item)
  })

  const allSections = guide.sections?.length
    ? [...guide.sections].sort((a, b) => a.order - b.order)
    : []

  const sections =
    allSections.length > 0
      ? allSections.map((s, i) => ({
          sectionId: s.id,
          sectionTitle: s.title?.trim() || `Section ${i + 1}`,
          items: sectionMap[s.id]?.items || [],
        }))
      : Object.values(sectionMap)

  return {
    guideId: guide.id,
    guideTitle: guide.title || 'Untitled Guide',
    sections,
  }
}

function MediaThumbnail({ item, mediaType, directSrc }) {
  const { src: loadedSrc, loading } = useMediaSource(directSrc ? { fileData: directSrc } : item)
  const source = directSrc || loadedSrc

  if (loading && !directSrc) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-100">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    )
  }

  if (!source) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-100">
        <FileText size={40} className="text-slate-300" />
      </div>
    )
  }

  if (mediaType === 'photo') {
    return (
      <img
        src={source}
        alt={item.name}
        className="h-full w-full object-cover"
      />
    )
  }

  if (mediaType === 'video') {
    return (
      <video
        src={source}
        className="h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />
    )
  }

  const ext = getFileExtension(item.fileName)
  return (
    <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <FileText size={48} className="text-blue-500" />
      <span className="mt-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
        {ext}
      </span>
    </div>
  )
}

function FullPageVideoPlayer({ item, onClose }) {
  const { src, loading } = useMediaSource(item)

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black">
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-white sm:text-base">
            {item.fileName || item.name}
          </h2>
          <p className="text-xs text-slate-400">
            {formatFileSize(item.fileSize)} · {formatDate(item.createdAt)}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          title="Close"
        >
          <X size={24} />
        </button>
      </div>

      <div className="flex flex-1 items-center justify-center p-4 sm:p-8">
        {loading ? (
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : src ? (
          <video
            src={src}
            className="max-h-full max-w-full rounded-lg"
            controls
            autoPlay
            playsInline
          />
        ) : (
          <p className="text-sm text-slate-400">Unable to load video</p>
        )}
      </div>
    </div>
  )
}

function ContentCard({ item, onEdit, onDelete }) {
  const preview = item.contentText || item.description || ''

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="border-b border-slate-100 bg-gradient-to-br from-violet-50 to-slate-50 p-4 dark:from-violet-950 dark:to-slate-900">
        <div className="mb-2 flex items-center gap-2">
          <AlignLeft size={16} className="text-violet-600" />
          <span className="text-xs font-semibold uppercase tracking-wider text-violet-600">Content</span>
        </div>
        <p className="line-clamp-6 whitespace-pre-wrap text-sm text-slate-700 dark:text-white">
          {preview || 'No content yet'}
        </p>
      </div>

      <div className="p-4">
        <h4 className="line-clamp-2 text-sm font-bold text-slate-900" title={item.name}>
          {item.name}
        </h4>
        <p className="mt-2 text-xs text-slate-400">{formatDate(item.createdAt)}</p>

        <div className="mt-4 flex items-center gap-1 border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-blue-50 hover:text-blue-600"
            title="Edit"
          >
            <Pencil size={18} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(item)}
            className="ml-auto rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50"
            title="Delete"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}

function SectionItemCard({ item, mediaType, onEdit, onDelete, onPlayVideo }) {
  if (mediaType === 'content') {
    return <ContentCard item={item} onEdit={onEdit} onDelete={onDelete} />
  }
  return (
    <MediaFileCard
      item={item}
      mediaType={mediaType}
      onEdit={onEdit}
      onDelete={onDelete}
      onPlayVideo={onPlayVideo}
    />
  )
}

function MediaFileCard({ item, mediaType, onEdit, onDelete, onPlayVideo }) {
  const displayName = item.fileName || item.name
  const ext = getFileExtension(item.fileName)

  const handleOpen = () => {
    if (mediaType === 'video' && onPlayVideo) {
      onPlayVideo(item)
    } else {
      openFileInNewTab(item)
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <button
        type="button"
        onClick={handleOpen}
        className="block h-44 w-full overflow-hidden border-b border-slate-100"
      >
        <MediaThumbnail item={item} mediaType={mediaType} />
      </button>

      <div className="p-4">
        <h4 className="line-clamp-2 text-sm font-bold text-slate-900" title={displayName}>
          {displayName}
        </h4>

        <div className="mt-2 flex items-center gap-2">
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold uppercase text-emerald-700 ring-1 ring-emerald-200">
            {ext}
          </span>
          <span className="text-xs text-slate-500">
            {item.fileSize ? formatFileSize(item.fileSize) : '—'}
          </span>
        </div>

        <p className="mt-2 text-xs text-slate-400">{formatDate(item.createdAt)}</p>

        <div className="mt-4 flex items-center gap-1 border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={() => downloadFile(item)}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-blue-50 hover:text-blue-600"
            title="Download"
          >
            <Download size={18} />
          </button>
          <button
            type="button"
            onClick={handleOpen}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-blue-50 hover:text-blue-600"
            title={mediaType === 'video' ? 'Play' : 'Open / Share'}
          >
            <Share2 size={18} />
          </button>
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-blue-50 hover:text-blue-600"
            title="Edit"
          >
            <Pencil size={18} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(item)}
            className="ml-auto rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50"
            title="Delete"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}

function sectionItemLabel(mediaType, count) {
  if (mediaType === 'content') {
    return `${count} content block${count !== 1 ? 's' : ''}`
  }
  return `${count} file(s)`
}

function sectionEmptyLabel(mediaType) {
  return mediaType === 'content' ? 'No content yet' : 'No files yet'
}

function ModuleMediaSection({
  mod,
  items,
  mediaType,
  moduleGuides,
  getApplicationById,
  getGuideById,
  openCreate,
  openEdit,
  setDeleteConfirm,
  setPlayingVideo,
}) {
  const app = getApplicationById(mod.applicationId)
  const guideIdsKey = moduleGuides.map((g) => `${g.id}:${g.updatedAt}`).join('|')
  const [selectedGuideId, setSelectedGuideId] = useState(
    () => moduleGuides[0]?.id || ''
  )

  useEffect(() => {
    setSelectedGuideId((current) => {
      if (moduleGuides.length === 0) return ''
      if (moduleGuides.some((g) => g.id === current)) return current
      return moduleGuides[0].id
    })
  }, [mod.id, guideIdsKey])

  const selectedGuideGroup = selectedGuideId
    ? buildGuideWithAllSections(selectedGuideId, items, getGuideById)
    : null

  const itemCount = items.length

  return (
    <div className="mb-8">
      <div className="mb-4 flex items-center gap-3">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${mod.color}15` }}
        >
          <DynamicIcon name={mod.icon} size={18} style={{ color: mod.color }} />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900">{mod.name}</h3>
          {app && <p className="text-xs text-slate-400">{app.name}</p>}
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
          {itemCount}
        </span>
      </div>

      <div className="border-l-2 border-slate-100 pl-4 sm:pl-6">
        {moduleGuides.length === 0 ? (
          <p className="text-sm text-slate-500">No guides in this module yet.</p>
        ) : (
          <>
            <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
              {moduleGuides.map((guide) => {
                const isActive = guide.id === selectedGuideId
                const guideItemCount = items.filter((i) => i.guideId === guide.id).length
                return (
                  <button
                    key={guide.id}
                    type="button"
                    onClick={() => setSelectedGuideId(guide.id)}
                    className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'border-blue-600 bg-blue-600 text-white shadow-sm dark:border-blue-500 dark:bg-blue-500'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:hover:border-blue-500 dark:hover:bg-slate-700'
                    }`}
                  >
                    {guide.title || 'Untitled Guide'}
                    {guideItemCount > 0 && (
                      <span
                        className={`ml-2 rounded-full px-1.5 py-0.5 text-xs ${
                          isActive ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {guideItemCount}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {selectedGuideGroup && (
              <div className="flex gap-4 overflow-x-auto pb-2">
                {selectedGuideGroup.sections.length === 0 ? (
                  <p className="py-6 text-sm text-slate-500">
                    This guide has no sections yet. Add sections in Guides first.
                  </p>
                ) : (
                  selectedGuideGroup.sections.map((sec) => (
                    <div
                      key={sec.sectionId || sec.sectionTitle}
                      className="min-w-[260px] max-w-[320px] shrink-0 rounded-xl border border-slate-200 bg-slate-50/50 p-4"
                    >
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-slate-800">
                            {sec.sectionTitle || 'Untitled Section'}
                          </span>
                          <span className="text-xs text-slate-400">
                            {sectionItemLabel(mediaType, sec.items.length)}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            openCreate({
                              applicationId: mod.applicationId,
                              moduleId: mod.id,
                              guideId: selectedGuideId,
                              sectionId: sec.sectionId,
                            })
                          }
                        >
                          {mediaType === 'content' ? <PenLine size={14} /> : <Upload size={14} />}
                        </Button>
                      </div>

                      {sec.items.length === 0 ? (
                        <p className="py-8 text-center text-xs text-slate-400">
                          {sectionEmptyLabel(mediaType)}
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {sec.items.map((item) => (
                            <SectionItemCard
                              key={item.id}
                              item={item}
                              mediaType={mediaType}
                              onEdit={openEdit}
                              onDelete={setDeleteConfirm}
                              onPlayVideo={mediaType === 'video' ? setPlayingVideo : undefined}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function AppDirectMediaSection({
  app,
  items,
  mediaType,
  appGuides,
  getGuideById,
  openCreate,
  openEdit,
  setDeleteConfirm,
  setPlayingVideo,
}) {
  const guideIdsKey = appGuides.map((g) => `${g.id}:${g.updatedAt}`).join('|')
  const [selectedGuideId, setSelectedGuideId] = useState(() => appGuides[0]?.id || '')

  useEffect(() => {
    setSelectedGuideId((current) => {
      if (appGuides.length === 0) return ''
      if (appGuides.some((g) => g.id === current)) return current
      return appGuides[0].id
    })
  }, [app.id, guideIdsKey])

  const selectedGuideGroup = selectedGuideId
    ? buildGuideWithAllSections(selectedGuideId, items, getGuideById)
    : null

  const itemCount = items.length

  return (
    <div className="mb-8">
      <div className="mb-4 flex items-center gap-3">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${app.color}15` }}
        >
          <DynamicIcon name={app.icon} size={18} style={{ color: app.color }} />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900">Application Guides</h3>
          <p className="text-xs text-slate-400">No module — direct to {app.name}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
          {itemCount}
        </span>
      </div>

      <div className="border-l-2 border-slate-100 pl-4 sm:pl-6">
        {appGuides.length === 0 ? (
          <p className="text-sm text-slate-500">No direct guides for this application yet.</p>
        ) : (
          <>
            <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
              {appGuides.map((guide) => {
                const isActive = guide.id === selectedGuideId
                const guideItemCount = items.filter((i) => i.guideId === guide.id).length
                return (
                  <button
                    key={guide.id}
                    type="button"
                    onClick={() => setSelectedGuideId(guide.id)}
                    className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'border-blue-600 bg-blue-600 text-white shadow-sm dark:border-blue-500 dark:bg-blue-500'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:hover:border-blue-500 dark:hover:bg-slate-700'
                    }`}
                  >
                    {guide.title || 'Untitled Guide'}
                    {guideItemCount > 0 && (
                      <span
                        className={`ml-2 rounded-full px-1.5 py-0.5 text-xs ${
                          isActive ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {guideItemCount}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {selectedGuideGroup && (
              <div className="flex gap-4 overflow-x-auto pb-2">
                {selectedGuideGroup.sections.length === 0 ? (
                  <p className="py-6 text-sm text-slate-500">
                    This guide has no sections yet. Add sections in Guides first.
                  </p>
                ) : (
                  selectedGuideGroup.sections.map((sec) => (
                    <div
                      key={sec.sectionId || sec.sectionTitle}
                      className="min-w-[260px] max-w-[320px] shrink-0 rounded-xl border border-slate-200 bg-slate-50/50 p-4"
                    >
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-slate-800">
                            {sec.sectionTitle || 'Untitled Section'}
                          </span>
                          <span className="text-xs text-slate-400">
                            {sectionItemLabel(mediaType, sec.items.length)}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            openCreate({
                              applicationId: app.id,
                              moduleId: '',
                              guideId: selectedGuideId,
                              sectionId: sec.sectionId,
                            })
                          }
                        >
                          {mediaType === 'content' ? <PenLine size={14} /> : <Upload size={14} />}
                        </Button>
                      </div>

                      {sec.items.length === 0 ? (
                        <p className="py-8 text-center text-xs text-slate-400">
                          {sectionEmptyLabel(mediaType)}
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {sec.items.map((item) => (
                            <SectionItemCard
                              key={item.id}
                              item={item}
                              mediaType={mediaType}
                              onEdit={openEdit}
                              onDelete={setDeleteConfirm}
                              onPlayVideo={mediaType === 'video' ? setPlayingVideo : undefined}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function MediaLibrary() {
  const location = useLocation()
  const typeKey = location.pathname.replace('/', '')
  const {
    applications,
    modules,
    guides,
    getMediaByModule,
    getMediaByApplicationDirect,
    getGuidesByModule,
    getDirectGuidesByApplication,
    getGuideById,
    getApplicationById,
    addMedia,
    updateMedia,
    deleteMedia,
  } = useGuideContext()

  const mediaConfig = MEDIA_TYPES[typeKey]
  const mediaType = mediaConfig?.type
  const activeApps = applications.filter((a) => a.isActive)
  const activeModules = modules.filter((m) => m.isActive)

  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [addForApplication, setAddForApplication] = useState('')
  const [addForModule, setAddForModule] = useState('')
  const [addForGuide, setAddForGuide] = useState('')
  const [addForSection, setAddForSection] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [playingVideo, setPlayingVideo] = useState(null)

  if (!mediaConfig || !ROUTE_TYPES.includes(typeKey)) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <h2 className="text-xl font-semibold text-slate-800">Page not found</h2>
        <Link to="/" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
          Go to Dashboard
        </Link>
      </div>
    )
  }

  const filterItem = (item) =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    (item.fileName || '').toLowerCase().includes(search.toLowerCase()) ||
    item.description.toLowerCase().includes(search.toLowerCase()) ||
    (item.contentText || '').toLowerCase().includes(search.toLowerCase()) ||
    (item.guideTitle || '').toLowerCase().includes(search.toLowerCase()) ||
    (item.sectionTitle || '').toLowerCase().includes(search.toLowerCase())

  const formAppModules = form.applicationId
    ? activeModules.filter((m) => m.applicationId === form.applicationId)
    : []

  const availableGuides = form.moduleId
    ? getGuidesByModule(form.moduleId)
    : form.applicationId
      ? getDirectGuidesByApplication(form.applicationId)
      : []

  const selectedGuide = form.guideId ? getGuideById(form.guideId) : null
  const guideSections = selectedGuide?.sections?.length
    ? [...selectedGuide.sections].sort((a, b) => a.order - b.order)
    : []

  const resetForm = ({
    applicationId = '',
    moduleId = '',
    guideId = '',
    sectionId = '',
  } = {}) => {
    const appId = applicationId || activeApps[0]?.id || ''
    const modId = moduleId || ''
    const guideList = modId
      ? getGuidesByModule(modId)
      : appId
        ? getDirectGuidesByApplication(appId)
        : []
    const guide = guideId ? getGuideById(guideId) : guideList[0]
    const sections = guide?.sections?.length
      ? [...guide.sections].sort((a, b) => a.order - b.order)
      : []
    const section = sectionId ? sections.find((s) => s.id === sectionId) : sections[0]

    return {
      ...emptyForm,
      applicationId: appId,
      moduleId: modId,
      guideId: guide?.id || '',
      sectionId: section?.id || '',
      guideTitle: guide?.title || '',
      sectionTitle: section?.title || '',
    }
  }

  const openCreate = ({
    applicationId = '',
    moduleId = '',
    guideId = '',
    sectionId = '',
  } = {}) => {
    setEditing(null)
    setAddForApplication(applicationId)
    setAddForModule(moduleId)
    setAddForGuide(guideId)
    setAddForSection(sectionId)
    setUploadError('')
    setForm(resetForm({ applicationId, moduleId, guideId, sectionId }))
    setModalOpen(true)
  }

  const openEdit = (item) => {
    setEditing(item)
    setUploadError('')
    setForm({
      applicationId: item.applicationId || '',
      moduleId: item.moduleId || '',
      guideId: item.guideId || '',
      sectionId: item.sectionId || '',
      guideTitle: item.guideTitle || '',
      sectionTitle: item.sectionTitle || '',
      name: item.name,
      description: item.description,
      contentText: item.contentText || '',
      fileName: item.fileName || '',
      fileType: item.fileType || '',
      fileSize: item.fileSize || 0,
      fileData: item.fileData || '',
    })
    setModalOpen(true)
  }

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError('')
    setUploading(true)
    try {
      const uploaded = await processUpload(file, mediaType)
      setForm((prev) => ({
        ...prev,
        ...uploaded,
        name: prev.name.trim() || file.name.replace(/\.[^.]+$/, ''),
      }))
    } catch (err) {
      setUploadError(err.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const clearFile = () => {
    setForm((prev) => ({
      ...prev,
      fileName: '',
      fileType: '',
      fileSize: 0,
      fileData: '',
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.applicationId || !form.guideId || !form.sectionId) {
      setUploadError('Please select application, guide, and section.')
      return
    }
    if (mediaType === 'content') {
      if (!form.contentText.trim()) {
        setUploadError('Please write content for this section.')
        return
      }
    } else if (!editing && !form.fileData) {
      setUploadError('Please upload a file from your computer.')
      return
    }

    const guide = getGuideById(form.guideId)
    const section = guide?.sections?.find((s) => s.id === form.sectionId)
    const payload = {
      ...form,
      moduleId: form.moduleId || '',
      guideTitle: guide?.title || form.guideTitle,
      sectionTitle: section?.title || form.sectionTitle || 'Untitled Section',
    }

    setUploadError('')
    setUploading(true)
    try {
      if (editing) {
        await updateMedia(editing.id, payload)
      } else {
        await addMedia({ ...payload, type: mediaType })
      }
      setModalOpen(false)
    } catch (err) {
      setUploadError(err.message || 'Upload failed. The file may be too large.')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id) => {
    await deleteMedia(id)
    setDeleteConfirm(null)
  }

  const groupedByApp = activeApps
    .map((app) => ({
      app,
      directItems: getMediaByApplicationDirect(app.id, mediaType).filter(filterItem),
      modules: activeModules
        .filter((m) => m.applicationId === app.id)
        .map((mod) => ({
          mod,
          items: getMediaByModule(mod.id, mediaType).filter(filterItem),
        }))
        .filter(
          (m) => m.items.length > 0 || getGuidesByModule(m.mod.id).length > 0
        ),
    }))
    .filter((g) => {
      const hasDirect =
        g.directItems.length > 0 || getDirectGuidesByApplication(g.app.id).length > 0
      return hasDirect || g.modules.length > 0
    })

  const unassignedModules = activeModules
    .filter((m) => !m.applicationId)
    .map((mod) => ({
      mod,
      items: getMediaByModule(mod.id, mediaType).filter(filterItem),
    }))
    .filter((m) => m.items.length > 0 || getGuidesByModule(m.mod.id).length > 0)

  const hasVisibleContent = groupedByApp.length > 0 || unassignedModules.length > 0

  const totalCount =
    groupedByApp.reduce(
      (sum, g) =>
        sum +
        g.directItems.length +
        g.modules.reduce((s, m) => s + m.items.length, 0),
      0
    ) + unassignedModules.reduce((s, m) => s + m.items.length, 0)

  const uploadLabel =
    mediaType === 'video'
      ? 'video'
      : mediaType === 'photo'
        ? 'photo'
        : mediaType === 'content'
          ? 'content'
          : 'document'

  const isContent = mediaType === 'content'

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{mediaConfig.label}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {isContent
              ? 'Write section content — stored locally in your browser'
              : 'Upload files by guide section — stored locally in your browser'}
          </p>
        </div>
        {activeApps.length > 0 && (
          <Button onClick={() => openCreate()}>
            {isContent ? <PenLine size={16} /> : <Plus size={16} />}
            {isContent ? 'Add Content' : `Upload ${mediaConfig.label.slice(0, -1)}`}
          </Button>
        )}
      </div>

      <div className="relative max-w-xl">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder={
            isContent
              ? 'Search content by title or text...'
              : `Search ${mediaConfig.label.toLowerCase()} by name or file...`
          }
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <p className="text-sm text-slate-500">
        Showing {totalCount} {isContent ? 'content blocks' : mediaConfig.label.toLowerCase()} ·
        stored in browser{isContent ? '' : ' (IndexedDB)'}
      </p>

      {activeApps.length === 0 ? (
        <Card className="py-16 text-center">
          <h3 className="text-lg font-semibold text-slate-800">No applications yet</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
            Create an application first to upload {mediaConfig.label.toLowerCase()}.
          </p>
          <Link to="/applications">
            <Button className="mt-6">
              <Plus size={16} />
              Add Application
            </Button>
          </Link>
        </Card>
      ) : guides.length === 0 ? (
        <Card className="py-16 text-center">
          <h3 className="text-lg font-semibold text-slate-800">Create a guide with sections first</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
            {isContent
              ? 'Write content under guide sections.'
              : 'Videos, photos, and documents are uploaded under guide sections.'}
          </p>
          <Link to="/guides/new">
            <Button className="mt-6">
              <Plus size={16} />
              Create Guide
            </Button>
          </Link>
        </Card>
      ) : !hasVisibleContent ? (
        <Card className="py-16 text-center">
          {isContent ? (
            <PenLine size={40} className="mx-auto text-slate-300" />
          ) : (
            <Upload size={40} className="mx-auto text-slate-300" />
          )}
          <h3 className="mt-4 text-lg font-semibold text-slate-800">
            {isContent ? 'No content added yet' : 'No files uploaded yet'}
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            {isContent
              ? 'Add content to a guide section.'
              : `Upload ${mediaConfig.label.toLowerCase()} to a guide section.`}
          </p>
          <Button onClick={() => openCreate()} className="mt-6">
            {isContent ? <PenLine size={16} /> : <Upload size={16} />}
            {isContent ? 'Add First Content' : 'Upload First File'}
          </Button>
        </Card>
      ) : (
        <div className="space-y-10">
          {groupedByApp.map(({ app, directItems, modules: appModules }) => (
            <section key={app.id}>
              <div className="mb-6 flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${app.color}15` }}
                >
                  <DynamicIcon name={app.icon} size={20} style={{ color: app.color }} />
                </div>
                <h2 className="text-lg font-bold text-slate-900">{app.name}</h2>
              </div>
              {(directItems.length > 0 ||
                getDirectGuidesByApplication(app.id).length > 0) && (
                <AppDirectMediaSection
                  app={app}
                  items={directItems}
                  mediaType={mediaType}
                  appGuides={getDirectGuidesByApplication(app.id)}
                  getGuideById={getGuideById}
                  openCreate={openCreate}
                  openEdit={openEdit}
                  setDeleteConfirm={setDeleteConfirm}
                  setPlayingVideo={setPlayingVideo}
                />
              )}
              {appModules.map(({ mod, items }) => (
                <ModuleMediaSection
                  key={mod.id}
                  mod={mod}
                  items={items}
                  mediaType={mediaType}
                  moduleGuides={getGuidesByModule(mod.id)}
                  getApplicationById={getApplicationById}
                  getGuideById={getGuideById}
                  openCreate={openCreate}
                  openEdit={openEdit}
                  setDeleteConfirm={setDeleteConfirm}
                  setPlayingVideo={setPlayingVideo}
                />
              ))}
            </section>
          ))}

          {unassignedModules.length > 0 && (
            <section>
              <h2 className="mb-6 text-lg font-bold text-slate-900">Other Modules</h2>
              {unassignedModules.map(({ mod, items }) => (
                <ModuleMediaSection
                  key={mod.id}
                  mod={mod}
                  items={items}
                  mediaType={mediaType}
                  moduleGuides={getGuidesByModule(mod.id)}
                  getApplicationById={getApplicationById}
                  getGuideById={getGuideById}
                  openCreate={openCreate}
                  openEdit={openEdit}
                  setDeleteConfirm={setDeleteConfirm}
                  setPlayingVideo={setPlayingVideo}
                />
              ))}
            </section>
          )}
        </div>
      )}

      {playingVideo && (
        <FullPageVideoPlayer item={playingVideo} onClose={() => setPlayingVideo(null)} />
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          editing
            ? `Edit ${isContent ? 'Content' : mediaConfig.label.slice(0, -1)}`
            : isContent
              ? 'Add Content'
              : `Upload ${mediaConfig.label.slice(0, -1)}`
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Application *</label>
            <select
              value={form.applicationId}
              onChange={(e) => {
                const appId = e.target.value
                setForm(resetForm({ applicationId: appId, moduleId: '' }))
              }}
              disabled={Boolean(editing) || Boolean(addForApplication)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
            >
              <option value="">Select application</option>
              {activeApps.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Module <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <select
              value={form.moduleId}
              onChange={(e) => {
                const modId = e.target.value
                setForm(resetForm({ applicationId: form.applicationId, moduleId: modId }))
              }}
              disabled={Boolean(editing) || Boolean(addForModule) || !form.applicationId}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
            >
              <option value="">No module — direct to application</option>
              {formAppModules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Guide *</label>
            <select
              value={form.guideId}
              onChange={(e) => {
                const guideId = e.target.value
                const guide = getGuideById(guideId)
                const sections = guide?.sections?.length
                  ? [...guide.sections].sort((a, b) => a.order - b.order)
                  : []
                const first = sections[0]
                setForm((prev) => ({
                  ...prev,
                  guideId,
                  sectionId: first?.id || '',
                  guideTitle: guide?.title || '',
                  sectionTitle: first?.title || '',
                }))
              }}
              disabled={
                Boolean(editing) ||
                Boolean(addForGuide) ||
                !form.applicationId ||
                (form.moduleId ? false : !form.applicationId)
              }
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
            >
              <option value="">Select guide</option>
              {availableGuides.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Section *</label>
            <select
              value={form.sectionId}
              onChange={(e) => {
                const sectionId = e.target.value
                const section = guideSections.find((s) => s.id === sectionId)
                setForm((prev) => ({
                  ...prev,
                  sectionId,
                  sectionTitle: section?.title || '',
                }))
              }}
              disabled={
                Boolean(editing) ||
                Boolean(addForSection) ||
                !form.guideId ||
                guideSections.length === 0
              }
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
            >
              <option value="">Select section</option>
              {guideSections.map((s, i) => (
                <option key={s.id} value={s.id}>
                  {s.title?.trim() || `Section ${i + 1}`}
                </option>
              ))}
            </select>
            {form.guideId && guideSections.length === 0 && (
              <p className="mt-1 text-xs text-amber-600">
                This guide has no sections. Add sections in Guide Management first.
              </p>
            )}
          </div>

          {isContent ? (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Content *</label>
              <textarea
                required
                value={form.contentText}
                onChange={(e) => setForm({ ...form, contentText: e.target.value })}
                rows={8}
                placeholder="Write content for this guide section..."
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
              {uploadError && <p className="mt-2 text-xs text-red-600">{uploadError}</p>}
            </div>
          ) : (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Upload {uploadLabel} from computer *
              </label>
              {!form.fileData ? (
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-8 transition-colors hover:border-blue-400 hover:bg-blue-50/50">
                  <Upload size={28} className="text-slate-400" />
                  <p className="mt-2 text-sm font-medium text-slate-700">
                    Click to browse or drag & drop
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {mediaType === 'video' && 'MP4, WebM, MOV — max 20 MB · stored in browser'}
                    {mediaType === 'photo' && 'JPG, PNG, GIF, WebP — max 5 MB · stored in browser'}
                    {mediaType === 'document' &&
                      'PDF, DOC, XLS, PPT, TXT — max 10 MB · stored in browser'}
                  </p>
                  <input
                    type="file"
                    accept={ACCEPT_TYPES[mediaType]}
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              ) : (
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <div className="h-32 overflow-hidden bg-slate-100">
                    <MediaThumbnail
                      item={{ fileName: form.fileName, name: form.name }}
                      mediaType={mediaType}
                      directSrc={form.fileData}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{form.fileName}</p>
                      <p className="text-xs text-slate-500">{formatFileSize(form.fileSize)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={clearFile}
                      className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-red-500"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <label className="block cursor-pointer border-t border-slate-100 px-3 py-2 text-center text-xs font-medium text-blue-600 hover:bg-slate-50">
                    Replace file
                    <input
                      type="file"
                      accept={ACCEPT_TYPES[mediaType]}
                      onChange={handleFileSelect}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                </div>
              )}
              {uploading && <p className="mt-2 text-xs text-blue-600">Uploading...</p>}
              {uploadError && <p className="mt-2 text-xs text-red-600">{uploadError}</p>}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              {isContent ? 'Title *' : 'Name *'}
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={isContent ? 'e.g. Overview, Instructions' : 'Enter display name'}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {!isContent && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                placeholder="Optional description"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={uploading}>
              {editing ? 'Save Changes' : isContent ? 'Save Content' : 'Upload'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Item"
        size="sm"
      >
        <p className="text-sm text-slate-600">
          Delete <strong>{deleteConfirm?.name}</strong>? This cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => handleDelete(deleteConfirm.id)}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default MediaLibrary
