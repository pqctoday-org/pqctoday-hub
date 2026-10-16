// SPDX-License-Identifier: GPL-3.0-only
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { useModuleStore } from '@/store/useModuleStore'
import type { ExecutiveDocument } from '@/services/storage/types'
import {
  CLAIM_STATUS_LABELS,
  decisionFromTemplate,
  decisionMarkdown,
  DECISION_TEMPLATES,
  parseEvidence,
  type ClaimStatus,
  type DecisionRecordInputs,
  type DecisionTopic,
} from '@/services/architectureArtifacts'
import { ARCHITECTURE_PACK_MODULE_ID, useSaveArtifact } from './saveArtifact'

const ADR_PREFIX = `${ARCHITECTURE_PACK_MODULE_ID}:adr:`

const TOPIC_ITEMS = DECISION_TEMPLATES.map((t) => ({ id: t.topic, label: t.label }))
const CLAIM_ITEMS = (Object.keys(CLAIM_STATUS_LABELS) as ClaimStatus[]).map((id) => ({
  id,
  label: CLAIM_STATUS_LABELS[id],
}))

const TEXT_FIELDS: { key: keyof DecisionRecordInputs; label: string; rows: number }[] = [
  { key: 'context', label: 'Context', rows: 2 },
  { key: 'options', label: 'Options considered', rows: 2 },
  { key: 'decision', label: 'Decision', rows: 2 },
  { key: 'consequences', label: 'Consequences', rows: 2 },
  { key: 'preconditions', label: 'Preconditions (this decision holds only if)', rows: 2 },
]

interface Draft {
  /** moduleId of the record being edited; a new one gets a fresh id on save. */
  moduleId: string | null
  inputs: DecisionRecordInputs
  evidenceText: string
}

const draftFor = (topic: DecisionTopic): Draft => ({
  moduleId: null,
  inputs: decisionFromTemplate(topic),
  evidenceText: '',
})

export function DecisionEditor({ initialTopic }: { initialTopic?: DecisionTopic | null }) {
  const all = useModuleStore((s) => s.artifacts.executiveDocuments)
  const records = useMemo(
    () =>
      (all ?? [])
        .filter(
          (d) => d.type === 'architecture-decision-record' && d.moduleId.startsWith(ADR_PREFIX)
        )
        .sort((a, b) => a.createdAt - b.createdAt),
    [all]
  )
  const remove = useModuleStore((s) => s.deleteExecutiveDocument)
  const save = useSaveArtifact()
  const [draft, setDraft] = useState<Draft | null>(() =>
    initialTopic ? draftFor(initialTopic) : null
  )
  const [note, setNote] = useState<string | null>(null)

  const open = (doc: ExecutiveDocument) => {
    const inputs = doc.inputs as DecisionRecordInputs
    setDraft({ moduleId: doc.moduleId, inputs, evidenceText: inputs.evidence.join('\n') })
    setNote(null)
  }

  const set = <K extends keyof DecisionRecordInputs>(k: K, v: DecisionRecordInputs[K]) =>
    setDraft((d) => (d ? { ...d, inputs: { ...d.inputs, [k]: v } } : d))

  const onSave = () => {
    if (!draft) return
    const inputs = { ...draft.inputs, evidence: parseEvidence(draft.evidenceText) }
    const moduleId = draft.moduleId ?? `${ADR_PREFIX}${Date.now()}`
    save({
      type: 'architecture-decision-record',
      moduleId,
      title: inputs.title.trim() || 'Untitled decision',
      data: decisionMarkdown(inputs),
      inputs,
      revisionSummary: draft.moduleId ? 'Decision edited' : undefined,
    })
    setDraft({ moduleId, inputs, evidenceText: inputs.evidence.join('\n') })
    setNote('Decision saved.')
  }

  const template = draft ? DECISION_TEMPLATES.find((t) => t.topic === draft.inputs.topic) : null

  return (
    <div className="space-y-3" data-testid="architecture-decision-editor">
      {records.length > 0 && (
        <ul className="space-y-1">
          {records.map((d) => (
            <li key={d.id} className="flex items-center gap-2 text-xs">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs underline-offset-2 hover:underline"
                onClick={() => open(d)}
              >
                {d.title}
              </Button>
              <span className="text-[11px] text-muted-foreground">
                {d.approvalStatus ?? 'draft'}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-muted-foreground"
                aria-label={`Delete decision ${d.title}`}
                onClick={() => {
                  remove(d.id)
                  if (draft?.moduleId === d.moduleId) setDraft(null)
                }}
              >
                <Trash2 size={12} />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] text-muted-foreground">New decision from:</span>
        <FilterDropdown
          items={TOPIC_ITEMS}
          selectedId={draft && draft.moduleId === null ? draft.inputs.topic : ''}
          onSelect={(id) => {
            setDraft(draftFor(id as DecisionTopic))
            setNote(null)
          }}
          ariaLabel="Decision template"
          defaultLabel="Choose a template"
          size="sm"
          noContainer
          hideDefaultOption
        />
        {!draft && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1 text-[11px]"
            onClick={() => setDraft(draftFor('other'))}
          >
            <Plus size={12} /> Blank decision
          </Button>
        )}
      </div>

      {draft && (
        <div className="space-y-2 rounded-lg border border-border p-3">
          <div className="space-y-1">
            <label htmlFor="adr-title" className="text-[11px] font-medium text-muted-foreground">
              Title
            </label>
            <Input
              id="adr-title"
              value={draft.inputs.title}
              onChange={(e) => set('title', e.target.value)}
              className="h-8 text-xs"
              data-testid="adr-title"
            />
          </div>
          {template?.modulePath && (
            <p className="text-[11px] text-muted-foreground">
              Background:{' '}
              <Link to={template.modulePath} className="text-primary hover:underline">
                {template.label} in Learn
              </Link>
            </p>
          )}
          {TEXT_FIELDS.map((f) => (
            <div key={f.key} className="space-y-1">
              <label
                htmlFor={`adr-${f.key}`}
                className="text-[11px] font-medium text-muted-foreground"
              >
                {f.label}
              </label>
              <Textarea
                id={`adr-${f.key}`}
                rows={f.rows}
                value={String(draft.inputs[f.key] ?? '')}
                onChange={(e) => set(f.key, e.target.value as never)}
                className="text-xs"
                data-testid={`adr-${f.key}`}
              />
            </div>
          ))}
          <div className="space-y-1">
            <label htmlFor="adr-evidence" className="text-[11px] font-medium text-muted-foreground">
              Evidence: Library reference ids, one per line (for example FIPS 203 or RFC-9763)
            </label>
            <Textarea
              id="adr-evidence"
              rows={2}
              value={draft.evidenceText}
              onChange={(e) => setDraft({ ...draft, evidenceText: e.target.value })}
              className="font-mono text-xs"
              data-testid="adr-evidence"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-muted-foreground">Claim status:</span>
            <FilterDropdown
              items={CLAIM_ITEMS}
              selectedId={draft.inputs.claimStatus}
              onSelect={(id) => set('claimStatus', id as ClaimStatus)}
              ariaLabel="Claim status"
              size="sm"
              noContainer
              hideDefaultOption
            />
          </div>
          <div className="flex items-center gap-3">
            <Button size="sm" variant="outline" onClick={onSave} data-testid="adr-save">
              Save decision
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setDraft(null)}>
              Close
            </Button>
            {note && <span className="text-[11px] text-status-success">{note}</span>}
          </div>
        </div>
      )}
    </div>
  )
}
