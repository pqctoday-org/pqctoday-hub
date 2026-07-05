// SPDX-License-Identifier: GPL-3.0-only
/**
 * SimPhaseIntroModal — the "what to expect" card shown the FIRST time each phase is
 * focused in the auto-run. All content is the verbatim framework summary / gate /
 * activities from `frameworkPhaseIntros.generated.ts` (extracted from
 * framework-2.1.json, the SoT) — nothing is authored here.
 */
import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { FRAMEWORK_PHASE_INTROS } from '@/data/frameworkPhaseIntros.generated'
import type { PhaseId } from '@/data/frameworkPhases'

export function SimPhaseIntroModal({ phase, onBegin }: { phase: PhaseId; onBegin: () => void }) {
  // eslint-disable-next-line security/detect-object-injection
  const intro = FRAMEWORK_PHASE_INTROS[phase]
  const beginRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    beginRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onBegin()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onBegin])

  if (!intro) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sim-phase-intro-heading"
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
      >
        <div className="shrink-0 border-b border-border bg-gradient-to-r from-primary/15 to-secondary/15 px-6 py-4">
          <div className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
            Up next · what to expect
          </div>
          <h2 id="sim-phase-intro-heading" className="mt-1 text-lg font-extrabold text-foreground">
            {intro.name}
          </h2>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
          <p className="text-[13.5px] leading-relaxed text-muted-foreground">{intro.summary}</p>

          {intro.gate && (
            <div className="rounded-lg border border-border bg-muted/40 p-3">
              <div className="font-mono text-[11px] font-bold uppercase tracking-wide text-primary">
                Exit gate
              </div>
              <p className="mt-1 text-[12.5px] leading-relaxed text-foreground">{intro.gate}</p>
            </div>
          )}

          {intro.activities.length > 0 && (
            <div>
              <div className="font-mono text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                You&rsquo;ll work through ({intro.activities.length})
              </div>
              <ul className="mt-2 space-y-2">
                {intro.activities.map((a) => (
                  <li
                    key={a.title}
                    className="rounded-lg border border-border bg-background/50 p-2.5"
                  >
                    <div className="text-[13px] font-bold text-foreground">{a.title}</div>
                    {a.do && (
                      <div className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">
                        {a.do}
                      </div>
                    )}
                    {a.output && (
                      <div className="mt-1 font-mono text-[11px] text-primary">
                        → produces: {a.output}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
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
            Begin this phase →
          </Button>
        </div>
      </div>
    </div>
  )
}
