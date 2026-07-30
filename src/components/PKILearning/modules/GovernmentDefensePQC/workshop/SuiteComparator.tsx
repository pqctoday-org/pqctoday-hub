// SPDX-License-Identifier: GPL-3.0-only
/**
 * CNSA 1.0 → 2.0 Comparator.
 *
 * Toggle a suite line and see what actually has to change. The teaching point
 * is the asymmetry: every public-key row is replaced, the symmetric rows are
 * essentially untouched — so a migration budget built on "replace all
 * cryptography" is wrong in a way that matters.
 */
import { useMemo, useState } from 'react'
import { ShieldCheck, RefreshCw, CheckCircle2 } from 'lucide-react'
import { SUITE_COMPARISON } from '../data/cnsaData'
import { Button } from '@/components/ui/button'

export const SuiteComparator = () => {
  const [selected, setSelected] = useState(SUITE_COMPARISON[0].purpose)
  const row = SUITE_COMPARISON.find((r) => r.purpose === selected) ?? SUITE_COMPARISON[0]

  const { replaced, unchanged } = useMemo(() => {
    const replaced = SUITE_COMPARISON.filter((r) => r.cnsa1 !== r.cnsa2)
    return { replaced, unchanged: SUITE_COMPARISON.length - replaced.length }
  }, [])

  return (
    <div className="space-y-6">
      <section className="glass-panel p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <ShieldCheck size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gradient">CNSA 1.0 → 2.0 Comparator</h3>
            <p className="text-sm text-muted-foreground">
              What the suite revision actually changes, line by line.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="p-4 rounded-lg bg-status-warning/10 border border-status-warning/30">
            <p className="text-2xl font-bold text-status-warning">{replaced.length}</p>
            <p className="text-sm text-muted-foreground">
              lines replaced — every public-key purpose in the suite
            </p>
          </div>
          <div className="p-4 rounded-lg bg-status-success/10 border border-status-success/30">
            <p className="text-2xl font-bold text-status-success">{unchanged}</p>
            <p className="text-sm text-muted-foreground">
              lines essentially unchanged — the symmetric primitives survive
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {SUITE_COMPARISON.map((r) => (
            <Button
              key={r.purpose}
              type="button"
              variant={selected === r.purpose ? 'gradient' : 'outline'}
              onClick={() => setSelected(r.purpose)}
              className="px-3 py-1 text-xs"
              aria-pressed={selected === r.purpose}
            >
              {r.purpose}
            </Button>
          ))}
        </div>
      </section>

      <section className="glass-panel p-6 space-y-4">
        <h4 className="font-semibold">{row.purpose}</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="p-4 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">CNSA 1.0</p>
            <p className="mt-1 font-mono text-sm text-foreground">{row.cnsa1}</p>
          </div>
          <div
            className={`p-4 rounded-lg border ${
              row.cnsa1 === row.cnsa2
                ? 'bg-status-success/10 border-status-success/30'
                : 'bg-primary/10 border-primary/30'
            }`}
          >
            <p className="text-xs uppercase tracking-wide text-muted-foreground">CNSA 2.0</p>
            <p className="mt-1 font-mono text-sm text-foreground">{row.cnsa2}</p>
            <p className="mt-2 inline-flex items-center gap-1 text-xs">
              {row.cnsa1 === row.cnsa2 ? (
                <>
                  <CheckCircle2 size={12} className="text-status-success" /> no migration needed
                </>
              ) : (
                <>
                  <RefreshCw size={12} className="text-primary" /> replacement required
                </>
              )}
            </p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{row.rationale}</p>
      </section>
    </div>
  )
}
