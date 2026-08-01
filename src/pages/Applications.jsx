import { useState } from 'react'
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

const emptyForm = { name: '', description: '', icon: 'LayoutGrid', color: '#2563eb' }

function Applications() {
  const {
    applications,
    addApplication,
    updateApplication,
    deleteApplication,
  } = useGuideContext()

  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const filtered = applications.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.description.toLowerCase().includes(search.toLowerCase())
  )

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (app) => {
    setEditing(app)
    setForm({
      name: app.name,
      description: app.description,
      icon: app.icon,
      color: app.color,
    })
    setModalOpen(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    if (editing) {
      updateApplication(editing.id, form)
    } else {
      addApplication(form)
    }
    setModalOpen(false)
  }

  const handleDelete = (id) => {
    deleteApplication(id)
    setDeleteConfirm(null)
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Application Management</h1>
          <p className="mt-1 text-sm text-slate-500">
            Create applications and organize multiple modules under each one
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} />
          Add New Application
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search applications..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
            <Plus size={28} className="text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800">No applications yet</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
            Create an application first — e.g. ERP, HR Portal, CRM — then add modules under it.
          </p>
          <Button onClick={openCreate} className="mt-6">
            <Plus size={16} />
            Create First Application
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((app) => (
              <Card key={app.id}>
                <div className="flex items-start gap-4">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${app.color}15` }}
                  >
                    <DynamicIcon name={app.icon} size={22} style={{ color: app.color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-slate-900">{app.name}</h3>
                      <Badge variant={app.isActive ? 'success' : 'draft'}>
                        {app.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                      {app.description || 'No description'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4">
                  <Button variant="outline" size="sm" onClick={() => openEdit(app)}>
                    <Pencil size={14} />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updateApplication(app.id, { isActive: !app.isActive })}
                  >
                    {app.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto text-red-500 hover:bg-red-50 hover:text-red-600"
                    onClick={() => setDeleteConfirm(app)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Application' : 'Add New Application'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Application Name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. ERP System, HR Portal, CRM"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Brief description of this application"
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
            <Button type="submit">{editing ? 'Save Changes' : 'Create Application'}</Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Application"
        size="sm"
      >
        <p className="text-sm text-slate-600">
          Delete <strong>{deleteConfirm?.name}</strong> and all its modules, guides, and media?
          This cannot be undone.
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

export default Applications
