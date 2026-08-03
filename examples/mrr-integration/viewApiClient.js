/**
 * Read-only client for the User Guide Public View API (/api/v1/view).
 * Copy this file into your application (e.g. MRR, Store, HR).
 */
export class ViewApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ViewApiError'
    this.status = status
  }
}

export function createViewApiClient({ baseUrl, apiKey }) {
  const root = baseUrl.replace(/\/$/, '')

  async function request(path, options = {}) {
    const res = await fetch(`${root}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
        ...options.headers,
      },
    })

    if (!res.ok) {
      let message = res.statusText
      try {
        const body = await res.json()
        message = body.error || body.message || message
      } catch {
        /* ignore */
      }
      throw new ViewApiError(message, res.status)
    }

    if (res.status === 204) return null
    return res.json()
  }

  return {
    getApplication: (code) => request(`/applications/${encodeURIComponent(code)}`),
    getModules: (code) => request(`/applications/${encodeURIComponent(code)}/modules`),
    getScreens: (moduleId) => request(`/modules/${encodeURIComponent(moduleId)}/screens`),
    getScreen: (screenId) => request(`/screens/${encodeURIComponent(screenId)}`),
    getScreenSteps: (screenId) => request(`/screens/${encodeURIComponent(screenId)}/steps`),
    getWorkflow: (workflowId) => request(`/workflows/${encodeURIComponent(workflowId)}`),
    search: (params = {}) => {
      const qs = new URLSearchParams()
      if (params.q) qs.set('q', params.q)
      if (params.applicationCode) qs.set('applicationCode', params.applicationCode)
      if (params.type) qs.set('type', params.type)
      if (params.page) qs.set('page', String(params.page))
      if (params.limit) qs.set('limit', String(params.limit))
      const query = qs.toString()
      return request(`/search${query ? `?${query}` : ''}`)
    },
  }
}
