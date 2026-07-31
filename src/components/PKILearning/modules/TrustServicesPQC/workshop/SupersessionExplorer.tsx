// SPDX-License-Identifier: GPL-3.0-only
/**
 * Standards Supersession Explorer.
 *
 * Shows the version pairs where a newer edition of the same standard added
 * post-quantum algorithms. This is the crypto-agility argument made from
 * primary documents rather than from principle — and a practical warning,
 * since the superseded editions are still widely cited.
 */
import { useState } from 'react'
import { GitCompareArrows, ExternalLink, AlertTriangle } from 'lucide-react'
import { Link } from 'react-router'
import { SUPERSESSION_PAIRS } from '../data/trustServicesData'
import { Button } from '@/components/ui/button'

export const SupersessionExplorer = () => {
  const [idx, setIdx] = useState(0)
  const pair = SUPERSESSION_PAIRS[idx] ?? SUPERSESSION_PAIRS[0]

  return (
    <div className="space-y-6">
      <section className="glass-panel p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <GitCompareArrows size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gradient">Standards Supersession Explorer</h3>
            <p className="text-sm text-muted-foreground">
              The same standard before and after post-quantum algorithms existed.
            </p>
          </div>
        </div>
        <fieldset className="border-0 p-0 m-0">
          <legend className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5">
            Standard family
          </legend>
          <div className="flex flex-wrap gap-1.5">
            {SUPERSESSION_PAIRS.map((p, i) => (
              <Button
                key={p.family}
                type="button"
                variant={idx === i ? 'gradient' : 'outline'}
                onClick={() => setIdx(i)}
                className="px-3 py-1 text-xs"
                aria-pressed={idx === i}
              >
                {p.family}
              </Button>
            ))}
          </div>
        </fieldset>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="glass-panel p-5 border border-border opacity-80">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Superseded</p>
          <h4 className="mt-1 font-semibold">{pair.older.label}</h4>
          <p className="text-xs text-muted-foreground">{pair.older.date}</p>
          <p className="mt-3 text-sm text-muted-foreground">{pair.older.algorithms}</p>
          <p className="mt-3 inline-flex items-center gap-1 text-xs text-status-warning">
            <AlertTriangle size={12} /> do not cite as current
          </p>
        </section>

        <section className="glass-panel p-5 border border-primary/30 bg-primary/5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Current</p>
          <h4 className="mt-1 font-semibold">{pair.newer.label}</h4>
          <p className="text-xs text-muted-foreground">{pair.newer.date}</p>
          <p className="mt-3 text-sm text-foreground">{pair.newer.algorithms}</p>
          {pair.newer.libraryRef && (
            <Link
              to={`/library?ref=${encodeURIComponent(pair.newer.libraryRef)}`}
              className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <ExternalLink size={12} /> Open in the Library
            </Link>
          )}
        </section>
      </div>

      <section className="glass-panel p-6">
        <p className="text-sm text-muted-foreground">{pair.lesson}</p>
      </section>
    </div>
  )
}
