// SPDX-License-Identifier: GPL-3.0-only
/**
 * Signature Longevity Calculator.
 *
 * Set how long a signature must remain evaluable and see which degradation
 * stages fall inside that window. The output people find uncomfortable is the
 * re-timestamping deadline: it is driven by the archive you already have, not
 * by new signing volume.
 */
import { useMemo, useState } from 'react'
import { Clock, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { LTV_STAGES } from '../data/trustServicesData'
import { Button } from '@/components/ui/button'

const HORIZONS = [
  { years: 3, label: '3y — commercial contract' },
  { years: 7, label: '7y — tax/audit retention' },
  { years: 10, label: '10y — corporate records' },
  { years: 30, label: '30y — notarial deed' },
  { years: 100, label: '100y — land registry' },
]

/** Which stages bite inside a given horizon, by the lower bound of each stage. */
const STAGE_ONSET: Record<string, number> = {
  creation: 0,
  'cert-expiry': 1,
  'revocation-data': 3,
  'algorithm-weakens': 5,
  archival: 20,
}

export const SignatureLongevityCalculator = () => {
  const [horizon, setHorizon] = useState(30)

  const { inScope, retimestampBy } = useMemo(() => {
    const inScope = LTV_STAGES.filter((s) => STAGE_ONSET[s.id] <= horizon)
    // Signatures must be re-timestamped under a quantum-safe algorithm before
    // the classical one stops being trustworthy. 2035 is the commonly cited
    // planning anchor; this is a planning figure, not a prediction.
    const retimestampBy = 2035
    return { inScope, retimestampBy }
  }, [horizon])

  const spansAlgorithmChange = horizon >= STAGE_ONSET['algorithm-weakens']

  return (
    <div className="space-y-6">
      <section className="glass-panel p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Clock size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gradient">Signature Longevity Calculator</h3>
            <p className="text-sm text-muted-foreground">
              How long must this signature stay evaluable, and what does that oblige you to do?
            </p>
          </div>
        </div>

        <fieldset className="border-0 p-0 m-0">
          <legend className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5">
            Required validity horizon
          </legend>
          <div className="flex flex-wrap gap-1.5">
            {HORIZONS.map((h) => (
              <Button
                key={h.years}
                type="button"
                variant={horizon === h.years ? 'gradient' : 'outline'}
                onClick={() => setHorizon(h.years)}
                className="px-3 py-1 text-xs"
                aria-pressed={horizon === h.years}
              >
                {h.label}
              </Button>
            ))}
          </div>
        </fieldset>
      </section>

      <section
        className={`glass-panel p-6 border-l-4 ${
          spansAlgorithmChange ? 'border-l-status-warning' : 'border-l-status-success'
        }`}
      >
        <div className="flex items-start gap-3">
          {spansAlgorithmChange ? (
            <AlertTriangle size={20} className="text-status-warning shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 size={20} className="text-status-success shrink-0 mt-0.5" />
          )}
          <div className="space-y-2">
            <p className="font-semibold">
              {spansAlgorithmChange
                ? 'This horizon outlives its signing algorithm'
                : 'This horizon stays inside one algorithm generation'}
            </p>
            <p className="text-sm text-muted-foreground">
              {spansAlgorithmChange ? (
                <>
                  A {horizon}-year signature will need re-timestamping under a quantum-safe
                  algorithm before roughly <strong>{retimestampBy}</strong>. That obligation applies
                  to every signature already in the archive, so the work scales with what you have
                  stored — not with how many signatures you make from here.
                </>
              ) : (
                <>
                  At {horizon} years the dominant risks are certificate expiry and revocation-data
                  availability. Capture a timestamp at signing and archive the revocation data, and
                  the signature survives its window without an algorithm migration.
                </>
              )}
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h4 className="font-semibold">Stages inside a {horizon}-year window</h4>
        {inScope.map((s) => (
          <div key={s.id} className="glass-panel p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h5 className="font-medium">{s.label}</h5>
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                {s.horizon}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{s.risk}</p>
            <p className="mt-1 text-sm text-foreground">{s.action}</p>
          </div>
        ))}
      </section>
    </div>
  )
}
