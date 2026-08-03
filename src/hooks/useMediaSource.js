import { useEffect, useState } from 'react'
import { getMediaFile as getLocalMediaFile } from '../utils/mediaDb'
import { api } from '../utils/api'

export function useMediaSource(item) {
  const [src, setSrc] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        if (item?.fileData) {
          if (!cancelled) setSrc(item.fileData)
          return
        }
        if (item?.id) {
          try {
            const { fileData } = await api.getMediaFile(item.id)
            if (!cancelled) setSrc(fileData)
            return
          } catch {
            const local = await getLocalMediaFile(item.id)
            if (!cancelled) setSrc(local)
          }
        }
      } catch {
        if (!cancelled) setSrc(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [item?.id, item?.fileData])

  return { src, loading }
}

export async function resolveMediaSource(item) {
  if (item?.fileData) return item.fileData
  if (item?.id) {
    try {
      const { fileData } = await api.getMediaFile(item.id)
      return fileData
    } catch {
      return getLocalMediaFile(item.id)
    }
  }
  return null
}
