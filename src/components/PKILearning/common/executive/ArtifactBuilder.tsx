// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useCallback, useMemo } from 'react'
import { Eye, Edit3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ExportableArtifact } from './ExportableArtifact'
import { CompleteStepAction } from '../CompleteStepAction'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { isAutoRunFillActive } from '@/components/Simulation/autorun/autoRunFill'
import { MarkdownView } from '@/components/ui/MarkdownView'

export interface ArtifactField {
  id: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'checklist' | 'date'
  placeholder?: string
  options?: { value: string; label: string }[]
  defaultValue?: string | string[]
  /** Short explanatory text rendered under the field — e.g. why a value is pre-filled. */
  helperText?: string
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
  /** Structured CSV builder for the `.csv` export (RFC-4180 rows, not the markdown
   *  body). Mirrors `renderPreview` — called with the live form data whenever
   *  the `csv` format is offered. Audit C5. */
  renderCsv?: (data: Record<string, Record<string, string | string[]>>) => string
  /** Export formats offered on the preview action bar. Defaults to `['markdown']`.
   *  Artifacts with rich narrative structure (e.g., Board Pitch) can opt-in to
   *  `'pptx'` for a slide deck, or `'json'` for raw structured data. */
  exportFormats?: ('markdown' | 'json' | 'csv' | 'pptx' | 'docx' | 'pdf')[]
  /** Forward to ExportableArtifact — render PDF in A4 landscape for wide tables. Audit M4. */
  wideTable?: boolean
  /** Auto-run only: demo values overlaid on field defaults when a playthrough is active
   *  (keyed sectionId → fieldId). Ignored in normal manual use. */
  demoFill?: Record<string, Record<string, string | string[]>>
  /** Restore a previously-saved form snapshot (e.g. from `useSavedArtifactInputs`).
   *  Takes priority over `demoFill` and `field.defaultValue` in the lazy initializer. */
  initialData?: Record<string, Record<string, string | string[]>>
}

export const ArtifactBuilder: React.FC<ArtifactBuilderProps> = ({
  title,
  description,
  sections,
  onExport,
  exportFilename = 'artifact',
  renderPreview,
  renderCsv,
  exportFormats = ['markdown'],
  wideTable = false,
  demoFill,
  initialData,
}) => {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')
  // Persistent done-state keyed on the form snapshot (survives edits).
  const [wasSaved, setWasSaved] = useState(false)
  const [lastSavedKey, setLastSavedKey] = useState<string | null>(null)
  const [formData, setFormData] = useState<Record<string, Record<string, string | string[]>>>(
    () => {
      // Auto-run: overlay demo values on the field defaults so the form opens filled.
      const fill = isAutoRunFillActive() ? demoFill : undefined
      const initial: Record<string, Record<string, string | string[]>> = {}
      for (const section of sections) {
        initial[section.id] = {}
        for (const field of section.fields) {
          const saved = initialData?.[section.id]?.[field.id]
          const demo = fill?.[section.id]?.[field.id]
          initial[section.id][field.id] =
            saved ?? demo ?? field.defaultValue ?? (field.type === 'checklist' ? [] : '')
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

  const currentKey = useMemo(() => JSON.stringify(formData), [formData])
  const editedSince = wasSaved && lastSavedKey !== null && currentKey !== lastSavedKey

  const handleSetMode = useCallback((m: 'edit' | 'preview') => setMode(m), [])

  // Save to Command Center — shared by the explicit button and every
  // export-format button. Saves only when the form changed since the last save,
  // which keeps the persistent done-state honest and avoids duplicate docs.
  const handleExport = useCallback(() => {
    if (onExport && (lastSavedKey === null || currentKey !== lastSavedKey)) {
      setLastSavedKey(currentKey)
      setWasSaved(true)
      onExport(formData)
    }
  }, [onExport, formData, currentKey, lastSavedKey])

  const handleSaveClick = handleExport

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

  const exportCsv = useMemo(
    () => (renderCsv ? renderCsv(formData) : undefined),
    [formData, renderCsv]
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
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
        {/* In preview mode, ExportableArtifact below renders its own save action —
            only show this one in edit mode to avoid a duplicate Save button. */}
        {onExport && mode === 'edit' && (
          <CompleteStepAction
            recordsArtifact
            saved={wasSaved}
            editedSinceSave={editedSince}
            onClick={handleSaveClick}
            className="ml-auto"
            dataWorkshopTarget="artifact-builder-save"
          />
        )}
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
                {section.fields.map((field) => {
                  // a11y (WS9, 2026-08-02): the label carried no `htmlFor` and no
                  // control carried an `id`, so every text/date/textarea field in
                  // every artifact builder was an unlabelled form control — a
                  // critical axe violation, systemic across the Command Center
                  // because all 37 business tools render through this component.
                  const controlId = `${section.id}-${field.id}`
                  return (
                    <div key={field.id}>
                      <label
                        htmlFor={controlId}
                        className="block text-sm font-medium text-foreground mb-1.5"
                      >
                        {field.label}
                      </label>
                      {field.type === 'text' && (
                        <Input
                          id={controlId}
                          placeholder={field.placeholder}
                          value={(formData[section.id]?.[field.id] as string) || ''}
                          onChange={(e) => updateField(section.id, field.id, e.target.value)}
                        />
                      )}
                      {field.type === 'date' && (
                        <Input
                          id={controlId}
                          type="date"
                          placeholder={field.placeholder}
                          value={(formData[section.id]?.[field.id] as string) || ''}
                          onChange={(e) => updateField(section.id, field.id, e.target.value)}
                        />
                      )}
                      {field.type === 'textarea' && (
                        <Textarea
                          id={controlId}
                          className="min-h-[100px] resize-y"
                          placeholder={field.placeholder}
                          value={(formData[section.id]?.[field.id] as string) || ''}
                          onChange={(e) => updateField(section.id, field.id, e.target.value)}
                        />
                      )}
                      {field.type === 'select' && (
                        <FilterDropdown
                          noContainer
                          selectedId={(formData[section.id]?.[field.id] as string) || 'All'}
                          onSelect={(id) =>
                            updateField(section.id, field.id, id === 'All' ? '' : id)
                          }
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
                      {field.helperText && (
                        <p className="text-xs text-muted-foreground mt-1">{field.helperText}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <ExportableArtifact
          title={title}
          exportData={exportMarkdown}
          filename={exportFilename}
          formats={exportFormats}
          onExport={handleExport}
          wideTable={wideTable}
          csvData={exportCsv}
        >
          <div className="bg-muted/50 rounded-lg p-4 max-h-[600px] overflow-y-auto">
            <MarkdownView content={exportMarkdown} />
          </div>
        </ExportableArtifact>
      )}
    </div>
  )
}
