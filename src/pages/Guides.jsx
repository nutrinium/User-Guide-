import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2, Search, Globe, FilePen } from 'lucide-react'
import { useGuideContext } from '../context/GuideContext'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import { DynamicIcon } from '../utils/icons'

function GuideCard({ guide, mod, app, onTogglePublish, onDelete }) {
  const visual = mod || app
  return (
    <Card>
      <div className="flex items-start gap-4">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${visual?.color || '#2563eb'}15` }}
        >
          <DynamicIcon
            name={visual?.icon || 'FileText'}
            size={22}
            style={{ color: visual?.color || '#2563eb' }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-slate-900">{guide.title}</h3>
            <Badge variant={guide.status === 'published' ? 'success' : 'draft'}>
              {guide.status === 'published' ? 'Published' : 'Draft'}
            </Badge>
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-slate-500">
            {guide.description || 'No description'}
          </p>
          <p className="mt-3 text-xs text-slate-400">
            {guide.sections.length} section{guide.sections.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
        <Link to={`/guides/edit/${guide.id}`}>
          <Button variant="outline" size="sm">
            <Pencil size={14} />
            Edit
          </Button>
        </Link>
        <Button variant="outline" size="sm" onClick={() => onTogglePublish(guide)}>
          {guide.status === 'published' ? (
            <>
              <FilePen size={14} />
              Unpublish
            </>
          ) : (
            <>
              <Globe size={14} />
              Publish
            </>
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
          onClick={() => onDelete(guide)}
        >
          <Trash2 size={14} />
        </Button>
      </div>
    </Card>
  )
}

function Guides() {
  const {
    applications,
    modules,
    guides,
    deleteGuide,
    updateGuide,
    getModuleById,
    getModulesByApplication,
    getApplicationById,
    getGuideApplication,
  } = useGuideContext()

  const [search, setSearch] = useState('')
  const [filterApp, setFilterApp] = useState('all')
  const [filterModule, setFilterModule] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const filtered = guides.filter((g) => {
    const mod = g.moduleId ? getModuleById(g.moduleId) : null
    const app = mod ? getApplicationById(mod.applicationId) : getApplicationById(g.applicationId)
    const matchSearch =
      g.title.toLowerCase().includes(search.toLowerCase()) ||
      g.description.toLowerCase().includes(search.toLowerCase()) ||
      mod?.name.toLowerCase().includes(search.toLowerCase()) ||
      app?.name.toLowerCase().includes(search.toLowerCase())
    const guideAppId = mod?.applicationId || g.applicationId
    const matchApp = filterApp === 'all' || guideAppId === filterApp
    const matchModule =
      filterModule === 'all' ||
      (filterModule === 'direct' ? !g.moduleId : g.moduleId === filterModule)
    const matchStatus = filterStatus === 'all' || g.status === filterStatus
    return matchSearch && matchApp && matchModule && matchStatus
  })

  const activeApps = applications.filter((a) => a.isActive)

  const grouped = activeApps
    .map((app) => {
      const appModules = getModulesByApplication(app.id).filter((mod) => {
        if (filterModule !== 'all' && mod.id !== filterModule) return false
        return true
      })
      return {
        app,
        directGuides: filtered.filter((g) => g.applicationId === app.id && !g.moduleId),
        modules: appModules
          .map((mod) => ({
            mod,
            guides: filtered.filter((g) => g.moduleId === mod.id),
          }))
          .filter((m) => m.guides.length > 0 || filterModule === m.mod.id),
      }
    })
    .filter((g) => {
      if (filterApp !== 'all' && g.app.id !== filterApp) return false
      const hasContent =
        g.directGuides.length > 0 || g.modules.some((m) => m.guides.length > 0)
      return hasContent || filterApp === g.app.id
    })

  const unassignedGuides = filtered.filter((g) => {
    if (g.moduleId) {
      const mod = getModuleById(g.moduleId)
      return !mod?.applicationId
    }
    return !g.applicationId
  })

  const handleDelete = async (id) => {
    await deleteGuide(id)
    setDeleteConfirm(null)
  }

  const togglePublish = async (guide) => {
    await updateGuide(guide.id, {
      status: guide.status === 'published' ? 'draft' : 'published',
    })
  }

  const filterModules =
    filterApp === 'all' ? modules : modules.filter((m) => m.applicationId === filterApp)

  const totalGuides = filtered.length

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Guide Management</h1>
          <p className="mt-1 text-sm text-slate-500">
            Guides organized by application and module
          </p>
        </div>
        <Link to="/guides/new">
          <Button>
            <Plus size={16} />
            Create Guide
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        <div className="relative max-w-md flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search guides, modules, applications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <select
          value={filterApp}
          onChange={(e) => {
            setFilterApp(e.target.value)
            setFilterModule('all')
          }}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-400"
        >
          <option value="all">All Applications</option>
          {applications.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <select
          value={filterModule}
          onChange={(e) => setFilterModule(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-400"
        >
          <option value="all">All Modules</option>
          <option value="direct">Direct to application (no module)</option>
          {filterModules.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-400"
        >
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {activeApps.length === 0 ? (
        <Card className="py-16 text-center">
          <h3 className="text-lg font-semibold text-slate-800">Create an application first</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
            Guides belong to an application. Modules are optional for some applications.
          </p>
          <Link to="/applications">
            <Button className="mt-6">
              <Plus size={16} />
              Add Application
            </Button>
          </Link>
        </Card>
      ) : totalGuides === 0 && unassignedGuides.length === 0 ? (
        <Card className="py-16 text-center">
          <h3 className="text-lg font-semibold text-slate-800">No guides found</h3>
          <p className="mt-2 text-sm text-slate-500">Create your first user guide to get started.</p>
          <Link to="/guides/new">
            <Button className="mt-6">
              <Plus size={16} />
              Create Guide
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-10">
          {grouped.map(({ app, directGuides, modules: appModules }) => {
            const totalAppGuides =
              directGuides.length +
              appModules.reduce((sum, m) => sum + m.guides.length, 0)
            return (
            <section key={app.id}>
              <div className="mb-5 flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${app.color}15` }}
                >
                  <DynamicIcon name={app.icon} size={20} style={{ color: app.color }} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{app.name}</h2>
                  <p className="text-xs text-slate-400">
                    {totalAppGuides} guide{totalAppGuides !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <div className="space-y-6 pl-2 sm:pl-4">
                {directGuides.length > 0 && (
                  <div>
                    <div className="mb-3 flex items-center gap-2 border-l-2 border-emerald-200 pl-3">
                      <DynamicIcon name={app.icon} size={16} style={{ color: app.color }} />
                      <h3 className="font-semibold text-slate-800">Application Guides</h3>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                        {directGuides.length}
                      </span>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pl-2 sm:pl-4">
                      {directGuides.map((guide) => (
                        <GuideCard
                          key={guide.id}
                          guide={guide}
                          app={app}
                          onTogglePublish={togglePublish}
                          onDelete={setDeleteConfirm}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {appModules.map(({ mod, guides: modGuides }) => (
                  <div key={mod.id}>
                    <div className="mb-3 flex items-center gap-2 border-l-2 border-blue-200 pl-3">
                      <DynamicIcon name={mod.icon} size={16} style={{ color: mod.color }} />
                      <h3 className="font-semibold text-slate-800">{mod.name}</h3>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                        {modGuides.length}
                      </span>
                    </div>

                    {modGuides.length === 0 ? (
                      <p className="pl-5 text-sm text-slate-400">No guides for this module</p>
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pl-2 sm:pl-4">
                        {modGuides.map((guide) => (
                          <GuideCard
                            key={guide.id}
                            guide={guide}
                            mod={mod}
                            onTogglePublish={togglePublish}
                            onDelete={setDeleteConfirm}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )})}

          {unassignedGuides.length > 0 && (
            <section>
              <h2 className="mb-4 text-lg font-bold text-slate-900">Unassigned</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {unassignedGuides.map((guide) => {
                  const mod = guide.moduleId ? getModuleById(guide.moduleId) : null
                  const app = getGuideApplication(guide)
                  return (
                    <GuideCard
                      key={guide.id}
                      guide={guide}
                      mod={mod}
                      app={app}
                      onTogglePublish={togglePublish}
                      onDelete={setDeleteConfirm}
                    />
                  )
                })}
              </div>
            </section>
          )}
        </div>
      )}

      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Guide"
        size="sm"
      >
        <p className="text-sm text-slate-600">
          Delete <strong>{deleteConfirm?.title}</strong>? This cannot be undone.
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

export default Guides
