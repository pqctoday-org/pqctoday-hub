// SPDX-License-Identifier: AGPL-3.0-only
import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import {
  createObservations,
  evaluateObservations,
  isObservationLabel,
  type EvaluationQuestion,
  type EvaluationRatio,
  type Observation,
} from '../data/observationEvaluation'

const formatRatio = (ratio: EvaluationRatio) =>
  ratio.percent === null
    ? `Not assessed (${ratio.numerator}/${ratio.denominator}; denominator is zero)`
    : `${Number(ratio.percent.toFixed(2))}% (${ratio.numerator}/${ratio.denominator})`

export function ObservationEvaluation() {
  const id = useId()
  const [question, setQuestion] = useState<EvaluationQuestion>('synthetic')
  const [drafts, setDrafts] = useState<Record<EvaluationQuestion, Observation[]>>({
    synthetic: createObservations('balanced'),
    'near-duplicate': createObservations('balanced'),
    watermark: createObservations('balanced'),
  })
  const rows =
    question === 'synthetic'
      ? drafts.synthetic
      : question === 'near-duplicate'
        ? drafts['near-duplicate']
        : drafts.watermark
  const counts = evaluateObservations(rows)
  const replaceRows = (next: Observation[]) =>
    setDrafts((previous) =>
      question === 'synthetic'
        ? { ...previous, synthetic: next }
        : question === 'near-duplicate'
          ? { ...previous, 'near-duplicate': next }
          : { ...previous, watermark: next }
    )
  const positive =
    question === 'synthetic'
      ? 'Synthetic'
      : question === 'near-duplicate'
        ? 'Near duplicate'
        : 'Selected watermark present'
  const negative =
    question === 'synthetic'
      ? 'Not synthetic'
      : question === 'near-duplicate'
        ? 'Not a near duplicate'
        : 'Selected watermark absent'
  const edit = (rowId: string, field: 'reference' | 'result', value: string) => {
    if (!isObservationLabel(value)) return
    replaceRows(
      rows.map((row) =>
        row.id !== rowId
          ? row
          : field === 'reference'
            ? { ...row, reference: value }
            : { ...row, result: value }
      )
    )
  }

  return (
    <section className="glass-panel p-4 space-y-4" aria-labelledby={`${id}-heading`}>
      <h4 id={`${id}-heading`} className="font-bold text-foreground">
        Evaluate fictional tool observations
      </h4>
      <p className="text-sm text-muted-foreground">
        These eight editable reference labels and tool results are fictional observations, not a
        classifier or a benchmark of any product. Every metric below is calculated from the rows.
        Selecting a verification layer or signing algorithm does not change these observations.
      </p>
      <div className="text-sm font-medium space-y-1">
        <p>Evaluation question</p>
        <FilterDropdown
          ariaLabel="Evaluation question"
          selectedId={question}
          items={[
            { id: 'synthetic', label: 'Is this synthetic content?' },
            { id: 'near-duplicate', label: 'Is this a near duplicate?' },
            { id: 'watermark', label: 'Is the selected watermark present?' },
          ]}
          onSelect={(value) => {
            if (value === 'synthetic' || value === 'near-duplicate' || value === 'watermark')
              setQuestion(value)
          }}
          noContainer
          hideDefaultOption
          defaultIcon={null}
        />
      </div>
      <p className="text-sm text-muted-foreground">
        {question === 'synthetic'
          ? 'Positive means the provided tool result calls the item synthetic. A false negative misses a synthetic item; a false positive flags a non-synthetic item.'
          : question === 'near-duplicate'
            ? 'Positive means the provided matcher result calls the item a near duplicate of a reference item. Similarity does not establish whether either item is synthetic.'
            : 'Positive means the provided result calls a selected fictional watermark present. This evaluates that watermark-presence question only; absence does not establish non-synthetic origin.'}{' '}
        Reference labels are supplied separately from tool results; this sample does not establish
        their correctness.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => replaceRows(createObservations('balanced'))}>
          Load balanced observations
        </Button>
        <Button variant="outline" onClick={() => replaceRows(createObservations('imbalanced'))}>
          Load imbalanced observations
        </Button>
        <Button variant="outline" onClick={() => replaceRows(createObservations('empty'))}>
          Clear observations
        </Button>
      </div>
      <div className="space-y-3">
        {rows.map((row, index) => (
          <fieldset key={row.id} className="border border-border rounded p-3 min-w-0">
            <legend className="px-1 text-sm font-medium">Sample {index + 1}</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="text-sm min-w-0 space-y-1">
                <p>Reference label</p>
                <FilterDropdown
                  ariaLabel={`Sample ${index + 1} reference label`}
                  selectedId={row.reference}
                  items={[
                    { id: 'positive', label: positive },
                    { id: 'negative', label: negative },
                    { id: 'unknown', label: 'Unanswered' },
                  ]}
                  onSelect={(value) => edit(row.id, 'reference', value)}
                  noContainer
                  hideDefaultOption
                  defaultIcon={null}
                />
              </div>
              <div className="text-sm min-w-0 space-y-1">
                <p>Provided tool result</p>
                <FilterDropdown
                  ariaLabel={`Sample ${index + 1} tool result`}
                  selectedId={row.result}
                  items={[
                    { id: 'positive', label: positive },
                    { id: 'negative', label: negative },
                    { id: 'unknown', label: 'Unanswered' },
                  ]}
                  onSelect={(value) => edit(row.id, 'result', value)}
                  noContainer
                  hideDefaultOption
                  defaultIcon={null}
                />
              </div>
            </div>
          </fieldset>
        ))}
      </div>
      <div role="status" aria-label="Observation evaluation results" className="space-y-2 text-sm">
        <p>
          Assessed: {counts.assessed} of {rows.length}; unassessed: {counts.unassessed}
        </p>
        <p>
          True positives: {counts.tp}; false negatives: {counts.fn}; false positives: {counts.fp};
          true negatives: {counts.tn}
        </p>
        <p>Accuracy: {formatRatio(counts.accuracy)}</p>
        <p>Precision: {formatRatio(counts.precision)}</p>
        <p>Recall: {formatRatio(counts.recall)}</p>
      </div>
      <p className="text-sm text-muted-foreground">
        Unanswered pairs are excluded and counted as unassessed. Accuracy divides correct results by
        assessed pairs; precision divides true positives by predicted positives; recall divides true
        positives by reference positives. The imbalanced example gets seven of eight right while
        missing its only positive: high accuracy can hide zero recall.
      </p>
      <p className="text-sm text-muted-foreground">
        When evaluating your own production tools, obtain representative labelled examples, record
        false positives and false negatives for each intended question, and retain the dataset,
        labels, tool version and settings behind the counts. Check label quality and coverage
        separately. Signature validity protects signed bytes and assertions; it does not establish
        origin, similarity, content quality or detector accuracy.
      </p>
    </section>
  )
}
