import { useEffect, useState } from 'react'
import { getMediaFile } from '../utils/mediaDb'

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
          const data = await getMediaFile(item.id)
          if (!cancelled) setSrc(data)
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
  if (item?.id) return getMediaFile(item.id)
  return null
}
