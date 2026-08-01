import { Link } from 'react-router-dom'
import {
  LayoutGrid,
  Video,
  Image,
  Link2,
  Plus,
  FolderOpen,
  BookOpen,
  FileCheck,
} from 'lucide-react'
import { useGuideContext } from '../context/GuideContext'
import Card from '../components/ui/Card'
import StatCard from '../components/ui/StatCard'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import { DynamicIcon } from '../utils/icons'

function Dashboard() {
  const { stats, modules, guides, applications, getModuleById } = useGuideContext()

  const recentGuides = [...guides]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 6)

  const quickActions = [
    { label: 'Add New Module', icon: Plus, color: 'bg-emerald-500', to: '/modules' },
    { label: 'Create Guide', icon: BookOpen, color: 'bg-violet-500', to: '/guides' },
    { label: 'View Modules', icon: FolderOpen, color: 'bg-blue-600', to: '/modules' },
    { label: 'View Guides', icon: FileCheck, color: 'bg-teal-600', to: '/guides' },
  ]

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Applications"
          value={stats.totalApplications}
          icon={LayoutGrid}
          iconBg="#eff6ff"
          iconColor="#2563eb"
        />
        <StatCard
          title="Total Videos"
          value={stats.totalVideos}
          icon={Video}
          iconBg="#fef2f2"
          iconColor="#dc2626"
        />
        <StatCard
          title="Total Images"
          value={stats.totalPhotos}
          icon={Image}
          iconBg="#ecfdf5"
          iconColor="#059669"
        />
        <StatCard
          title="Total Linked Documents"
          value={stats.totalDocuments}
          icon={Link2}
          iconBg="#fefce8"
          iconColor="#ca8a04"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <h3 className="mb-4 text-base font-semibold text-slate-800">Quick Actions</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {quickActions.map(({ label, icon: Icon, color, to }) => (
              <Link
                key={label}
                to={to}
                className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium text-white transition-opacity hover:opacity-90 ${color}`}
              >
                <Icon size={18} />
                {label}
              </Link>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-1">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-800">Recent Guides</h3>
            <Link to="/guides" className="text-xs font-medium text-blue-600 hover:underline">
              View all
            </Link>
          </div>
          {recentGuides.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">No guides yet</p>
          ) : (
            <ul className="space-y-3">
              {recentGuides.map((guide) => {
                const mod = guide.moduleId ? getModuleById(guide.moduleId) : null
                const app = mod
                  ? null
                  : applications.find((a) => a.id === guide.applicationId)
                const label = mod?.name || app?.name || 'Unknown'
                const dotColor = mod?.color || app?.color || '#2563eb'
                return (
                  <li
                    key={guide.id}
                    className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2.5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: dotColor }}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800">{guide.title}</p>
                        <p className="truncate text-xs text-slate-400">{label}</p>
                      </div>
                    </div>
                    <Badge variant={guide.status === 'published' ? 'success' : 'draft'}>
                      {guide.status === 'published' ? 'Published' : 'Draft'}
                    </Badge>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        <Card className="lg:col-span-1">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-800">Modules</h3>
            <Link to="/modules" className="text-xs font-medium text-blue-600 hover:underline">
              Manage
            </Link>
          </div>
          {modules.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-slate-400">No modules yet</p>
              <Link to="/modules">
                <Button variant="outline" size="sm" className="mt-3">
                  <Plus size={14} />
                  Add Module
                </Button>
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {modules.slice(0, 6).map((mod) => (
                <li
                  key={mod.id}
                  className="flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-2.5"
                >
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${mod.color}15` }}
                  >
                    <DynamicIcon name={mod.icon} size={18} style={{ color: mod.color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{mod.name}</p>
                    <p className="truncate text-xs text-slate-400">{mod.description || '—'}</p>
                  </div>
                  <Badge variant={mod.isActive ? 'success' : 'draft'}>
                    {mod.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}

export default Dashboard
