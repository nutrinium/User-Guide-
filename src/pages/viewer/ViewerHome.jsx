import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, LayoutGrid, Search, BookOpen, Layers } from 'lucide-react'
import { useGuideContext } from '../../context/GuideContext'
import { DynamicIcon } from '../../utils/icons'
import { getAppEntryPath } from '../../utils/viewerNavigation'

function ViewerHome() {
  const ctx = useGuideContext()
  const { applications, guides, getModulesByApplication } = ctx
  const [search, setSearch] = useState('')

  const activeApps = applications.filter((a) => a.isActive)

  const appsWithMeta = useMemo(
    () =>
      activeApps.map((app) => {
        const appModules = getModulesByApplication(app.id).filter((m) => m.isActive)
        const publishedCount = guides.filter(
          (g) =>
            g.status === 'published' &&
            (g.applicationId === app.id ||
              appModules.some((m) => m.id === g.moduleId))
        ).length
        return {
          app,
          modules: appModules,
          moduleCount: appModules.length,
          publishedCount,
        }
      }),
    [activeApps, guides, getModulesByApplication]
  )

  const query = search.trim().toLowerCase()
  const filtered = appsWithMeta.filter(({ app, modules }) => {
    if (!query) return true
    if (app.name.toLowerCase().includes(query)) return true
    if (app.description?.toLowerCase().includes(query)) return true
    return modules.some((m) => m.name.toLowerCase().includes(query))
  })

  const totalGuides = appsWithMeta.reduce((sum, { publishedCount }) => sum + publishedCount, 0)
  const totalModules = appsWithMeta.reduce((sum, { moduleCount }) => sum + moduleCount, 0)

  return (
    <div className="min-h-[calc(100vh-5rem)] sm:min-h-[calc(100vh-6rem)]">
      {/* Branded intro strip */}
      <section className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div
          className="h-1 w-full"
          style={{
            background: 'linear-gradient(90deg, #FF6B2C, #E91E8C, #7B2FF7, #2563EB)',
          }}
        />
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
                Choose an application to get started
              </h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Browse published user guides organized by application and module.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <MiniStat icon={LayoutGrid} label="Applications" value={activeApps.length} />
                <MiniStat icon={Layers} label="Modules" value={totalModules} />
                <MiniStat icon={BookOpen} label="Guides" value={totalGuides} />
              </div>
            </div>

            <div className="relative w-full lg:max-w-sm">
              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search applications or modules..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-11 pr-4 text-sm text-slate-900 outline-none transition-all focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-500 dark:focus:bg-slate-900"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Application grid */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Applications</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {filtered.length} of {activeApps.length} available
            </p>
          </div>
          {query && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Clear search
            </button>
          )}
        </div>

        {activeApps.length === 0 ? (
          <EmptyCoverState
            icon={LayoutGrid}
            title="No applications yet"
            description="Published applications will appear here once an admin adds them."
          />
        ) : filtered.length === 0 ? (
          <EmptyCoverState
            icon={Search}
            title="No matches found"
            description={`Nothing matched "${search}". Try another name.`}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(({ app, modules, moduleCount, publishedCount }) => (
              <ApplicationCard
                key={app.id}
                app={app}
                modules={modules}
                moduleCount={moduleCount}
                publishedCount={publishedCount}
                entryPath={getAppEntryPath(app.id, ctx)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function MiniStat({ icon: Icon, label, value }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 dark:border-slate-700 dark:bg-slate-800/60">
      <Icon size={14} className="text-blue-600 dark:text-blue-400" />
      <span className="text-sm font-bold text-slate-900 dark:text-white">{value}</span>
      <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
    </div>
  )
}

function ApplicationCard({ app, modules, moduleCount, publishedCount, entryPath }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
      <div className="relative p-4 pb-3">
        <div
          className="absolute inset-x-0 top-0 h-1 opacity-80"
          style={{
            background: `linear-gradient(90deg, ${app.color}, #2563EB)`,
          }}
        />
        <div className="flex items-start gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${app.color}18` }}
          >
            <DynamicIcon name={app.icon} size={22} style={{ color: app.color }} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-bold text-slate-900 dark:text-white">{app.name}</h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {moduleCount} module{moduleCount !== 1 ? 's' : ''}
              {publishedCount > 0 && ` · ${publishedCount} guide${publishedCount !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        {app.description && (
          <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            {app.description}
          </p>
        )}

        {modules.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {modules.slice(0, 2).map((mod) => (
              <span
                key={mod.id}
                className="inline-flex max-w-full items-center gap-1 truncate rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              >
                <DynamicIcon name={mod.icon} size={10} style={{ color: mod.color }} />
                <span className="truncate">{mod.name}</span>
              </span>
            ))}
            {modules.length > 2 && (
              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-500 dark:bg-slate-800">
                +{modules.length - 2}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="mt-auto border-t border-slate-100 p-3 dark:border-slate-800">
        <Link
          to={entryPath}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-slate-900 py-2.5 text-xs font-semibold text-white transition-all hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 sm:text-sm"
        >
          Open Guide
          <ArrowRight size={14} />
        </Link>
      </div>
    </article>
  )
}

function EmptyCoverState({ icon: Icon, title, description }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900/50">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
        <Icon size={24} className="text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">{description}</p>
    </div>
  )
}

export default ViewerHome
