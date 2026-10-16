// SPDX-License-Identifier: AGPL-3.0-only
/**
 * A short form for the research question: the question, its type, which
 * sources count and which do not, and the evidence threshold. Saved
 * questions are listed above the form and open in it for editing.
 */
import { useMemo, useState, type FC } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { useModuleStore } from '@/store/useModuleStore'
import { useSaveArtifact } from '@/components/BusinessCenter/architecturePack/saveArtifact'
import type { ExecutiveDocument } from '@/services/storage/types'
import {
  emptyQuestion,
  newQuestionModuleId,
  questionGaps,
  questionSaveRequest,
  questionTypeLabel,
  readQuestion,
  RESEARCH_QUESTION_TYPES,
  type ResearchQuestion,
  type ResearchQuestionType,
} from '@/services/research/researchQuestion'

const EMPTY: ExecutiveDocument[] = []
const TYPE_ITEMS = RESEARCH_QUESTION_TYPES.map((t) => ({ id: t.id, label: t.label }))

const FIELDS: { key: 'inclusion' | 'exclusion' | 'threshold'; label: string; hint: string }[] = [
  {
    key: 'inclusion',
    label: 'Inclusion criteria',
    hint: 'Which sources count, e.g. final NIST and IETF documents, peer-reviewed papers since 2022',
  },
  {
    key: 'exclusion',
    label: 'Exclusion criteria',
    hint: 'Which do not, e.g. vendor marketing, expired drafts',
  },
  {
    key: 'threshold',
    label: 'Evidence threshold',
    hint: 'What is enough to answer, e.g. two independent sources, or one reproduced run with a negative control',
  },
]

export const ResearchQuestionForm: FC = () => {
  const documents = useModuleStore((s) => s.artifacts.executiveDocuments ?? EMPTY)
  const remove = useModuleStore((s) => s.deleteExecutiveDocument)
  const save = useSaveArtifact()
  const questions = useMemo(
    () =>
      documents
        .filter((d) => d.type === 'research-question')
        .sort((a, b) => a.createdAt - b.createdAt)
        .flatMap((doc) => {
          const q = readQuestion(doc)
          return q ? [{ doc, q }] : []
        }),
    [documents]
  )
  const [moduleId, setModuleId] = useState<string | null>(null)
  const [draft, setDraft] = useState<ResearchQuestion>(emptyQuestion)
  const [note, setNote] = useState<string | null>(null)

  const set = <K extends keyof ResearchQuestion>(k: K, v: ResearchQuestion[K]) =>
    setDraft((d) => ({ ...d, [k]: v }))

  const onSave = () => {
    const id = moduleId ?? newQuestionModuleId()
    save(questionSaveRequest(draft, id, moduleId !== null))
    setModuleId(id)
    const gaps = questionGaps(draft)
    setNote(
      gaps.length
        ? `Question saved. Still blank: ${gaps.join(', ')}; the bundle lists them as missing.`
        : 'Question saved.'
    )
  }

  const hint = RESEARCH_QUESTION_TYPES.find((t) => t.id === draft.type)?.hint

  return (
    <div className="space-y-3" data-testid="research-question-form">
      {questions.length > 0 && (
        <ul className="space-y-1 text-xs">
          {questions.map(({ doc, q }) => (
            <li key={doc.id} className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs underline-offset-2 hover:underline"
                onClick={() => {
                  setModuleId(doc.moduleId)
                  setDraft(q)
                  setNote(null)
                }}
              >
                {doc.title}
              </Button>
              <span className="text-[11px] text-muted-foreground">
                {questionTypeLabel(q.type)} · {doc.approvalStatus ?? 'draft'}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-muted-foreground"
                aria-label={`Delete question ${doc.title}`}
                onClick={() => {
                  remove(doc.id)
                  if (moduleId === doc.moduleId) {
                    setModuleId(null)
                    setDraft(emptyQuestion())
                  }
                }}
              >
                <Trash2 size={12} aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-2 rounded-lg border border-border bg-background/50 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold text-foreground">
            {moduleId ? 'Edit question' : 'New question'}
          </span>
          {moduleId && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-[11px]"
              onClick={() => {
                setModuleId(null)
                setDraft(emptyQuestion())
                setNote(null)
              }}
            >
              Start a new question
            </Button>
          )}
        </div>
        <Textarea
          aria-label="Question"
          placeholder="e.g. Is X25519MLKEM768 the hybrid group TLS 1.3 deployments should expect, and how stable is its codepoint?"
          rows={2}
          value={draft.question}
          onChange={(e) => set('question', e.target.value)}
          className="text-xs"
          data-testid="research-question-text"
        />
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-muted-foreground">Type:</span>
          <FilterDropdown
            items={TYPE_ITEMS}
            selectedId={draft.type}
            onSelect={(id) => set('type', id as ResearchQuestionType)}
            ariaLabel="Question type"
            defaultLabel="Question type"
            size="sm"
            noContainer
            hideDefaultOption
          />
          {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
        </div>
        {FIELDS.map((f) => (
          <div key={f.key} className="space-y-1">
            <label
              htmlFor={`research-question-${f.key}`}
              className="text-[11px] text-muted-foreground"
            >
              {f.label}
            </label>
            <Textarea
              id={`research-question-${f.key}`}
              placeholder={f.hint}
              rows={2}
              value={draft[f.key]}
              onChange={(e) => set(f.key, e.target.value)}
              className="text-xs"
            />
          </div>
        ))}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="gradient"
            onClick={onSave}
            disabled={!draft.question.trim()}
            data-testid="research-question-save"
          >
            Save question
          </Button>
          {note && (
            <span className="text-[11px] text-muted-foreground" role="status">
              {note}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
