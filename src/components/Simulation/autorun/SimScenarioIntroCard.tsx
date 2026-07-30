// SPDX-License-Identifier: GPL-3.0-only
/**
 * SimScenarioIntroCard — the one-time scenario-framing card shown at the very start
 * of the auto-run (before the first maturity pass). For the US scenario it frames
 * the US PQC executive order; other countries degrade to a generic national framing. All
 * years / standards are pulled LIVE from getScenario() — nothing is hardcoded here.
 */
import { useEffect, useRef } from 'react'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { Button } from '@/components/ui/button'
import type { ScenarioIntro } from './useSimAutoRunPlayer'

export function SimScenarioIntroCard({
  scenario,
  onBegin,
}: {
  scenario: ScenarioIntro
  onBegin: () => void
}) {
  const beginRef = useRef<HTMLButtonElement>(null)
  const trapRef = useFocusTrap(true)

  useEffect(() => {
    beginRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onBegin()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onBegin])

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm">
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sim-scenario-intro-heading"
        className="flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
      >
        <div className="shrink-0 border-b border-border bg-gradient-to-r from-primary/15 to-secondary/15 px-6 py-4">
          <div className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
            The scenario · why this clock
          </div>
          <h2
            id="sim-scenario-intro-heading"
            className="mt-1 text-lg font-extrabold text-foreground"
          >
            {scenario.title}
          </h2>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <p className="text-[13.5px] leading-relaxed text-muted-foreground">{scenario.summary}</p>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border px-6 py-3">
          <span className="font-mono text-[11px] text-muted-foreground">
            Applied Quantum PQC Migration Framework v2.1 by Marin Ivezić ·{' '}
            <a
              href="https://creativecommons.org/licenses/by/4.0/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              CC BY 4.0
            </a>
          </span>
          <Button
            ref={beginRef}
            onClick={onBegin}
            className="h-auto rounded-lg bg-primary px-5 py-2 text-[13px] font-extrabold text-background hover:opacity-90"
          >
            Begin the run →
          </Button>
        </div>
      </div>
    </div>
  )
}
