// SPDX-License-Identifier: AGPL-3.0-only
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useModuleStore } from '@/store/useModuleStore'
import {
  emptyOpsScope,
  OPS_SCOPE_FIELDS,
  opsScopeMarkdown,
  type OpsScopeInputs,
} from '@/services/opsArtifacts'
import { OPERATIONS_PACK_MODULE_ID } from '@/services/operationsPack'
import { useSaveArtifact } from '../architecturePack/saveArtifact'

export function OpsScopeEditor() {
  const saved = useModuleStore((s) =>
    (s.artifacts.executiveDocuments ?? []).find(
      (d) => d.moduleId === OPERATIONS_PACK_MODULE_ID && d.type === 'ops-scope'
    )
  )
  const [scope, setScope] = useState<OpsScopeInputs>(() => ({
    ...emptyOpsScope(),
    ...((saved?.inputs as Partial<OpsScopeInputs> | undefined) ?? {}),
  }))
  const [note, setNote] = useState<string | null>(null)
  const save = useSaveArtifact()

  const onSave = () => {
    save({
      type: 'ops-scope',
      moduleId: OPERATIONS_PACK_MODULE_ID,
      title: 'Operations scope',
      data: opsScopeMarkdown(scope),
      inputs: scope,
      revisionSummary: saved ? 'Scope edited' : undefined,
    })
    setNote('Scope saved.')
  }

  return (
    <div className="space-y-3" data-testid="ops-scope-editor">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {OPS_SCOPE_FIELDS.map((f) => (
          <div key={f.key} className="space-y-1">
            <label
              htmlFor={`ops-scope-${f.key}`}
              className="text-[11px] font-medium text-muted-foreground"
            >
              {f.label}
            </label>
            <Textarea
              id={`ops-scope-${f.key}`}
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
        <Button size="sm" variant="outline" onClick={onSave} data-testid="ops-scope-save">
          Save scope
        </Button>
        {note && <span className="text-[11px] text-status-success">{note}</span>}
      </div>
    </div>
  )
}
