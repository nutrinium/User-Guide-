const BASE = import.meta.env.VITE_API_URL || '/api'

async function request(path, options = {}) {
  let res
  try {
    res = await fetch(`${BASE}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })
  } catch {
    throw new Error(
      'Cannot reach API server. Start it with: npm run dev:server (or npm run dev:all for both)'
    )
  }

  if (!res.ok) {
    let message = res.statusText
    try {
      const body = await res.json()
      message = body.error || message
    } catch {
      /* ignore */
    }
    if (res.status === 502 || res.status === 503) {
      message =
        'API server is not running. Open a second terminal and run: npm run dev:server'
    }
    throw new Error(message)
  }

  if (res.status === 204) return null
  return res.json()
}

export const api = {
  health: () => request('/health'),
  bootstrap: () => request('/bootstrap'),
  getMediaFile: (id) => request(`/media/${id}/file`),

  createApplication: (body) => request('/applications', { method: 'POST', body: JSON.stringify(body) }),
  updateApplication: (id, body) =>
    request(`/applications/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteApplication: (id) => request(`/applications/${id}`, { method: 'DELETE' }),

  createModule: (body) => request('/modules', { method: 'POST', body: JSON.stringify(body) }),
  updateModule: (id, body) => request(`/modules/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteModule: (id) => request(`/modules/${id}`, { method: 'DELETE' }),

  createGuide: (body) => request('/guides', { method: 'POST', body: JSON.stringify(body) }),
  updateGuide: (id, body) => request(`/guides/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteGuide: (id) => request(`/guides/${id}`, { method: 'DELETE' }),

  createMedia: (body) => request('/media', { method: 'POST', body: JSON.stringify(body) }),
  updateMedia: (id, body) => request(`/media/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteMedia: (id) => request(`/media/${id}`, { method: 'DELETE' }),

  listApiKeys: () => request('/api-keys'),
  createApiKey: (body) => request('/api-keys', { method: 'POST', body: JSON.stringify(body) }),
  revokeApiKey: (id) => request(`/api-keys/${id}`, { method: 'DELETE' }),
}
