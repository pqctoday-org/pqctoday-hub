// SPDX-License-Identifier: AGPL-3.0-only
import { useState, useMemo, useCallback } from 'react'
import { ExportableArtifact } from '../../../common/executive/ExportableArtifact'
import { MarkdownView } from '@/components/ui/MarkdownView'
import { useModuleStore } from '@/store/useModuleStore'
import { scopedArtifactInputs, useSavedArtifactDocuments } from '@/hooks/useSavedArtifactInputs'
import {
  OWNERS,
  CAPABILITIES,
  CRITERIA,
  CLOSURE_MODULE,
  CLOSURE_TYPE,
  CLOSURE_SCOPE,
  restoreClosureInputs,
  isClosureRecordInputs,
  closureEntryStatus,
  buildClosureArtifact,
} from './closureHandoverArtifact'
import { FileCheck2, Lock, LockOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FilterDropdown } from '@/components/common/FilterDropdown'

/**
 * Closure & Handover Register — a local educational draft. Every standing capability
 * is represented by a sample owner/date entry and self-selected acknowledgments.
 * Completion checks presence only; it does not verify transfer or acceptance.
 */

export function ClosureHandoverRegister() {
  const documents = useModuleStore((state) => state.artifacts.executiveDocuments)
  const occupied =
    documents?.some(
      (doc) =>
        doc.moduleId === CLOSURE_MODULE &&
        doc.type === CLOSURE_TYPE &&
        !isClosureRecordInputs(doc.inputs)
    ) ?? false
  const [saveConflict, setSaveConflict] = useState(false)
  const savedDocuments = useSavedArtifactDocuments(CLOSURE_TYPE, CLOSURE_SCOPE)
  const saved = savedDocuments.find((doc) => doc.moduleId === CLOSURE_MODULE)?.inputs
  const [owner, setOwner] = useState(() => restoreClosureInputs(saved).owner)
  const [date, setDate] = useState(() => restoreClosureInputs(saved).date)
  const [crit, setCrit] = useState(() => new Set(restoreClosureInputs(saved).criteria))
  const inputs = useMemo(() => ({ owner, date, criteria: [...crit] }), [owner, date, crit])
  const status = closureEntryStatus(inputs)
  const allOwned = status.assigned === CAPABILITIES.length
  const allCrit = status.acknowledged === CRITERIA.length
  const ready = status.complete
  const ownedCount = status.assigned
  const markdown = useMemo(() => buildClosureArtifact(inputs), [inputs])
  const saveRecord = useCallback(() => {
    const state = useModuleStore.getState()
    const existing = state.artifacts.executiveDocuments?.find(
      (doc) => doc.moduleId === CLOSURE_MODULE && doc.type === CLOSURE_TYPE
    )
    if (existing && !isClosureRecordInputs(existing.inputs)) {
      setSaveConflict(true)
      return
    }
    state.addExecutiveDocument({
      id: existing?.id ?? `closure-handover-${Date.now()}`,
      moduleId: CLOSURE_MODULE,
      type: CLOSURE_TYPE,
      title: 'Fictional closure and BAU handover record',
      data: markdown,
      inputs: scopedArtifactInputs(CLOSURE_SCOPE, inputs),
      createdAt: existing?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    })
  }, [markdown, inputs])

  return (
    <ExportableArtifact
      key={occupied || saveConflict ? 'blocked' : 'available'}
      title="Fictional closure and BAU handover record"
      exportData={markdown}
      filename="sample-closure-handover"
      formats={['markdown']}
      onExport={occupied || saveConflict ? undefined : saveRecord}
    >
      <div className="space-y-4">
        {(occupied || saveConflict) && (
          <p role="alert">
            A different local document already occupies this module’s save slot. It has been
            preserved; this draft can still be inspected or downloaded. Save is unavailable.
          </p>
        )}
        <div className="glass-panel p-4">
          <h3 className="mb-1 font-semibold text-foreground">
            Sample closure &amp; BAU handover checklist
          </h3>
          <p className="text-sm text-muted-foreground">
            Use fictional owners, dates and acknowledgments to explore a closure discussion. This
            draft generates an inspectable sample record below. Save retains it locally; Markdown
            downloads it. Neither action evaluates evidence, approves closure or archives a dossier.
            Production tools must retain the actual supporting records and ongoing ownership.
          </p>
        </div>

        <div className="glass-panel p-4">
          <h4 className="mb-2 text-sm font-semibold text-foreground">
            Handover register ({ownedCount}/{CAPABILITIES.length} assigned)
          </h4>
          <div className="space-y-2">
            {CAPABILITIES.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="text-foreground">{c.label}</span>
                <span className="flex flex-wrap items-center gap-1.5 min-w-0 max-w-full">
                  <FilterDropdown
                    items={OWNERS}
                    selectedId={owner[c.id] ?? ''}
                    onSelect={(id) => setOwner((p) => ({ ...p, [c.id]: id === 'All' ? '' : id }))}
                    defaultLabel="owner…"
                    defaultIcon={null}
                    ariaLabel={`Owner for ${c.label}`}
                    noContainer
                    size="sm"
                  />
                  <input
                    type="date"
                    aria-label={`Handover date for ${c.label}`}
                    value={date[c.id] ?? ''}
                    onChange={(e) => setDate((p) => ({ ...p, [c.id]: e.target.value }))}
                    className="rounded border border-border bg-transparent px-1.5 py-1 text-xs text-foreground"
                  />
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel p-4">
          <h4 className="mb-2 text-sm font-semibold text-foreground">
            Entered sample acknowledgments
          </h4>
          <div className="space-y-1.5">
            {CRITERIA.map((c) => (
              <Button
                key={c.id}
                variant="ghost"
                onClick={() =>
                  setCrit((prev) => {
                    const next = new Set(prev)
                    if (next.has(c.id)) next.delete(c.id)
                    else next.add(c.id)
                    return next
                  })
                }
                className={`h-auto w-full justify-start whitespace-normal border p-2 text-left text-sm ${
                  crit.has(c.id)
                    ? 'border-status-success/40 bg-status-success/5 text-status-success'
                    : 'border-border text-foreground'
                }`}
              >
                {crit.has(c.id) ? '☑' : '☐'} <span className="ml-1">{c.label}</span>
              </Button>
            ))}
          </div>
        </div>

        <div
          className={`glass-panel border p-4 ${ready ? 'border-status-success/40' : 'border-status-warning/30'}`}
        >
          <div className="flex items-center gap-2 text-sm font-semibold">
            {ready ? (
              <>
                <Lock size={16} className="text-status-success" />
                <span className="text-status-success">
                  Sample checklist entries complete — closure not assessed
                </span>
              </>
            ) : (
              <>
                <LockOpen size={16} className="text-status-warning" />
                <span className="text-status-warning">Sample checklist entries incomplete</span>
              </>
            )}
          </div>
          {ready ? (
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <FileCheck2 size={12} /> Sample entries complete. Inspect the generated draft below;
              Save or download the actual record. Closure and archival remain unassessed.
            </p>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">
              Outstanding:{' '}
              {!allOwned && `${CAPABILITIES.length - ownedCount} capability(ies) unassigned`}
              {!allOwned && !allCrit && '; '}
              {!allCrit && `${CRITERIA.length - crit.size} acknowledgment(s) unselected`}.
            </p>
          )}
        </div>
        <section aria-label="Generated sample closure record">
          <MarkdownView content={markdown} />
        </section>
      </div>
    </ExportableArtifact>
  )
}
