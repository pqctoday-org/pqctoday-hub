// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Spec vs Quantum.
 *
 * Pick an edition and see which public-key mechanisms it specifies and whether its text
 * mentions quantum computing. The central distinction of the lesson lives here: a statement
 * about a document is not a statement about what anyone plans.
 */
import { useState } from 'react'
import { FileSearch, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EDITIONS } from '../data/editionData'

export const SpecVsQuantum = () => {
  const [selectedId, setSelectedId] = useState(EDITIONS[0].id)
  const e = EDITIONS.find((x) => x.id === selectedId) ?? EDITIONS[0]

  return (
    <div className="space-y-6">
      <section className="glass-panel p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileSearch size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gradient">Spec vs Quantum</h3>
            <p className="text-sm text-muted-foreground">
              What does each edition specify, and what does its text say about quantum computing?
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Edition">
          {EDITIONS.map((x) => (
            <Button
              key={x.id}
              type="button"
              variant={selectedId === x.id ? 'gradient' : 'outline'}
              onClick={() => setSelectedId(x.id)}
              className="px-3 py-1 text-xs"
              aria-pressed={selectedId === x.id}
            >
              {x.name}
            </Button>
          ))}
        </div>
      </section>

      <section className="glass-panel p-6 space-y-4" aria-live="polite">
        <h4 className="font-semibold">
          {e.name}: {e.edition}
        </h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="p-4 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Public-key mechanisms this lesson draws from it
            </p>
            {e.publicKey.length > 0 ? (
              <ul className="mt-1 list-disc pl-5 text-sm text-foreground space-y-1">
                {e.publicKey.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-sm text-foreground">None</p>
            )}
          </div>
          <div className="p-4 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Symmetric and hash primitives drawn from it
            </p>
            <ul className="mt-1 list-disc pl-5 text-sm text-foreground space-y-1">
              {e.other.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="p-4 rounded-lg bg-status-info/10 border border-status-info/30">
          <p className="text-sm text-foreground">
            <strong>Does the text of this edition mention quantum computing?</strong>{' '}
            {e.mentionsQuantum ? 'Yes.' : 'No.'}
          </p>
        </div>
        <p className="text-sm text-muted-foreground">{e.scope}</p>
        <p className="text-xs text-muted-foreground flex items-start gap-2">
          <Info size={14} className="mt-0.5 shrink-0" />
          <span>
            “This edition does not mention quantum computing” describes one document. It does not
            say that anyone has or has not planned a migration, and it does not describe other
            editions or generations of the same scheme.
          </span>
        </p>
      </section>
    </div>
  )
}
