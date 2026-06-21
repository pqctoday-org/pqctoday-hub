// SPDX-License-Identifier: GPL-3.0-only
/**
 * PatentsScopeControl — a labelled segmented control replacing the live page's
 * near-invisible top-right `Switch`. Makes the corpus scope (and the fact that
 * every number below is filtered by it) explicit. Drives `pqcOnly`.
 */
import { ShieldCheck, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PatentsScopeControlProps {
  pqcOnly: boolean
  onChange: (pqcOnly: boolean) => void
}

const SEG_BASE = 'h-auto gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-bold transition-colors'

export function PatentsScopeControl({ pqcOnly, onChange }: PatentsScopeControlProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <span className="shrink-0 font-mono text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        Corpus scope
      </span>
      <div role="radiogroup" aria-label="Corpus scope" className="flex items-center gap-1.5">
        <Button
          type="button"
          variant="ghost"
          role="radio"
          aria-checked={pqcOnly}
          onClick={() => onChange(true)}
          className={`${SEG_BASE} ${
            pqcOnly
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'border border-input text-muted-foreground hover:text-foreground'
          }`}
        >
          <ShieldCheck size={14} aria-hidden="true" />
          PQC &amp; hybrid
        </Button>
        <Button
          type="button"
          variant="ghost"
          role="radio"
          aria-checked={!pqcOnly}
          onClick={() => onChange(false)}
          className={`${SEG_BASE} ${
            !pqcOnly
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'border border-input text-muted-foreground hover:text-foreground'
          }`}
        >
          <Layers size={14} aria-hidden="true" />
          All crypto
        </Button>
      </div>
      <span className="text-[12px] text-muted-foreground">
        {pqcOnly
          ? 'Showing patents that use post-quantum or hybrid cryptography.'
          : 'Showing the full corpus, including classical-only patents.'}
      </span>
    </div>
  )
}
