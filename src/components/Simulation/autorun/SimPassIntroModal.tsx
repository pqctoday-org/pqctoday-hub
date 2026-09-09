// SPDX-License-Identifier: GPL-3.0-only
/**
 * SimPassIntroModal — the card shown before each MATURITY PASS of the auto-run.
 *
 * Framework 2.1 is explicit that phases are not a clean waterfall — the program climbs
 * maturity together across overlapping phases. The auto-run reflects that as four passes
 * (Establish → Protect → Scale → Optimise), each raising every phase one level. This modal
 * introduces the current pass + its scenario milestone anchor (the June 2026 US PQC Executive Order).
 */
import { useEffect, useRef } from 'react'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { Button } from '@/components/ui/button'
import type { PassIntro } from './useSimAutoRunPlayer'

export function SimPassIntroModal({ pass, onBegin }: { pass: PassIntro; onBegin: () => void }) {
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
        aria-labelledby="sim-pass-intro-heading"
        className="flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
      >
        <div className="shrink-0 border-b border-border bg-gradient-to-r from-primary/15 to-secondary/15 px-6 py-4">
          <div className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
            Maturity climb · {pass.level} of 4
          </div>
          <h2 id="sim-pass-intro-heading" className="mt-1 text-lg font-extrabold text-foreground">
            {pass.name}
          </h2>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <p className="text-[13.5px] leading-relaxed text-muted-foreground">{pass.summary}</p>
          {/* W7.2 — a chapter states what it costs, what it produces, and ends
              by asking the learner to account for a change. Effort is measured
              from this pass's own steps (W7.3), not advertised. */}
          <dl className="mt-3 space-y-1.5 rounded-lg border border-border bg-muted/40 p-3">
            <div className="flex justify-between gap-3">
              <dt className="text-sim-micro text-muted-foreground">Estimated effort</dt>
              <dd className="text-sim-micro font-bold text-foreground">
                ~{pass.effortMinutes} min
              </dd>
            </div>
            <div>
              <dt className="text-sim-micro text-muted-foreground">Evidence this produces</dt>
              <dd className="text-sim-micro font-semibold text-foreground">{pass.evidence}</dd>
            </div>
            <div>
              <dt className="text-sim-micro text-muted-foreground">Think about as you go</dt>
              <dd className="text-sim-micro italic text-foreground">{pass.reflection}</dd>
            </div>
          </dl>
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
            Begin this pass →
          </Button>
        </div>
      </div>
    </div>
  )
}
