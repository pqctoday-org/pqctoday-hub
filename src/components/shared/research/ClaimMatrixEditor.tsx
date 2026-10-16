// SPDX-License-Identifier: AGPL-3.0-only
/**
 * A simple table editor for the claim matrix: one row per atomic claim, with
 * a status the user sets, supporting and contrary Library record ids, a
 * confidence rationale and open questions. Rows can be seeded from a
 * collection's annotations. A "fact" without a supporting record id blocks
 * saving; ids the Library does not know are flagged but allowed.
 */
import { useMemo, useState, type FC } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { useModuleStore } from '@/store/useModuleStore'
import { useSaveArtifact } from '@/components/BusinessCenter/architecturePack/saveArtifact'
import type { ExecutiveDocument } from '@/services/storage/types'
import {
  CLAIM_STATUS_LABELS,
  CLAIM_STATUSES,
  checkClaimMatrix,
  claimMatrixSaveRequest,
  emptyClaimMatrix,
  newClaim,
  newClaimMatrixModuleId,
  parseRecordIds,
  readClaimMatrix,
  type ClaimMatrix,
  type ClaimStatus,
  type MatrixClaim,
} from '@/services/research/claimMatrix'
import { savedCollections } from '@/services/research/libraryCollection'
import { readQuestion } from '@/services/research/researchQuestion'
import { currentRecord } from '@/services/research/collectionChanges'
import { useLibraryIndex } from './useLibraryIndex'

const EMPTY: ExecutiveDocument[] = []
const STATUS_ITEMS = CLAIM_STATUSES.map((id) => ({ id, label: CLAIM_STATUS_LABELS[id] }))
const NO_QUESTION = '__none__'

/** A row while editing: record ids are kept as typed until saved. */
interface DraftClaim extends MatrixClaim {
  supportingText: string
  contraryText: string
}

const toDraft = (c: MatrixClaim): DraftClaim => ({
  ...c,
  supportingText: c.supporting.join('; '),
  contraryText: c.contrary.join('; '),
})

const fromDraft = (d: DraftClaim): MatrixClaim => ({
  id: d.id,
  claim: d.claim,
  status: d.status,
  supporting: parseRecordIds(d.supportingText),
  contrary: parseRecordIds(d.contraryText),
  confidence: d.confidence,
  openQuestions: d.openQuestions,
})

export const ClaimMatrixEditor: FC = () => {
  const documents = useModuleStore((s) => s.artifacts.executiveDocuments ?? EMPTY)
  const remove = useModuleStore((s) => s.deleteExecutiveDocument)
  const save = useSaveArtifact()
  const index = useLibraryIndex()
  const matrices = useMemo(
    () =>
      documents
        .filter((d) => d.type === 'claim-matrix')
        .sort((a, b) => a.createdAt - b.createdAt)
        .flatMap((doc) => {
          const m = readClaimMatrix(doc)
          return m ? [{ doc, m }] : []
        }),
    [documents]
  )
  const questions = useMemo(
    () =>
      documents.flatMap((doc) => {
        const q = readQuestion(doc)
        return q ? [{ doc, q }] : []
      }),
    [documents]
  )
  const collections = useMemo(() => savedCollections(documents), [documents])

  const [moduleId, setModuleId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [questionId, setQuestionId] = useState<string | null>(null)
  const [rows, setRows] = useState<DraftClaim[]>([])
  const [note, setNote] = useState<string | null>(null)

  const matrix: ClaimMatrix = {
    ...emptyClaimMatrix(),
    title,
    questionModuleId: questionId,
    claims: rows.map(fromDraft),
  }
  const check = checkClaimMatrix(
    matrix,
    index ? (id) => currentRecord(index, id) !== undefined : undefined
  )

  const load = (m: ClaimMatrix | null, id: string | null) => {
    setModuleId(id)
    setTitle(m?.title ?? '')
    setQuestionId(m?.questionModuleId ?? null)
    setRows((m?.claims ?? []).map(toDraft))
    setNote(null)
  }

  const setRow = (id: string, patch: Partial<DraftClaim>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)))

  const addRow = () => setRows((rs) => [...rs, toDraft(newClaim(rs.map(fromDraft)))])

  /** One estimate per annotated record in the collection, citing that record. */
  const seedFrom = (collectionModuleId: string) => {
    const c = collections.find((x) => x.doc.moduleId === collectionModuleId)
    if (!c) return
    setRows((rs) => {
      const out = [...rs]
      for (const e of c.collection.entries) {
        if (!e.annotation.trim()) continue
        const claim = newClaim(out.map(fromDraft))
        out.push(toDraft({ ...claim, claim: e.annotation.trim(), supporting: [e.referenceId] }))
      }
      return out
    })
  }

  const onSave = () => {
    if (check.errors.length) return
    const id = moduleId ?? newClaimMatrixModuleId()
    const questionText = questions.find((q) => q.doc.moduleId === questionId)?.q.question
    save(claimMatrixSaveRequest(matrix, id, { questionText, edited: moduleId !== null }))
    setModuleId(id)
    setNote('Claim matrix saved.')
  }

  const questionItems = [
    { id: NO_QUESTION, label: 'No question linked' },
    ...questions.map((q) => ({ id: q.doc.moduleId, label: q.doc.title })),
  ]
  const annotated = collections.filter((c) => c.collection.entries.some((e) => e.annotation.trim()))

  const cellCls = 'p-1 align-top'
  return (
    <div className="space-y-3" data-testid="claim-matrix-editor">
      {matrices.length > 0 && (
        <ul className="space-y-1 text-xs">
          {matrices.map(({ doc, m }) => (
            <li key={doc.id} className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs underline-offset-2 hover:underline"
                onClick={() => load(m, doc.moduleId)}
              >
                {doc.title}
              </Button>
              <span className="text-[11px] text-muted-foreground">
                {m.claims.length} claim{m.claims.length === 1 ? '' : 's'} ·{' '}
                {doc.approvalStatus ?? 'draft'}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-muted-foreground"
                aria-label={`Delete claim matrix ${doc.title}`}
                onClick={() => {
                  remove(doc.id)
                  if (moduleId === doc.moduleId) load(null, null)
                }}
              >
                <Trash2 size={12} aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-2 rounded-lg border border-border bg-background/50 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            aria-label="Claim matrix title"
            placeholder="Claim matrix title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-8 w-64 text-xs"
          />
          <FilterDropdown
            items={questionItems}
            selectedId={questionId ?? NO_QUESTION}
            onSelect={(id) => setQuestionId(id === NO_QUESTION ? null : id)}
            ariaLabel="Research question"
            defaultLabel="Research question"
            size="sm"
            noContainer
            hideDefaultOption
          />
          {moduleId && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-[11px]"
              onClick={() => load(null, null)}
            >
              Start a new matrix
            </Button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-xs" data-testid="claim-matrix-table">
            <thead>
              <tr className="text-left text-[11px] text-muted-foreground">
                <th className="p-1">#</th>
                <th className="p-1">Claim</th>
                <th className="p-1">Status</th>
                <th className="p-1">Supporting record ids</th>
                <th className="p-1">Contrary record ids</th>
                <th className="p-1">Confidence rationale</th>
                <th className="p-1">Open questions</th>
                <th className="p-1">
                  <span className="sr-only">Remove</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className={`${cellCls} pt-2 font-medium`}>{r.id}</td>
                  <td className={cellCls}>
                    <Textarea
                      aria-label={`${r.id} claim`}
                      rows={2}
                      value={r.claim}
                      onChange={(e) => setRow(r.id, { claim: e.target.value })}
                      className="text-xs"
                    />
                  </td>
                  <td className={cellCls}>
                    <FilterDropdown
                      items={STATUS_ITEMS}
                      selectedId={r.status}
                      onSelect={(id) => setRow(r.id, { status: id as ClaimStatus })}
                      ariaLabel={`${r.id} status`}
                      defaultLabel="Status"
                      size="sm"
                      noContainer
                      hideDefaultOption
                    />
                  </td>
                  <td className={cellCls}>
                    <Input
                      aria-label={`${r.id} supporting record ids`}
                      placeholder="FIPS 203; RFC 9629"
                      value={r.supportingText}
                      onChange={(e) => setRow(r.id, { supportingText: e.target.value })}
                      className="h-8 text-xs"
                    />
                  </td>
                  <td className={cellCls}>
                    <Input
                      aria-label={`${r.id} contrary record ids`}
                      value={r.contraryText}
                      onChange={(e) => setRow(r.id, { contraryText: e.target.value })}
                      className="h-8 text-xs"
                    />
                  </td>
                  <td className={cellCls}>
                    <Textarea
                      aria-label={`${r.id} confidence rationale`}
                      rows={2}
                      value={r.confidence}
                      onChange={(e) => setRow(r.id, { confidence: e.target.value })}
                      className="text-xs"
                    />
                  </td>
                  <td className={cellCls}>
                    <Textarea
                      aria-label={`${r.id} open questions`}
                      rows={2}
                      value={r.openQuestions}
                      onChange={(e) => setRow(r.id, { openQuestions: e.target.value })}
                      className="text-xs"
                    />
                  </td>
                  <td className={cellCls}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-muted-foreground"
                      aria-label={`Remove claim ${r.id}`}
                      onClick={() => setRows((rs) => rs.filter((x) => x.id !== r.id))}
                    >
                      <Trash2 size={12} aria-hidden="true" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1 text-[11px]"
            onClick={addRow}
            data-testid="claim-matrix-add"
          >
            <Plus size={12} aria-hidden="true" /> Add claim
          </Button>
          {annotated.length > 0 && (
            <FilterDropdown
              items={annotated.map((c) => ({
                id: c.doc.moduleId,
                label: `From ${c.collection.name}`,
              }))}
              selectedId=""
              onSelect={seedFrom}
              ariaLabel="Add claims from a collection's annotations"
              defaultLabel="Add claims from a collection's annotations"
              size="sm"
              noContainer
              hideDefaultOption
            />
          )}
        </div>

        {(check.errors.length > 0 || check.warnings.length > 0) && (
          <ul className="space-y-0.5 text-[11px]" data-testid="claim-matrix-issues">
            {check.errors.map((i) => (
              <li key={`e-${i.message}`} className="text-status-error">
                {i.message}
              </li>
            ))}
            {check.warnings.map((i) => (
              <li key={`w-${i.message}`} className="text-status-warning">
                {i.message}
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="gradient"
            onClick={onSave}
            disabled={rows.length === 0 || check.errors.length > 0}
            data-testid="claim-matrix-save"
          >
            Save claim matrix
          </Button>
          <span className="text-[11px] text-muted-foreground">
            You set each claim&apos;s status; the site only checks that a fact cites a record.
          </span>
          {note && (
            <span className="text-[11px] text-status-success" role="status">
              {note}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
