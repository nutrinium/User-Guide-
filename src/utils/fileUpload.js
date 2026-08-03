import { resolveMediaSource } from '../hooks/useMediaSource'

/** Max raw file size before upload. Videos are stored as base64 in MySQL (~33% larger on the wire). */
export const FILE_LIMITS = {
  video: 100 * 1024 * 1024, // 100 MB
  photo: 10 * 1024 * 1024, // 10 MB
  document: 25 * 1024 * 1024, // 25 MB
}

export const ACCEPT_TYPES = {
  video: 'video/mp4,video/webm,video/ogg,video/quicktime,.mp4,.webm,.mov',
  photo: 'image/jpeg,image/png,image/gif,image/webp,image/svg+xml,.jpg,.jpeg,.png,.gif,.webp,.svg',
  document: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar',
}

export function formatFileSize(bytes) {
  if (!bytes) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

export async function processUpload(file, mediaType) {
  const limit = FILE_LIMITS[mediaType]
  if (!limit) throw new Error('Invalid media type')
  if (file.size > limit) {
    throw new Error(`File too large. Max size is ${formatFileSize(limit)}.`)
  }

  const fileData = await readFileAsDataURL(file)
  return {
    fileName: file.name,
    fileType: file.type || 'application/octet-stream',
    fileSize: file.size,
    fileData,
  }
}

export function downloadFile(item) {
  resolveMediaSource(item).then((source) => {
    if (!source) return
    const link = document.createElement('a')
    link.href = source
    link.download = item.fileName || item.name || 'download'
    link.click()
  })
}

export function openFileInNewTab(item) {
  resolveMediaSource(item).then((source) => {
    if (!source) return
    window.open(source, '_blank', 'noopener,noreferrer')
  })
}

export function getFileLabel(item) {
  return item.fileName || (item.url ? 'External link' : 'No file')
}

export function getFileExtension(fileName) {
  if (!fileName) return 'file'
  const parts = fileName.split('.')
  return parts.length > 1 ? parts.pop().toLowerCase() : 'file'
}

export function formatDate(isoString) {
  if (!isoString) return '—'
  return new Date(isoString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}
