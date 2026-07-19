// SPDX-License-Identifier: GPL-3.0-only
//
// Completion screen — hands off to the report; on fast track it foreshadows the
// genuinely-locked sections with the gold fast→full upgrade affordance.
import React, { useState } from 'react'
import { Check, Lock, RotateCcw, FileBarChart, ChevronDown } from 'lucide-react'
import { Button } from '../../ui/button'
import { FAST_LOCKED_COUNT } from './reportContract'
import { RENDER_ORDER_QUICK, RENDER_ORDER_FULL, type AssessTrack } from './assessFlowModel'
import { useAssessmentResultStore } from '../../../store/useAssessmentResultStore'
import { twoTrackFromAssess } from '../../../simulation/assessBridge'
import { indicativeMaturity, MATURITY_LEVELS } from '../../../data/maturityModel'

const REMAINING_FULL_QUESTIONS = RENDER_ORDER_FULL.length - RENDER_ORDER_QUICK.length

interface AssessDoneProps {
  mode: AssessTrack
  onViewReport: () => void
  onRetake: () => void
  /** Fast track only — resume into the full track at the first full-only question. */
  onContinueToFull: () => void
  /** WP5.6 — the indicative maturity band's "play the simulation" link. */
  onPlaySimulation: () => void
}

export const AssessDone: React.FC<AssessDoneProps> = ({
  mode,
  onViewReport,
  onRetake,
  onContinueToFull,
  onPlaySimulation,
}) => {
  const isFast = mode === 'quick'
  // WP5.6 — read-only reuse of assessBridge/maturityModel primitives already
  // built for the simulation, surfaced here so /assess stops dead-ending two
  // diagnostics the assessment already computes. Both undefined-safe: a plan
  // with neither actions nor effort yields no two-track section at all.
  const lastResult = useAssessmentResultStore((s) => s.lastResult)
  const twoTrack = lastResult ? twoTrackFromAssess(lastResult) : undefined
  const maturity = indicativeMaturity(!!lastResult)
  const maturityLevel = MATURITY_LEVELS[maturity.overall]
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false)

  return (
    <div className="mx-auto max-w-[620px] pt-6 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-status-success/40 bg-status-success/10">
        <Check className="text-status-success" size={30} strokeWidth={2.4} />
      </div>
      <h2 className="mb-1.5 text-[23px] font-bold text-foreground">Assessment complete</h2>
      <p className="mx-auto mb-5 max-w-[460px] text-[13.5px] leading-relaxed text-muted-foreground">
        {isFast
          ? 'Your fast-track report is ready — risk score, key findings, threat landscape, assessment profile, compliance impact and recommended actions.'
          : 'Your full report is ready — every section unlocked, including the per-domain breakdown, algorithm migration map, dated roadmap and progress trending.'}
      </p>

      {isFast && (
        <div className="mb-5 flex items-center gap-3.5 rounded-2xl border border-status-warning/30 bg-status-warning/10 p-4 text-left">
          <Lock className="shrink-0 text-status-warning" size={22} />
          <div className="flex-1">
            <div className="text-[13px] font-bold text-status-warning">
              {FAST_LOCKED_COUNT} report sections are still locked
            </div>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              Your per-domain risk breakdown &amp; progress-over-time tracking unlock with{' '}
              {REMAINING_FULL_QUESTIONS} more questions.
            </p>
          </div>
          <Button variant="gradient" onClick={onContinueToFull} className="shrink-0 font-bold">
            Continue →
          </Button>
        </div>
      )}

      <div className="flex justify-center gap-3">
        <Button variant="outline" onClick={onRetake} className="gap-1.5">
          <RotateCcw size={14} />
          Retake
        </Button>
        <Button variant="gradient" onClick={onViewReport} className="gap-2 font-bold">
          <FileBarChart size={16} />
          View my risk report
        </Button>
      </div>

      {/* WP5.6 — modest, collapsed-by-default diagnostic preview. Lowest-risk
          placement: below the primary completion content, opt-in to expand. */}
      <div className="mt-6 rounded-xl border border-border bg-card/40 text-left">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setDiagnosticsOpen((o) => !o)}
          aria-expanded={diagnosticsOpen}
          aria-controls="assess-done-diagnostics"
          className="flex h-auto w-full items-center justify-between gap-2 p-4 text-sm font-semibold text-foreground"
        >
          Diagnostic preview — sequencing &amp; maturity
          <ChevronDown
            size={16}
            className={`text-muted-foreground transition-transform duration-200 ${diagnosticsOpen ? 'rotate-180' : ''}`}
          />
        </Button>
        {diagnosticsOpen && (
          <div id="assess-done-diagnostics" className="space-y-4 border-t border-border p-4 pt-4">
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Indicative program maturity
              </div>
              <p className="text-[13px] text-foreground">
                Level {maturity.overall} — {maturityLevel.name}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                {maturityLevel.description}. Indicative from this assessment alone — completing it
                establishes awareness (Level 1); higher levels are only ever earned by playing the{' '}
                <Button
                  type="button"
                  variant="link"
                  onClick={onPlaySimulation}
                  className="h-auto p-0 text-primary underline underline-offset-2"
                >
                  PQC migration simulation
                </Button>
                .
              </p>
            </div>

            {twoTrack && (
              <div>
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Two-track sequencing
                </div>
                <p className="mb-2 text-xs leading-relaxed text-muted-foreground">
                  {twoTrack.summary}
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {[twoTrack.trackA, twoTrack.trackB].map((t) => (
                    <div key={t.id} className="rounded-lg border border-border p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-foreground">{t.label}</span>
                        {t.id === twoTrack.leadTrack && (
                          <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                            Lead
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground">{t.focus}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {t.actions.length} action{t.actions.length === 1 ? '' : 's'} ·{' '}
                        {t.effort.length} effort item{t.effort.length === 1 ? '' : 's'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
