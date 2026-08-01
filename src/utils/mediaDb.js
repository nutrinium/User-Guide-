const DB_NAME = 'ugms_media'
const STORE_NAME = 'files'
const DB_VERSION = 1

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
  })
}

export async function saveMediaFile(id, fileData) {
  if (!fileData) return
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put({ id, fileData })
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getMediaFile(id) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).get(id)
    req.onsuccess = () => resolve(req.result?.fileData || null)
    req.onerror = () => reject(req.error)
  })
}

export async function deleteMediaFile(id) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function deleteMediaFiles(ids) {
  await Promise.all(ids.map((id) => deleteMediaFile(id)))
}

export async function migrateMediaFilesToDb(mediaItems) {
  const toMigrate = mediaItems.filter((m) => m.fileData)
  if (toMigrate.length === 0) return mediaItems

  await Promise.all(toMigrate.map((m) => saveMediaFile(m.id, m.fileData)))
  return mediaItems.map(({ fileData, ...rest }) => rest)
}
