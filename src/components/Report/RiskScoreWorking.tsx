// SPDX-License-Identifier: AGPL-3.0-only
/**
 * "How this was calculated" — B+ remediation 3.6 (2026-08-10).
 *
 * The risk score arrived as a number with no working shown. Half of the trail
 * was already on screen (the four category scores in the Board Brief, and the
 * situational boosts under the gauge); the missing half was the arithmetic in
 * between — which weights this industry uses, what each category therefore
 * contributed, and how those four contributions add up to the pre-boost score.
 *
 * Without it a reader has four numbers, a different number, and no stated
 * relationship. "A score becomes teachable instead of oracular" is the whole
 * point: it is the difference between a number a reader carries into a meeting
 * and one they quietly discount.
 *
 * Everything here is recomputed from `INDUSTRY_COMPOSITE_WEIGHTS` and the
 * result's own `categoryScores` — the same inputs `computeCompositeScoreWithBoosts`
 * uses — so the disclosure cannot describe a formula the scorer is not running.
 * `RiskScoreWorking.test.ts` pins that agreement.
 */
import { useState } from 'react'
import { ChevronDown, Calculator } from 'lucide-react'
import { Button } from '../ui/button'
import { INDUSTRY_COMPOSITE_WEIGHTS, DEFAULT_COMPOSITE_WEIGHTS } from '../../hooks/assessmentData'
import type { AssessmentInput, AssessmentResult } from '../../hooks/assessmentTypes'
import { computeAssessment } from '../../hooks/assessment/orchestrator'
import { answerImpacts, type AnswerSource } from './answerImpact'

const SOURCE_LABEL: Record<AnswerSource, string> = {
  yours: 'Your answer',
  'not-known': 'You said "don\'t know"; the cautious default was used',
  'not-answered': 'Not answered; the default was used',
}

export interface WorkingRow {
  label: string
  /** The 0–100 category score, as it appears in the Board Brief. */
  score: number
  /** The weight applied to it for this industry. */
  weight: number
  /** score × weight — this category's points in the composite. */
  contribution: number
  /** Set when the category is inverted (readiness is higher-is-better). */
  note?: string
}

/**
 * The four weighted contributions behind the pre-boost score, for a given
 * result. Exported so the test can compare this against the scorer directly
 * rather than through the DOM.
 */
export function riskScoreWorking(
  result: AssessmentResult,
  industry: string
): { rows: WorkingRow[]; base: number; weightSource: 'industry' | 'default' } | null {
  const cs = result.categoryScores
  if (!cs) return null
  const industryWeights =
    INDUSTRY_COMPOSITE_WEIGHTS[industry as keyof typeof INDUSTRY_COMPOSITE_WEIGHTS]
  const w = industryWeights ?? DEFAULT_COMPOSITE_WEIGHTS
  const rows: WorkingRow[] = [
    {
      label: 'Quantum exposure',
      score: cs.quantumExposure,
      weight: w.qe,
      contribution: cs.quantumExposure * w.qe,
    },
    {
      label: 'Migration complexity',
      score: cs.migrationComplexity,
      weight: w.mc,
      contribution: cs.migrationComplexity * w.mc,
    },
    {
      label: 'Regulatory pressure',
      score: cs.regulatoryPressure,
      weight: w.rp,
      contribution: cs.regulatoryPressure * w.rp,
    },
    {
      label: 'Organizational readiness',
      score: cs.organizationalReadiness,
      weight: w.or,
      // Readiness is higher-is-better, so it enters the sum as its complement —
      // being ready REDUCES risk. Stating that is the difference between a
      // reader trusting the table and thinking it has a sign error.
      contribution: (100 - cs.organizationalReadiness) * w.or,
      note: 'counted as the gap (100 − readiness): being ready lowers risk',
    },
  ]
  return {
    rows,
    base: rows.reduce((sum, r) => sum + r.contribution, 0),
    weightSource: industryWeights ? 'industry' : 'default',
  }
}

export function RiskScoreWorking({
  result,
  industry,
  input,
}: {
  result: AssessmentResult
  industry: string
  /** The answers behind `result`; when given and they reproduce it, each answer's effect is shown. */
  input?: AssessmentInput
}) {
  const [open, setOpen] = useState(false)
  const working = riskScoreWorking(result, industry)
  const impacts = open && input ? answerImpacts(input, result, computeAssessment) : null
  // Quick assessments also expose contextual category scores, but those are
  // not the formula used for their headline. Never weight them as if they were.
  if (result.preBoostScore === undefined) {
    const recomputed = input ? computeAssessment(input) : null
    const additive =
      result.additiveScore ??
      (recomputed?.riskScore === result.riskScore ? recomputed.additiveScore : undefined)
    return (
      <div className="mt-4 print:hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="h-auto w-full justify-start gap-2 px-2 py-1.5 text-xs text-muted-foreground"
        >
          <Calculator size={13} aria-hidden="true" />
          <span>How this was calculated</span>
        </Button>
        {open && (
          <div className="mt-2 rounded-lg border border-border bg-muted/20 p-3 text-xs">
            {additive ? (
              <>
                <p>
                  Quick-assessment points are added, then limited to 0–100. The category scores are
                  context, not this calculation.
                </p>
                <table className="mt-2 w-full text-xs">
                  <thead>
                    <tr>
                      <th className="text-left">Input</th>
                      <th className="text-right">Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {additive.rows.map((row, index) => (
                      <tr key={`${index}-${row.label}`}>
                        <td className="py-1">{row.label}</td>
                        <td className="text-right font-mono">{row.points}</td>
                      </tr>
                    ))}
                    <tr>
                      <td className="font-semibold">Additive total</td>
                      <td className="text-right font-mono">{additive.total}</td>
                    </tr>
                  </tbody>
                </table>
                <p className="mt-2">
                  After the 0–100 limit: {result.riskScore}. This planning index is not a
                  probability of loss or a determination of obligations.
                </p>
              </>
            ) : (
              <p>
                The calculation breakdown is unavailable for this saved result. Run a new assessment
                to inspect its calculation; contextual category scores do not reconstruct this
                headline.
              </p>
            )}
          </div>
        )}
      </div>
    )
  }
  // The legacy additive scoring path produces no category scores, so there is
  // no weighted working to show. Rendering an empty disclosure would be worse
  // than rendering none — it would imply the number has a breakdown it doesn't.
  if (!working) return null

  return (
    <div className="mt-4 print:hidden">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="h-auto w-full justify-start gap-2 px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <Calculator size={13} aria-hidden="true" />
        <span className="flex-1 text-left">How this was calculated</span>
        <ChevronDown
          size={13}
          aria-hidden="true"
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </Button>

      {open && (
        <div className="mt-2 rounded-lg border border-border bg-muted/20 p-3">
          <p className="mb-2 text-[11px] leading-relaxed text-muted-foreground">
            Four category scores, each weighted for{' '}
            {working.weightSource === 'industry' ? (
              <>
                your industry (<span className="text-foreground">{industry}</span>)
              </>
            ) : (
              'the default profile — your industry has no weighting of its own'
            )}
            , then summed.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-[10px] uppercase tracking-wide text-muted-foreground">
                  <th className="py-1 text-left font-semibold">Category</th>
                  <th className="py-1 text-right font-semibold">Score</th>
                  <th className="py-1 text-right font-semibold">Weight</th>
                  <th className="py-1 text-right font-semibold">Points</th>
                </tr>
              </thead>
              <tbody>
                {working.rows.map((row) => (
                  <tr key={row.label} className="border-b border-border/50">
                    <td className="py-1.5 pr-2 text-foreground">
                      {row.label}
                      {row.note && (
                        <span className="block text-[10px] leading-snug text-muted-foreground">
                          {row.note}
                        </span>
                      )}
                    </td>
                    <td className="py-1.5 text-right font-mono text-muted-foreground">
                      {Math.round(row.score)}
                    </td>
                    <td className="py-1.5 text-right font-mono text-muted-foreground">
                      ×{row.weight}
                    </td>
                    <td className="py-1.5 text-right font-mono text-foreground">
                      {row.contribution.toFixed(1)}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td className="py-1.5 font-semibold text-foreground" colSpan={3}>
                    Weighted total
                  </td>
                  <td className="py-1.5 text-right font-mono font-semibold text-foreground">
                    {working.base.toFixed(1)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
            {result.preBoostScore !== undefined && result.preBoostScore !== result.riskScore ? (
              <>
                Rounded to <span className="text-foreground">{result.preBoostScore}</span>, then
                raised to <span className="text-foreground">{result.riskScore}</span> by the
                situational boosts listed above — each one a named combination of your own answers,
                capped in total so they cannot compound into a surprise.
              </>
            ) : (
              <>
                Rounded to <span className="text-foreground">{result.riskScore}</span>. No
                situational boost applied to your answers.
              </>
            )}
          </p>
          {impacts && (
            <div className="mt-3" data-testid="answer-impacts">
              <p className="mb-1.5 text-[11px] font-semibold text-foreground">
                How each answer moved the score
              </p>
              <p className="mb-2 text-[11px] leading-relaxed text-muted-foreground">
                Points are measured by re-running the score as if you had answered
                &ldquo;don&rsquo;t know&rdquo; to that question alone. The weights are this
                site&rsquo;s{' '}
                {working.weightSource === 'industry'
                  ? 'weighting for your industry'
                  : 'default weighting'}
                : modelling choices, not measured values.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border text-[10px] uppercase tracking-wide text-muted-foreground">
                      <th className="py-1 text-left font-semibold">Question</th>
                      <th className="py-1 text-left font-semibold">Where the value came from</th>
                      <th className="py-1 text-right font-semibold">Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {impacts.map((row) => (
                      <tr key={row.question} className="border-b border-border/50">
                        <td className="py-1.5 pr-2 text-foreground">{row.question}</td>
                        <td className="py-1.5 pr-2 text-muted-foreground">
                          {SOURCE_LABEL[row.source]}
                          {row.publishedData && row.source === 'yours' && (
                            <>, plus {row.publishedData}</>
                          )}
                        </td>
                        <td className="py-1.5 text-right font-mono text-foreground">
                          {row.source !== 'yours'
                            ? '—'
                            : row.points > 0
                              ? `+${row.points}`
                              : `${row.points}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
            Change any answer in the assessment and this table changes with it: the score is
            recomputed from your answers each time you run it.
          </p>
        </div>
      )}
    </div>
  )
}
