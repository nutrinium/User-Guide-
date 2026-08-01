import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Globe,
  Save,
  ChevronUp,
  ChevronDown,
} from 'lucide-react'
import { useGuideContext } from '../context/GuideContext'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { generateId } from '../utils/storage'

const emptySection = () => ({ id: generateId(), title: '', content: '', order: 0 })

function GuideEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { applications, modules, addGuide, updateGuide, getGuideById } = useGuideContext()
  const isEditing = Boolean(id)
  const existing = isEditing ? getGuideById(id) : null
  const activeApps = applications.filter((a) => a.isActive)

  const [form, setForm] = useState({
    applicationId: '',
    moduleId: '',
    title: '',
    description: '',
    status: 'draft',
    sections: [emptySection()],
  })

  useEffect(() => {
    if (existing) {
      setForm({
        applicationId: existing.applicationId || '',
        moduleId: existing.moduleId || '',
        title: existing.title,
        description: existing.description,
        status: existing.status,
        sections: existing.sections.length
          ? [...existing.sections].sort((a, b) => a.order - b.order)
          : [emptySection()],
      })
    } else if (activeApps.length > 0 && !form.applicationId) {
      setForm((f) => ({ ...f, applicationId: activeApps[0].id }))
    }
  }, [existing, activeApps])

  const appModules = form.applicationId
    ? modules.filter((m) => m.applicationId === form.applicationId && m.isActive)
    : []

  const updateSection = (index, field, value) => {
    setForm((f) => ({
      ...f,
      sections: f.sections.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    }))
  }

  const addSection = () => {
    setForm((f) => ({
      ...f,
      sections: [...f.sections, { ...emptySection(), order: f.sections.length }],
    }))
  }

  const removeSection = (index) => {
    if (form.sections.length <= 1) return
    setForm((f) => ({
      ...f,
      sections: f.sections.filter((_, i) => i !== index),
    }))
  }

  const moveSection = (index, direction) => {
    const newSections = [...form.sections]
    const target = index + direction
    if (target < 0 || target >= newSections.length) return
    ;[newSections[index], newSections[target]] = [newSections[target], newSections[index]]
    setForm((f) => ({
      ...f,
      sections: newSections.map((s, i) => ({ ...s, order: i })),
    }))
  }

  const handleSave = (publish = false) => {
    if (!form.applicationId || !form.title.trim()) return
    const payload = {
      ...form,
      moduleId: form.moduleId || '',
      status: publish ? 'published' : form.status,
      sections: form.sections
        .filter((s) => s.title.trim() || s.content.trim())
        .map((s, i) => ({ ...s, order: i })),
    }
    if (isEditing) {
      updateGuide(id, payload)
    } else {
      const created = addGuide(payload)
      navigate(`/guides/edit/${created.id}`, { replace: true })
      return
    }
    navigate('/guides')
  }

  if (activeApps.length === 0) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <h2 className="text-xl font-semibold text-slate-800">No applications available</h2>
        <p className="mt-2 text-sm text-slate-500">Create an application before adding guides.</p>
        <Button className="mt-6" onClick={() => navigate('/applications')}>
          Go to Applications
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[900px] space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/guides')}
            className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-slate-600"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {isEditing ? 'Edit Guide' : 'Create Guide'}
            </h1>
            <p className="text-sm text-slate-500">Build your user guide with dynamic sections</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleSave(false)}>
            <Save size={16} />
            Save Draft
          </Button>
          <Button onClick={() => handleSave(true)}>
            <Globe size={16} />
            Publish
          </Button>
        </div>
      </div>

      <Card>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Application *</label>
            <select
              value={form.applicationId}
              onChange={(e) =>
                setForm({ ...form, applicationId: e.target.value, moduleId: '' })
              }
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              {activeApps.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Module <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <select
              value={form.moduleId}
              onChange={(e) => setForm({ ...form, moduleId: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">No module — direct to application</option>
              {appModules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-400">
              Some applications skip modules and attach guides directly to the application.
            </p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Guide Title *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Getting Started with Inventory"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              placeholder="Brief overview of this guide"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Sections</h2>
          <Button variant="outline" size="sm" onClick={addSection}>
            <Plus size={14} />
            Add Section
          </Button>
        </div>

        {form.sections.map((section, index) => (
          <Card key={section.id} className="relative">
            <div className="mb-4 flex items-center gap-2">
              <GripVertical size={16} className="text-slate-300" />
              <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Section {index + 1}
              </span>
              <div className="ml-auto flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => moveSection(index, -1)}
                  disabled={index === 0}
                  className="rounded p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-30"
                >
                  <ChevronUp size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => moveSection(index, 1)}
                  disabled={index === form.sections.length - 1}
                  className="rounded p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-30"
                >
                  <ChevronDown size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => removeSection(index)}
                  disabled={form.sections.length <= 1}
                  className="rounded p-1 text-red-400 hover:bg-red-50 disabled:opacity-30"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                value={section.title}
                onChange={(e) => updateSection(index, 'title', e.target.value)}
                placeholder="Section title"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
              <textarea
                value={section.content}
                onChange={(e) => updateSection(index, 'content', e.target.value)}
                rows={6}
                placeholder="Write guide content here. Use plain text — line breaks are preserved."
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default GuideEditorPage
