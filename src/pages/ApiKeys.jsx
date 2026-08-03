import { useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Plus,
  Key,
  Copy,
  Trash2,
  Check,
  AlertTriangle,
  Shield,
  RefreshCw,
} from 'lucide-react'
import { useGuideContext } from '../context/GuideContext'
import { api } from '../utils/api'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'

const emptyForm = { name: '', applicationId: '' }

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString()
}

function ApiKeys() {
  const location = useLocation()
  const { applications } = useGuideContext()
  const [keys, setKeys] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [creating, setCreating] = useState(false)
  const [createdKey, setCreatedKey] = useState(null)
  const [copied, setCopied] = useState(false)
  const [revokeConfirm, setRevokeConfirm] = useState(null)

  const viewApiBase =
    import.meta.env.VITE_PUBLIC_VIEW_API_URL ||
    `${window.location.origin}/api/v1/view`

  const loadKeys = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await api.listApiKeys()
      setKeys(result.data || [])
    } catch (err) {
      setError(err.message || 'Failed to load API keys')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadKeys()
  }, [loadKeys, location.pathname])

  const openCreate = () => {
    setForm(emptyForm)
    setCreatedKey(null)
    setCopied(false)
    setModalOpen(true)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setCreating(true)
    try {
      const result = await api.createApiKey({
        name: form.name.trim(),
        applicationId: form.applicationId || null,
      })
      setCreatedKey(result)
      await loadKeys()
    } catch (err) {
      setError(err.message || 'Failed to create API key')
    } finally {
      setCreating(false)
    }
  }

  const handleRevoke = async (id) => {
    try {
      await api.revokeApiKey(id)
      setRevokeConfirm(null)
      await loadKeys()
    } catch (err) {
      setError(err.message || 'Failed to revoke API key')
    }
  }

  const copyText = async (text) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getAppLabel = (applicationId) => {
    if (!applicationId) return 'All applications'
    const app = applications.find((a) => a.id === applicationId)
    return app ? `${app.name} (${app.code || app.name})` : applicationId
  }

  const activeKeys = keys.filter((k) => k.isActive)
  const revokedKeys = keys.filter((k) => !k.isActive)
  const allKeys = [...activeKeys, ...revokedKeys]

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">API Keys</h1>
          <p className="mt-1 text-sm text-slate-500">
            Issue read-only keys for external applications (MRR, Store, HR, etc.)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadKeys} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </Button>
          <Button onClick={openCreate}>
            <Plus size={16} />
            Generate API Key
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card>
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50">
            <Shield size={20} className="text-violet-600" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-slate-800">Developer handoff</h3>
            <p className="mt-1 text-sm text-slate-500">
              Share these details with app developers. Keys are read-only — no create, update, or
              delete access.
            </p>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex flex-col gap-1 sm:flex-row sm:gap-3">
                <dt className="shrink-0 font-medium text-slate-600 sm:w-28">Base URL</dt>
                <dd className="flex items-center gap-2 font-mono text-xs text-slate-800">
                  <span className="break-all">{viewApiBase}</span>
                  <button
                    type="button"
                    onClick={() => copyText(viewApiBase)}
                    className="shrink-0 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    title="Copy base URL"
                  >
                    <Copy size={14} />
                  </button>
                </dd>
              </div>
              <div className="flex flex-col gap-1 sm:flex-row sm:gap-3">
                <dt className="shrink-0 font-medium text-slate-600 sm:w-28">Auth header</dt>
                <dd className="font-mono text-xs text-slate-800">X-API-Key: &lt;their-key&gt;</dd>
              </div>
              <div className="flex flex-col gap-1 sm:flex-row sm:gap-3">
                <dt className="shrink-0 font-medium text-slate-600 sm:w-28">Example</dt>
                <dd className="font-mono text-xs text-slate-800 break-all">
                  GET {viewApiBase}/applications/MRR
                </dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-slate-400">
              Sample React integration: <code className="rounded bg-slate-100 px-1">examples/mrr-integration/</code>
            </p>
          </div>
        </div>
      </Card>

      {loading ? (
        <Card className="py-16 text-center text-sm text-slate-500">Loading API keys…</Card>
      ) : allKeys.length === 0 ? (
        <Card className="py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50">
            <Key size={28} className="text-violet-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800">No API keys yet</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
            Generate a read-only key for each application team that needs to embed the User Guide.
          </p>
          <Button onClick={openCreate} className="mt-6">
            <Plus size={16} />
            Generate First Key
          </Button>
        </Card>
      ) : (
        <Card padding={false}>
          <div className="border-b border-slate-200 px-6 py-3 text-sm text-slate-500">
            {activeKeys.length} active · {revokedKeys.length} revoked
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Key prefix</th>
                  <th className="px-6 py-3">Scope</th>
                  <th className="px-6 py-3">Created</th>
                  <th className="px-6 py-3">Last used</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allKeys.map((key) => (
                  <tr
                    key={key.id}
                    className={`hover:bg-slate-50/50 ${!key.isActive ? 'opacity-60' : ''}`}
                  >
                    <td className="px-6 py-4 font-medium text-slate-900">{key.name}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-600">
                      {key.keyPrefix}…
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {getAppLabel(key.applicationId)}
                    </td>
                    <td className="px-6 py-4 text-slate-500">{formatDate(key.createdAt)}</td>
                    <td className="px-6 py-4 text-slate-500">{formatDate(key.lastUsedAt)}</td>
                    <td className="px-6 py-4">
                      {key.isActive ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="default">Revoked</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {key.isActive ? (
                        <button
                          type="button"
                          onClick={() => setRevokeConfirm(key)}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={14} />
                          Revoke
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setCreatedKey(null)
        }}
        title={createdKey ? 'API Key Created' : 'Generate API Key'}
        size={createdKey ? 'lg' : 'md'}
      >
        {createdKey ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <AlertTriangle size={20} className="mt-0.5 shrink-0 text-amber-600" />
              <p className="text-sm text-amber-800">
                Copy this key now. It will <strong>not be shown again</strong>. Store it securely
                and share it only with the application developer.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-slate-500">
                API Key
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <code className="flex-1 break-all text-xs text-slate-800">{createdKey.apiKey}</code>
                <button
                  type="button"
                  onClick={() => copyText(createdKey.apiKey)}
                  className="shrink-0 rounded-lg bg-white p-2 text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100"
                >
                  {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 text-sm">
              <p className="font-medium text-slate-800">Give the developer:</p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-slate-600">
                <li>
                  Base URL: <code className="text-xs">{viewApiBase}</code>
                </li>
                <li>
                  Application code:{' '}
                  <code className="text-xs">
                    {form.applicationId
                      ? applications.find((a) => a.id === form.applicationId)?.code || '—'
                      : '(their app code, e.g. MRR)'}
                  </code>
                </li>
                <li>Header: X-API-Key: (key above)</li>
              </ul>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => {
                  setModalOpen(false)
                  setCreatedKey(null)
                }}
              >
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Key name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. MRR Production"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Scope (optional)
              </label>
              <select
                value={form.applicationId}
                onChange={(e) => setForm({ ...form, applicationId: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">All applications</option>
                {applications
                  .filter((a) => a.isActive)
                  .map((app) => (
                    <option key={app.id} value={app.id}>
                      {app.name} ({app.code || app.name})
                    </option>
                  ))}
              </select>
              <p className="mt-1 text-xs text-slate-500">
                Restrict this key to one application, or leave as all applications.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? 'Generating…' : 'Generate Key'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        isOpen={!!revokeConfirm}
        onClose={() => setRevokeConfirm(null)}
        title="Revoke API Key"
        size="sm"
      >
        <p className="text-sm text-slate-600">
          Revoke <strong>{revokeConfirm?.name}</strong>? Applications using this key will lose
          access immediately.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setRevokeConfirm(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => handleRevoke(revokeConfirm.id)}>
            Revoke Key
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default ApiKeys
