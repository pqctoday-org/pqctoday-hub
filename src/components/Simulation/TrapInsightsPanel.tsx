// SPDX-License-Identifier: GPL-3.0-only
/**
 * TrapInsightsPanel (PR-5) — a local dashboard over the misconception telemetry
 * the sim records. Ranks the Common-Failure (trap) moves the player has fallen
 * for, most-frequent first, and deep-links each to the Learn module that fixes
 * it — closing the loop from "where I struggle" to "the lesson that helps".
 *
 * Reads the local tally (simTrapTally) and refreshes live on the TRAP_EVENT a
 * pick dispatches. Collapsed by default to keep the console light.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { ChevronDown, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  readTrapTally,
  clearTrapTally,
  remediation,
  phaseName,
  TRAP_EVENT,
  type TrapTallyEntry,
} from './simTrapTally'

export function TrapInsightsPanel() {
  const [tally, setTally] = useState<TrapTallyEntry[]>(() => readTrapTally())
  const [expanded, setExpanded] = useState(false)
  useEffect(() => {
    const refresh = () => setTally(readTrapTally())
    window.addEventListener(TRAP_EVENT, refresh)
    return () => window.removeEventListener(TRAP_EVENT, refresh)
  }, [])
  const total = tally.reduce((n, e) => n + e.count, 0)

  return (
    <section
      className="glass-panel mb-4 border border-border p-4"
      data-testid="trap-insights"
      aria-labelledby="trap-insights-heading"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-warning" aria-hidden="true" />
          <div>
            <h2
              id="trap-insights-heading"
              className="flex flex-wrap items-center gap-2 text-base font-bold text-foreground"
            >
              Trap insights
              <span className="rounded border border-warning/30 bg-warning/10 px-1.5 py-0.5 text-sim-chip font-medium uppercase tracking-wide text-warning">
                where you struggle
              </span>
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              The Common Failures you&rsquo;ve fallen for, ranked — each links to the lesson that
              fixes it.
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-controls="trap-insights-body"
          className="shrink-0 gap-1 text-xs"
        >
          {expanded ? 'Hide' : `Show${total ? ` (${tally.length})` : ''}`}
          <ChevronDown
            size={14}
            aria-hidden="true"
            className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
        </Button>
      </div>

      {expanded && (
        <div id="trap-insights-body" className="mt-4">
          {total === 0 ? (
            <p className="text-xs text-muted-foreground">
              No misconceptions recorded yet — a wrong &ldquo;next move&rdquo; pick lands here so
              you can see where to study.
            </p>
          ) : (
            <>
              <ol className="space-y-1.5" data-testid="trap-insights-list">
                {tally.map((e, i) => {
                  const rem = remediation(e.phaseId, e.label)
                  return (
                    <li
                      key={`${e.phaseId} ${e.label}`}
                      className="flex items-start gap-2.5 rounded-md border border-border bg-muted/20 px-2.5 py-1.5"
                    >
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-warning/15 text-sim-chip font-bold text-warning">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[12px] font-semibold text-foreground">{e.label}</div>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sim-chip text-muted-foreground">
                          <span className="font-mono">{phaseName(e.phaseId)}</span>
                          <span>· fell for it {e.count}×</span>
                          {rem && (
                            <Link
                              to={rem.to}
                              className="font-semibold text-primary underline-offset-2 hover:underline"
                              data-testid="trap-remediation-link"
                            >
                              → Learn: {rem.label}
                            </Link>
                          )}
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ol>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearTrapTally()}
                className="mt-2 text-xs text-muted-foreground"
              >
                Clear tally
              </Button>
            </>
          )}
        </div>
      )}
    </section>
  )
}
