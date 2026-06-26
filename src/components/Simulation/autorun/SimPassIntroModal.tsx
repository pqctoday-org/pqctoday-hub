// SPDX-License-Identifier: GPL-3.0-only
/**
 * SimPassIntroModal — the card shown before each MATURITY PASS of the auto-run.
 *
 * Framework 2.1 is explicit that phases are not a clean waterfall — the program climbs
 * maturity together across overlapping phases. The auto-run reflects that as four passes
 * (Establish → Protect → Scale → Optimise), each raising every phase one level. This modal
 * introduces the current pass + its scenario milestone anchor (the June 2026 US PQC Executive Order).
 */
import { Button } from '@/components/ui/button'
import type { PassIntro } from './useSimAutoRunPlayer'

export function SimPassIntroModal({ pass, onBegin }: { pass: PassIntro; onBegin: () => void }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="shrink-0 border-b border-border bg-gradient-to-r from-primary/15 to-secondary/15 px-6 py-4">
          <div className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
            Maturity climb · {pass.level} of 4
          </div>
          <h2 className="mt-1 text-lg font-extrabold text-foreground">{pass.name}</h2>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <p className="text-[13.5px] leading-relaxed text-muted-foreground">{pass.summary}</p>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border px-6 py-3">
          <span className="font-mono text-[11px] text-muted-foreground">
            Applied Quantum PQC Migration Framework v2.1
          </span>
          <Button
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
