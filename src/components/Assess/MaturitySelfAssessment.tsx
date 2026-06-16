// SPDX-License-Identifier: GPL-3.0-only
/**
 * MaturitySelfAssessment — the framework's overall Program Maturity diagnostic.
 *
 * Self-rate each of the seven domains on a 0–5 scale; overall program maturity
 * is the WEAKEST domain (a chain is only as strong as its weakest link).
 * Persisted to the shared assessment-result store so the Report, Command Center
 * and Simulation all read one "today maturity" signal.
 *
 * Source: Applied Quantum PQC Migration Framework v2.1 — Maturity Levels /
 * Assessment Across Seven Domains. Distinct from the per-phase 0–4 indicator
 * ladder in `phaseMaturity.ts`.
 */
import React from 'react'
import { Gauge, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAssessmentResultStore } from '@/store/useAssessmentResultStore'
import {
  MATURITY_DOMAINS,
  MATURITY_LEVELS,
  MATURITY_TARGET_TIMELINE,
  overallMaturity,
  type DomainId,
  type MaturityScores,
} from '@/data/maturityModel'

const SCORE_OPTIONS = [0, 1, 2, 3, 4, 5] as const

/** All domains start at 0 (not started). */
const initialScores = (): MaturityScores =>
  MATURITY_DOMAINS.reduce((acc, d) => {
    acc[d.id] = 0
    return acc
  }, {} as MaturityScores)

/** The descriptor for a given domain at a given score (0 = not started). */
function descriptorFor(domainId: DomainId, score: number): string {
  if (score === 0) return 'Not started'
  const domain = MATURITY_DOMAINS.find((d) => d.id === domainId)
  if (!domain) return ''
  return domain.levels[score as 1 | 2 | 3 | 4 | 5] ?? ''
}

export const MaturitySelfAssessment: React.FC = () => {
  const stored = useAssessmentResultStore((s) => s.maturity)
  const setMaturity = useAssessmentResultStore((s) => s.setMaturity)
  const scores = stored?.scores ?? initialScores()

  const setScore = (id: DomainId, value: number) => setMaturity({ ...scores, [id]: value })

  const overall = overallMaturity(scores)
  const overallLevel = MATURITY_LEVELS[overall]
  // The domain(s) pinned at the overall (minimum) score are the gating ones.
  const gatingDomainIds = MATURITY_DOMAINS.filter((d) => scores[d.id] === overall).map((d) => d.id)

  return (
    <div className="space-y-4">
      <header className="flex items-start gap-3">
        <Gauge size={24} className="text-primary shrink-0 mt-0.5" />
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            PQC Program Maturity — Seven-Domain Self-Assessment
          </h2>
          <p className="text-sm text-muted-foreground">
            Rate your program 0–5 in each of the seven domains. Your overall maturity is your
            weakest domain — a chain is only as strong as its weakest link.
          </p>
        </div>
      </header>

      {/* Overall maturity — prominent summary */}
      <section className="glass-panel border border-primary/40 rounded-lg p-4 space-y-1.5 bg-primary/5">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Overall maturity
          </span>
          <span className="text-2xl font-bold text-primary">
            Level {overall} — {overallLevel.name}
          </span>
        </div>
        <p className="text-sm text-foreground/90">{overallLevel.description}</p>
        <p className="text-xs text-muted-foreground">
          Overall = your weakest domain (a chain is only as strong as its weakest link).
        </p>
        {overall < 5 && gatingDomainIds.length > 0 && (
          <p className="text-xs text-warning">
            Gating domain{gatingDomainIds.length === 1 ? '' : 's'} (at Level {overall}):{' '}
            <span className="font-semibold">
              {gatingDomainIds
                .map((id) => MATURITY_DOMAINS.find((d) => d.id === id)?.name ?? id)
                .join(' · ')}
            </span>
          </p>
        )}
      </section>

      {/* Per-domain 0–5 selectors */}
      <section className="space-y-3">
        {MATURITY_DOMAINS.map((domain) => {
          const score = scores[domain.id]
          const isGating = overall < 5 && score === overall
          return (
            <div
              key={domain.id}
              className={`glass-panel border rounded-lg p-4 space-y-2 transition-colors ${
                isGating ? 'border-warning/50' : 'border-border'
              }`}
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h3 className="text-sm font-semibold text-foreground">{domain.name}</h3>
                {isGating && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-warning/15 text-warning">
                    Gating
                  </span>
                )}
              </div>
              <div
                className="flex flex-wrap gap-2"
                role="group"
                aria-label={`${domain.name} maturity score`}
              >
                {SCORE_OPTIONS.map((value) => {
                  const on = score === value
                  return (
                    <Button
                      key={value}
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setScore(domain.id, value)}
                      aria-pressed={on}
                      className={`h-7 w-9 rounded-full border text-[11px] font-semibold transition-all ${
                        on
                          ? 'border-primary/40 bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      {value}
                    </Button>
                  )
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground/80">Level {score}:</span>{' '}
                {descriptorFor(domain.id, score)}
              </p>
            </div>
          )
        })}
      </section>

      {/* Target trajectory reference */}
      <section className="glass-panel border border-border rounded-lg p-4 space-y-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Target size={16} className="text-primary" />
          Target trajectory
        </h3>
        <ul className="space-y-1">
          {MATURITY_TARGET_TIMELINE.map((m) => (
            <li key={m.milestone} className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground/80">{m.milestone}:</span> {m.detail}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

export default MaturitySelfAssessment
