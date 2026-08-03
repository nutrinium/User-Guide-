import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import { useGuideContext } from '../context/GuideContext'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import { DynamicIcon, ICON_OPTIONS } from '../utils/icons'

const COLOR_OPTIONS = [
  '#2563eb', '#059669', '#7c3aed', '#dc2626', '#ea580c',
  '#0891b2', '#be185d', '#4f46e5', '#0d9488', '#ca8a04',
]

const emptyForm = {
  applicationId: '',
  name: '',
  description: '',
  icon: 'FileText',
  color: '#2563eb',
}

function Modules() {
  const {
    applications,
    modules,
    guides,
    addModule,
    updateModule,
    deleteModule,
    getApplicationById,
  } = useGuideContext()

  const [searchParams] = useSearchParams()
  const appFilter = searchParams.get('application') || 'all'

  const [search, setSearch] = useState('')
  const [filterApp, setFilterApp] = useState(appFilter)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  useEffect(() => {
    setFilterApp(appFilter)
  }, [appFilter])

  const activeApps = applications.filter((a) => a.isActive)

  const filtered = modules.filter((m) => {
    const app = getApplicationById(m.applicationId)
    const matchSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.description.toLowerCase().includes(search.toLowerCase()) ||
      app?.name.toLowerCase().includes(search.toLowerCase())
    const matchApp = filterApp === 'all' || m.applicationId === filterApp
    return matchSearch && matchApp
  })

  const openCreate = () => {
    setEditing(null)
    setForm({
      ...emptyForm,
      applicationId: filterApp !== 'all' ? filterApp : activeApps[0]?.id || '',
    })
    setModalOpen(true)
  }

  const openEdit = (mod) => {
    setEditing(mod)
    setForm({
      applicationId: mod.applicationId || '',
      name: mod.name,
      description: mod.description,
      icon: mod.icon,
      color: mod.color,
    })
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.applicationId) return
    if (editing) {
      await updateModule(editing.id, form)
    } else {
      await addModule(form)
    }
    setModalOpen(false)
  }

  const handleDelete = async (id) => {
    await deleteModule(id)
    setDeleteConfirm(null)
  }

  const getGuideCount = (moduleId) => guides.filter((g) => g.moduleId === moduleId).length

  const groupedByApp = activeApps
    .map((app) => ({
      app,
      modules: filtered.filter((m) => m.applicationId === app.id),
    }))
    .filter((g) => g.modules.length > 0 || filterApp === g.app.id)

  const unassigned = filtered.filter((m) => !m.applicationId)

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Module Management</h1>
          <p className="mt-1 text-sm text-slate-500">
            Add modules under each application — Inventory, HRMS, CRM, etc.
          </p>
        </div>
        <Button onClick={openCreate} disabled={activeApps.length === 0}>
          <Plus size={16} />
          Add New Module
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-md flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search modules..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <select
          value={filterApp}
          onChange={(e) => setFilterApp(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-400"
        >
          <option value="all">All Applications</option>
          {applications.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      {activeApps.length === 0 ? (
        <Card className="py-16 text-center">
          <h3 className="text-lg font-semibold text-slate-800">Create an application first</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
            Modules belong to an application. Add an application before creating modules.
          </p>
          <Link to="/applications">
            <Button className="mt-6">
              <Plus size={16} />
              Add Application
            </Button>
          </Link>
        </Card>
      ) : filtered.length === 0 && unassigned.length === 0 ? (
        <Card className="py-16 text-center">
          <h3 className="text-lg font-semibold text-slate-800">No modules yet</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
            Add modules under your applications.
          </p>
          <Button onClick={openCreate} className="mt-6">
            <Plus size={16} />
            Create First Module
          </Button>
        </Card>
      ) : (
        <div className="space-y-8">
          {groupedByApp.map(({ app, modules: appModules }) =>
            appModules.length === 0 && filterApp !== 'all' && filterApp !== app.id ? null : (
              <div key={app.id}>
                <div className="mb-4 flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${app.color}15` }}
                  >
                    <DynamicIcon name={app.icon} size={18} style={{ color: app.color }} />
                  </div>
                  <div>
                    <h2 className="font-semibold text-slate-900">{app.name}</h2>
                    <p className="text-xs text-slate-400">
                      {appModules.length} module{appModules.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                {appModules.length === 0 ? (
                  <Card className="py-8 text-center">
                    <p className="text-sm text-slate-400">No modules in this application</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => {
                        setFilterApp(app.id)
                        openCreate()
                      }}
                    >
                      <Plus size={14} />
                      Add Module
                    </Button>
                  </Card>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {appModules.map((mod) => (
                      <Card key={mod.id}>
                        <div className="flex items-start gap-4">
                          <div
                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                            style={{ backgroundColor: `${mod.color}15` }}
                          >
                            <DynamicIcon name={mod.icon} size={22} style={{ color: mod.color }} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-semibold text-slate-900">{mod.name}</h3>
                              <Badge variant={mod.isActive ? 'success' : 'draft'}>
                                {mod.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                            <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                              {mod.description || 'No description'}
                            </p>
                            <p className="mt-3 text-xs text-slate-400">
                              {getGuideCount(mod.id)} guide{getGuideCount(mod.id) !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4">
                          <Button variant="outline" size="sm" onClick={() => openEdit(mod)}>
                            <Pencil size={14} />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateModule(mod.id, { isActive: !mod.isActive })}
                          >
                            {mod.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-auto text-red-500 hover:bg-red-50 hover:text-red-600"
                            onClick={() => setDeleteConfirm(mod)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )
          )}

          {unassigned.length > 0 && filterApp === 'all' && (
            <div>
              <h2 className="mb-4 font-semibold text-slate-900">Unassigned Modules</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {unassigned.map((mod) => (
                  <Card key={mod.id}>
                    <div className="flex items-start gap-4">
                      <div
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                        style={{ backgroundColor: `${mod.color}15` }}
                      >
                        <DynamicIcon name={mod.icon} size={22} style={{ color: mod.color }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-slate-900">{mod.name}</h3>
                        <p className="mt-1 text-xs text-amber-600">No application assigned</p>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
                      <Button variant="outline" size="sm" onClick={() => openEdit(mod)}>
                        <Pencil size={14} />
                        Edit
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Module' : 'Add New Module'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Application *</label>
            <select
              required
              value={form.applicationId}
              onChange={(e) => setForm({ ...form, applicationId: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
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
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Module Name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Inventory, HRMS, CRM, Payroll"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Brief description of this module"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Icon</label>
            <div className="grid max-h-32 grid-cols-8 gap-2 overflow-y-auto rounded-xl border border-slate-200 p-3">
              {ICON_OPTIONS.map((iconName) => (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => setForm({ ...form, icon: iconName })}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                    form.icon === iconName
                      ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-400'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <DynamicIcon name={iconName} size={18} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Color</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm({ ...form, color })}
                  className={`h-8 w-8 rounded-full transition-transform ${
                    form.color === color ? 'scale-110 ring-2 ring-offset-2 ring-slate-400' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">{editing ? 'Save Changes' : 'Create Module'}</Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Module"
        size="sm"
      >
        <p className="text-sm text-slate-600">
          Delete <strong>{deleteConfirm?.name}</strong> and all its guides? This cannot be undone.
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

export default Modules
