// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useModuleStore } from '@/store/useModuleStore'
import {
  emptyScope,
  SCOPE_FIELDS,
  scopeMarkdown,
  type ArchitectureScopeInputs,
} from '@/services/architectureArtifacts'
import { ARCHITECTURE_PACK_MODULE_ID, useSaveArtifact } from './saveArtifact'

export function ScopeEditor() {
  const saved = useModuleStore((s) =>
    (s.artifacts.executiveDocuments ?? []).find(
      (d) => d.moduleId === ARCHITECTURE_PACK_MODULE_ID && d.type === 'architecture-scope'
    )
  )
  const [scope, setScope] = useState<ArchitectureScopeInputs>(() => ({
    ...emptyScope(),
    ...((saved?.inputs as Partial<ArchitectureScopeInputs> | undefined) ?? {}),
  }))
  const [note, setNote] = useState<string | null>(null)
  const save = useSaveArtifact()

  const onSave = () => {
    save({
      type: 'architecture-scope',
      moduleId: ARCHITECTURE_PACK_MODULE_ID,
      title: 'Architecture scope',
      data: scopeMarkdown(scope),
      inputs: scope,
      revisionSummary: saved ? 'Scope edited' : undefined,
    })
    setNote('Scope saved.')
  }

  return (
    <div className="space-y-3" data-testid="architecture-scope-editor">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {SCOPE_FIELDS.map((f) => (
          <div key={f.key} className="space-y-1">
            <label
              htmlFor={`architecture-scope-${f.key}`}
              className="text-[11px] font-medium text-muted-foreground"
            >
              {f.label}
            </label>
            <Textarea
              id={`architecture-scope-${f.key}`}
              rows={2}
              value={scope[f.key]}
              placeholder={f.hint}
              onChange={(e) => setScope((s) => ({ ...s, [f.key]: e.target.value }))}
              className="text-xs"
            />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <Button size="sm" variant="outline" onClick={onSave} data-testid="architecture-scope-save">
          Save scope
        </Button>
        {note && <span className="text-[11px] text-status-success">{note}</span>}
      </div>
    </div>
  )
}
