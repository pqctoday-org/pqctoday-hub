// SPDX-License-Identifier: GPL-3.0-only
//
// The persistent step-map rail — domain-grouped steps with progress, time-left,
// answered ticks and click-to-edit on any reached step. Replaces the legacy thin
// StepIndicator.
import React, { useState } from 'react'
import { Check, Zap, ChevronDown } from 'lucide-react'
import { Button } from '../../ui/button'
import { DOMAIN_META, TONES } from './tones'
import { STEP_META, type AssessStepKey, type AssessTrack } from './assessFlowModel'
import type { AssessFlow } from './useAssessFlow'

interface AssessStepRailProps {
  flow: AssessFlow
  mode: AssessTrack
  onSwitchToFull: () => void
}

export const AssessStepRail: React.FC<AssessStepRailProps> = ({ flow, mode, onSwitchToFull }) => {
  const { renderOrder, stepIdx, maxIdx, isValid, activeKey } = flow
  const furthest = Math.max(maxIdx, stepIdx)
  // The step map is collapsed by default on mobile (< lg) and shown as a tappable
  // progress header; on lg+ it is always expanded as the sticky rail.
  const [expanded, setExpanded] = useState(false)
  const currentDomain = DOMAIN_META[STEP_META[activeKey].domain]

  // A required step is "answered" once its validator passes (value or "not sure").
  // A freely-optional step (compliance/use-cases/infra) shows a tick once the
  // user has moved past it.
  const isAnswered = (key: AssessStepKey, i: number) =>
    STEP_META[key].freelyOptional ? i < furthest : isValid(key)

  const answeredCount = renderOrder.filter((k, i) => isAnswered(k, i)).length
  const total = renderOrder.length
  const pct = Math.round((answeredCount / total) * 100)
  const minsLeft = Math.max(1, Math.round((total - answeredCount) * 0.4))

  // Precompute where a domain header starts (no render-time mutation).
  const showHeaderAt = renderOrder.map(
    (k, i) =>
      // eslint-disable-next-line security/detect-object-injection
      i === 0 || STEP_META[k].domain !== STEP_META[renderOrder[i - 1]].domain
  )

  return (
    <aside className="w-full lg:sticky lg:top-4 lg:w-[236px] lg:shrink-0">
      <div className="glass-panel p-3.5">
        {/* Header: tappable progress toggle on mobile; static on lg+. */}
        <Button
          variant="ghost"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          className="mb-1.5 h-auto w-full items-center justify-between gap-2 p-0 hover:bg-transparent lg:pointer-events-none"
        >
          <span className="flex min-w-0 flex-col text-left">
            <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground/70">
              {answeredCount} of {total} answered
            </span>
            <span className="truncate text-[11px] font-medium text-muted-foreground lg:hidden">
              Step {stepIdx + 1} of {total} · {currentDomain.label}
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-1.5">
            <span className="font-mono text-[10.5px] text-primary">~{minsLeft} min left</span>
            <ChevronDown
              size={15}
              className={`text-muted-foreground transition-transform lg:hidden ${expanded ? 'rotate-180' : ''}`}
            />
          </span>
        </Button>
        <div className="mb-3.5 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width]"
            style={{ width: `${pct}%` }}
          />
        </div>

        <ol className={`flex-col gap-0.5 lg:flex ${expanded ? 'flex' : 'hidden'}`}>
          {renderOrder.map((key, i) => {
            const meta = STEP_META[key]
            // eslint-disable-next-line security/detect-object-injection
            const showHeader = showHeaderAt[i]
            const domain = DOMAIN_META[meta.domain]
            const current = i === stepIdx
            const answered = isAnswered(key, i)
            const reachable = i <= furthest

            return (
              <li key={key}>
                {showHeader && (
                  <div
                    className={`px-1 pb-1 pt-2.5 text-[9.5px] font-bold uppercase tracking-wide ${TONES[domain.tone].text}`}
                  >
                    {domain.label}
                  </div>
                )}
                <Button
                  variant="ghost"
                  disabled={!reachable}
                  onClick={() => flow.jumpTo(i)}
                  aria-current={current ? 'step' : undefined}
                  className={[
                    'h-auto w-full justify-start gap-2.5 rounded-lg px-2 py-1.5 text-left',
                    current
                      ? 'border border-primary/35 bg-primary/10 hover:bg-primary/10'
                      : 'border border-transparent hover:bg-muted/50',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                      answered && !current
                        ? 'bg-status-success/15 text-status-success'
                        : current
                          ? 'bg-primary text-primary-foreground'
                          : 'border border-border bg-muted text-muted-foreground',
                    ].join(' ')}
                  >
                    {answered && !current ? <Check size={12} strokeWidth={3} /> : i + 1}
                  </span>
                  <span
                    className={[
                      'min-w-0 flex-1 truncate text-xs',
                      current
                        ? 'font-bold text-foreground'
                        : reachable
                          ? 'font-medium text-foreground/80'
                          : 'text-muted-foreground/60',
                    ].join(' ')}
                  >
                    {meta.label}
                  </span>
                </Button>
              </li>
            )
          })}
        </ol>
      </div>

      {mode === 'quick' && (
        <div className="mt-3 hidden rounded-xl border border-status-warning/30 bg-status-warning/10 p-3 lg:block">
          <div className="mb-1 text-[11px] font-bold text-status-warning">
            Fast track → partial report
          </div>
          <p className="mb-2.5 text-[11px] leading-relaxed text-muted-foreground">
            The algorithm map, dated roadmap &amp; trending need the 5 extra full-track questions.
          </p>
          <Button
            variant="ghost"
            onClick={onSwitchToFull}
            className="h-auto w-full gap-1.5 rounded-lg border border-status-warning/40 bg-status-warning/15 py-1.5 text-[11px] font-bold text-status-warning hover:bg-status-warning/20 hover:text-status-warning"
          >
            <Zap size={12} />
            Switch to full track →
          </Button>
        </div>
      )}
    </aside>
  )
}
