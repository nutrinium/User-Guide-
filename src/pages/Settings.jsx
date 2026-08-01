import { useState } from 'react'
import { Database, Trash2, Download, Upload, AlertTriangle } from 'lucide-react'
import { useGuideContext } from '../context/GuideContext'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import { loadData, saveData, DEFAULT_DATA } from '../utils/storage'

function Settings() {
  const { modules, guides, stats } = useGuideContext()
  const [resetConfirm, setResetConfirm] = useState(false)
  const [importError, setImportError] = useState('')

  const handleExport = () => {
    const data = loadData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `user-guides-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportError('')
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result)
        if (!Array.isArray(parsed.modules) || !Array.isArray(parsed.guides)) {
          throw new Error('Invalid format')
        }
        saveData({
          applications: Array.isArray(parsed.applications) ? parsed.applications : [],
          modules: parsed.modules,
          guides: parsed.guides,
          media: Array.isArray(parsed.media) ? parsed.media : [],
        })
        window.location.reload()
      } catch {
        setImportError('Invalid JSON file. Please upload a valid export file.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleReset = () => {
    saveData(DEFAULT_DATA)
    window.location.reload()
  }

  return (
    <div className="mx-auto max-w-[800px] space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Manage application data and preferences</p>
      </div>

      <Card>
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
            <Database size={20} className="text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-800">Data Overview</h3>
            <p className="mt-1 text-sm text-slate-500">
              All data is stored locally in your browser. No backend required.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-lg bg-slate-50 p-3 text-center">
                <p className="text-2xl font-bold text-slate-900">{stats.totalModules}</p>
                <p className="text-xs text-slate-500">Modules</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3 text-center">
                <p className="text-2xl font-bold text-slate-900">{stats.totalGuides}</p>
                <p className="text-xs text-slate-500">Guides</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3 text-center">
                <p className="text-2xl font-bold text-emerald-600">{stats.publishedGuides}</p>
                <p className="text-xs text-slate-500">Published</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3 text-center">
                <p className="text-2xl font-bold text-amber-600">{stats.draftGuides}</p>
                <p className="text-xs text-slate-500">Drafts</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold text-slate-800">Backup & Restore</h3>
        <p className="mt-1 text-sm text-slate-500">
          Export your modules and guides as JSON, or import a previous backup.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant="outline" onClick={handleExport}>
            <Download size={16} />
            Export Data
          </Button>
          <label className="inline-flex cursor-pointer">
            <span className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
              <Upload size={16} />
              Import Data
            </span>
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>
        {importError && (
          <p className="mt-3 text-sm text-red-600">{importError}</p>
        )}
      </Card>

      <Card className="border-red-100">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
            <AlertTriangle size={20} className="text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-800">Danger Zone</h3>
            <p className="mt-1 text-sm text-slate-500">
              Reset all modules and guides. This action cannot be undone.
            </p>
            <Button
              variant="danger"
              size="sm"
              className="mt-4"
              onClick={() => setResetConfirm(true)}
            >
              <Trash2 size={14} />
              Reset All Data
            </Button>
          </div>
        </div>
      </Card>

      <Modal
        isOpen={resetConfirm}
        onClose={() => setResetConfirm(false)}
        title="Reset All Data"
        size="sm"
      >
        <p className="text-sm text-slate-600">
          This will permanently delete all {modules.length} modules and {guides.length} guides.
          Are you sure?
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setResetConfirm(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleReset}>
            Reset Everything
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default Settings
