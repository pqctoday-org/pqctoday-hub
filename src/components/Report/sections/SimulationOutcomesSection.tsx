// SPDX-License-Identifier: GPL-3.0-only
/**
 * Simulation outcomes — Report render surface (Wave 5, WP5.1). Framework 2.1's
 * "communicate" expression for p5's pilot-results ref and verify-close's
 * closure-record ref, both previously 'gap'/'partial' (frameworkPhases.ts) —
 * the sim-roadmap ExecutiveDocument (simRoadmap.ts) already carried a
 * structured `inputs` blob, it just had nowhere to render on /report.
 *
 * Reads the newest 'sim-roadmap' doc directly (own data fetch, CbomSection-
 * style) rather than taking assessment-derived props — a simulation run and
 * an assessment are independent artifacts. Every Wave-5 field on
 * SimRoadmapInput is optional and additive: a doc committed before this
 * section existed still renders (phases/readiness/clock), it just won't show
 * the grade/objectives/closure blocks until the player re-commits.
 */
import { PlayCircle, ShieldCheck, ListChecks, Award, ArrowRight, Lock } from 'lucide-react'
import { Link } from 'react-router'
import { CollapsibleSection } from './reportContentShared'
import { useSavedArtifactDocuments } from '@/hooks/useSavedArtifactInputs'
import type { SimRoadmapInput } from '@/simulation/simRoadmap'
import type { RunScoreBreakdown } from '@/simulation/runScore'

const GRADE_TONE: Record<RunScoreBreakdown['grade'], string> = {
  A: 'bg-success/15 text-success border-success/30',
  B: 'bg-primary/15 text-primary border-primary/30',
  C: 'bg-warning/15 text-warning border-warning/30',
  D: 'bg-destructive/15 text-destructive border-destructive/30',
}

function formatDate(ts: number | undefined): string {
  if (!ts) return 'an earlier date'
  return new Date(ts).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function PhaseList({ phases }: { phases: SimRoadmapInput['phases'] }) {
  return (
    <ul className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
      {phases.map((p) => (
        <li
          key={p.id}
          className={`flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-xs ${
            p.cleared
              ? 'border-success/30 bg-success/5 text-success'
              : 'border-border bg-muted/20 text-muted-foreground'
          }`}
        >
          <span className="font-medium">{p.name}</span>
          <span className="font-mono">{p.cleared ? '✓' : `L${p.level}`}</span>
        </li>
      ))}
    </ul>
  )
}

function ObjectivesList({
  objectives,
}: {
  objectives: NonNullable<SimRoadmapInput['objectives']>
}) {
  return (
    <ul className="space-y-1.5">
      {objectives.map((o) => (
        <li
          key={o.id}
          className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold ${
            o.done && (o.achievedYear == null || o.achievedYear <= o.byYear)
              ? 'bg-success/10 text-success'
              : 'bg-warning/10 text-warning'
          }`}
        >
          <span className="flex-1 text-foreground">{o.label}</span>
          <span className="font-mono text-xs">
            {o.done
              ? o.achievedYear != null
                ? `✓ ${o.achievedYear}`
                : `✓ by ${o.byYear}`
              : `— by ${o.byYear}`}
          </span>
        </li>
      ))}
    </ul>
  )
}

export function SimulationOutcomesSection({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const docs = useSavedArtifactDocuments('sim-roadmap')
  const latest = docs[0]
  const r = latest?.inputs as SimRoadmapInput | undefined

  return (
    <CollapsibleSection
      id="report-section-simulation-outcomes"
      title="Simulation Outcomes"
      icon={<PlayCircle className="text-primary" size={20} />}
      defaultOpen={defaultOpen}
    >
      {!r ? (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Play the Migration Simulation and commit your run to the Command Center to see your
            pilot/wave progress, readiness and compliance, and (once verified) a closure record
            here.
          </p>
          <Link
            to="/simulation"
            className="flex items-center gap-1.5 text-xs text-primary hover:underline print:hidden"
          >
            <ArrowRight size={12} />
            Open the Simulation
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          <p className="text-sm leading-relaxed text-muted-foreground">
            From your {r.sector} · {r.size} · {r.country} simulation run ({r.difficulty} mode),
            committed {formatDate(latest?.createdAt)} — {r.clearedCount}/{r.totalPhases} phases
            cleared.
          </p>

          <section aria-labelledby="sim-outcomes-readiness">
            <h4
              id="sim-outcomes-readiness"
              className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground"
            >
              <ShieldCheck size={14} className="text-primary" aria-hidden="true" />
              Readiness &amp; compliance at commit
            </h4>
            <div className="flex flex-wrap gap-3">
              <div className="min-w-[8rem] rounded-lg border border-border bg-muted/30 px-4 py-3">
                <span className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Readiness
                </span>
                <span className="text-xl font-bold text-foreground">{r.readinessPct}%</span>
              </div>
              {r.compliancePct != null && (
                <div className="min-w-[8rem] rounded-lg border border-border bg-muted/30 px-4 py-3">
                  <span className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Compliance
                  </span>
                  <span className="text-xl font-bold text-foreground">{r.compliancePct}%</span>
                </div>
              )}
              <div className="min-w-[8rem] rounded-lg border border-border bg-muted/30 px-4 py-3">
                <span className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Years to Q-Day
                </span>
                <span className="text-xl font-bold text-foreground">{r.yearsToHorizon}y</span>
              </div>
            </div>
          </section>

          <section aria-labelledby="sim-outcomes-phases">
            <h4
              id="sim-outcomes-phases"
              className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground"
            >
              <ListChecks size={14} className="text-primary" aria-hidden="true" />
              Phase maturity
            </h4>
            <PhaseList phases={r.phases} />
          </section>

          {r.objectives && r.objectives.length > 0 && (
            <section aria-labelledby="sim-outcomes-objectives">
              <h4
                id="sim-outcomes-objectives"
                className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground"
              >
                <ListChecks size={14} className="text-primary" aria-hidden="true" />
                Transformation objectives, with dates
              </h4>
              <ObjectivesList objectives={r.objectives} />
            </section>
          )}

          {r.score && (
            <section aria-labelledby="sim-outcomes-grade">
              <h4
                id="sim-outcomes-grade"
                className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground"
              >
                <Award size={14} className="text-primary" aria-hidden="true" />
                Run grade
              </h4>
              <div
                className={`inline-flex items-center gap-3 rounded-xl border px-4 py-3 ${GRADE_TONE[r.score.grade]}`}
                data-testid="sim-outcomes-grade-card"
              >
                <span className="text-2xl font-black leading-none">{r.score.grade}</span>
                <span className="text-xs">
                  pace {r.score.paceScore} · discipline {r.score.trapScore} · compliance{' '}
                  {r.score.complianceScore} · on-time {r.score.onTimeScore}
                </span>
              </div>
            </section>
          )}

          {r.verifyCloseCleared && (
            <section
              aria-labelledby="sim-outcomes-closure"
              className="rounded-lg border-l-4 border-l-success bg-success/5 p-3"
            >
              <h4
                id="sim-outcomes-closure"
                className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-success"
              >
                <Lock size={14} aria-hidden="true" />
                Closure record
              </h4>
              <p className="text-xs text-muted-foreground">
                Verification &amp; Closure cleared in this run — classical key material logged
                decommissioned against the 5-point evidence standard. Full evidence dossier lives in
                the Migration Verification business tool.
              </p>
            </section>
          )}

          <div className="border-t border-border pt-2">
            <Link
              to="/simulation"
              className="flex items-center gap-1.5 text-xs text-primary hover:underline print:hidden"
            >
              <ArrowRight size={12} />
              Return to the Simulation to keep playing or re-commit
            </Link>
          </div>
        </div>
      )}
    </CollapsibleSection>
  )
}
