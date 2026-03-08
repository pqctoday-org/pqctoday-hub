// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useCallback, useMemo, useRef } from 'react'
import { Eye, Edit3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ExportableArtifact } from './ExportableArtifact'
import { FilterDropdown } from '@/components/common/FilterDropdown'

export interface ArtifactField {
  id: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'checklist'
  placeholder?: string
  options?: { value: string; label: string }[]
  defaultValue?: string | string[]
}

export interface ArtifactSection {
  id: string
  title: string
  description?: string
  fields: ArtifactField[]
}

interface ArtifactBuilderProps {
  title: string
  description?: string
  sections: ArtifactSection[]
  onExport?: (data: Record<string, Record<string, string | string[]>>) => void
  exportFilename?: string
  renderPreview?: (data: Record<string, Record<string, string | string[]>>) => string
}

export const ArtifactBuilder: React.FC<ArtifactBuilderProps> = ({
  title,
  description,
  sections,
  onExport,
  exportFilename = 'artifact',
  renderPreview,
}) => {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')
  const [formData, setFormData] = useState<Record<string, Record<string, string | string[]>>>(
    () => {
      const initial: Record<string, Record<string, string | string[]>> = {}
      for (const section of sections) {
        initial[section.id] = {}
        for (const field of section.fields) {
          initial[section.id][field.id] =
            field.defaultValue ?? (field.type === 'checklist' ? [] : '')
        }
      }
      return initial
    }
  )

  const updateField = useCallback(
    (sectionId: string, fieldId: string, value: string | string[]) => {
      setFormData((prev) => ({
        ...prev,
        [sectionId]: {
          ...prev[sectionId],
          [fieldId]: value,
        },
      }))
    },
    []
  )

  const toggleChecklistItem = useCallback((sectionId: string, fieldId: string, item: string) => {
    setFormData((prev) => {
      const current = prev[sectionId]?.[fieldId]
      const arr = Array.isArray(current) ? current : []
      const updated = arr.includes(item) ? arr.filter((v) => v !== item) : [...arr, item]
      return {
        ...prev,
        [sectionId]: { ...prev[sectionId], [fieldId]: updated },
      }
    })
  }, [])

  const exportedRef = useRef(false)

  // Reset the save guard when switching back to edit mode
  const handleSetMode = useCallback((m: 'edit' | 'preview') => {
    if (m === 'edit') exportedRef.current = false
    setMode(m)
  }, [])

  const handleExport = useCallback(() => {
    if (onExport && !exportedRef.current) {
      exportedRef.current = true
      onExport(formData)
    }
  }, [onExport, formData])

  const exportMarkdown = useMemo(() => {
    if (renderPreview) return renderPreview(formData)

    let md = `# ${title}\n\n`
    if (description) md += `${description}\n\n`
    md += `Generated: ${new Date().toLocaleDateString()}\n\n---\n\n`

    for (const section of sections) {
      md += `## ${section.title}\n\n`
      if (section.description) md += `${section.description}\n\n`
      const sectionData = formData[section.id] || {}
      for (const field of section.fields) {
        const value = sectionData[field.id]
        if (field.type === 'checklist' && Array.isArray(value)) {
          md += `### ${field.label}\n\n`
          for (const opt of field.options ?? []) {
            const checked = value.includes(opt.value) ? 'x' : ' '
            md += `- [${checked}] ${opt.label}\n`
          }
          md += '\n'
        } else {
          md += `**${field.label}:** ${value || '_Not specified_'}\n\n`
        }
      }
    }
    return md
  }, [formData, title, description, sections, renderPreview])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant={mode === 'edit' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => handleSetMode('edit')}
        >
          <Edit3 size={14} />
          <span className="ml-1.5">Edit</span>
        </Button>
        <Button
          variant={mode === 'preview' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => handleSetMode('preview')}
        >
          <Eye size={14} />
          <span className="ml-1.5">Preview</span>
        </Button>
      </div>

      {mode === 'edit' ? (
        <div className="space-y-8">
          {sections.map((section) => (
            <div key={section.id} className="glass-panel p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">{section.title}</h3>
                {section.description && (
                  <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
                )}
              </div>
              <div className="space-y-4">
                {section.fields.map((field) => (
                  <div key={field.id}>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      {field.label}
                    </label>
                    {field.type === 'text' && (
                      <input
                        type="text"
                        className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder={field.placeholder}
                        value={(formData[section.id]?.[field.id] as string) || ''}
                        onChange={(e) => updateField(section.id, field.id, e.target.value)}
                      />
                    )}
                    {field.type === 'textarea' && (
                      <textarea
                        className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[100px] resize-y"
                        placeholder={field.placeholder}
                        value={(formData[section.id]?.[field.id] as string) || ''}
                        onChange={(e) => updateField(section.id, field.id, e.target.value)}
                      />
                    )}
                    {field.type === 'select' && (
                      <FilterDropdown
                        noContainer
                        selectedId={(formData[section.id]?.[field.id] as string) || 'All'}
                        onSelect={(id) => updateField(section.id, field.id, id === 'All' ? '' : id)}
                        defaultLabel={field.placeholder || 'Select...'}
                        items={(field.options ?? []).map((opt) => ({
                          id: opt.value,
                          label: opt.label,
                        }))}
                      />
                    )}
                    {field.type === 'checklist' && (
                      <div className="space-y-2 mt-1">
                        {field.options?.map((opt) => {
                          const checked = (
                            (formData[section.id]?.[field.id] as string[]) || []
                          ).includes(opt.value)
                          return (
                            <label
                              key={opt.value}
                              className="flex items-center gap-2 cursor-pointer text-sm text-foreground"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() =>
                                  toggleChecklistItem(section.id, field.id, opt.value)
                                }
                                className="rounded border-input"
                              />
                              {opt.label}
                            </label>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <ExportableArtifact
          title={title}
          exportData={exportMarkdown}
          filename={exportFilename}
          formats={['markdown', 'json']}
          onExport={handleExport}
        >
          <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap font-mono text-sm text-foreground bg-muted/50 rounded-lg p-4 max-h-[600px] overflow-y-auto">
            {exportMarkdown}
          </div>
        </ExportableArtifact>
      )}
    </div>
  )
}
