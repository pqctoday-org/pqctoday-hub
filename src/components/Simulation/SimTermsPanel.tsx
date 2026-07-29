// SPDX-License-Identifier: GPL-3.0-only
/**
 * SimTermsPanel (07-29 review U-M4/E3) — always-available terms reference for
 * the sim console. The plain-language GUIDED_DEFS previously existed ONLY for
 * players who enabled Guided mode during the tour; this panel surfaces the
 * same definitions on demand from the ⋯ MORE menu, plus an entry point to the
 * hub's full PQC glossary (the sim header intentionally has no standard page
 * header, so this is its glossary affordance).
 */
import { useEffect, useState } from 'react'
import { BookOpenText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Glossary } from '@/components/common/Glossary'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { GUIDED_DEFS } from './SimTour'

export function SimTermsPanel({ onClose }: { onClose: () => void }) {
  const trapRef = useFocusTrap(true)
  const [glossaryOpen, setGlossaryOpen] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !glossaryOpen) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, glossaryOpen])

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm">
      {/* Click-outside-to-close via a real button (QuarterReport's pattern) —
          keeps jsx-a11y happy without wiring click handlers on static divs. */}
      <Button
        type="button"
        variant="ghost"
        aria-label="Close terms"
        onClick={onClose}
        className="absolute inset-0 h-full w-full rounded-none bg-transparent p-0 hover:bg-transparent"
      />
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-label="Simulation terms"
        className="glass-panel relative z-10 max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border p-5 shadow-xl"
      >
        <div className="mb-1 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
          Terms
        </div>
        <h2 className="mb-3 text-base font-bold text-foreground">Plain-English sim vocabulary</h2>
        <dl className="space-y-3">
          {GUIDED_DEFS.map((d) => (
            <div key={d.title} className="rounded-lg border border-border bg-card p-3">
              <dt className="text-[13px] font-bold text-foreground">
                {d.title.replace(/^Plain English: /, '')}
              </dt>
              <dd className="mt-1 text-[12.5px] leading-snug text-muted-foreground">{d.body}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-4 flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setGlossaryOpen(true)}
          >
            <BookOpenText size={14} aria-hidden="true" />
            Open full PQC glossary
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
      {glossaryOpen && <Glossary isOpen={glossaryOpen} onClose={() => setGlossaryOpen(false)} />}
    </div>
  )
}
