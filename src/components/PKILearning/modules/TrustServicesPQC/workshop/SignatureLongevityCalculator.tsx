// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Signature Longevity Calculator.
 *
 * An illustrative scenario: set how long a signature must remain evaluable and
 * see which degradation stages fall inside that window, against an assumed
 * signing algorithm and an assumed policy cutoff that are shown on the page.
 * The output people find uncomfortable is the renewal obligation: it is driven
 * by the archive you already have, not by new signing volume. Neither a
 * retention period nor the assumed cutoff proves that a signature survives.
 */
import { useMemo, useState } from 'react'
import { Clock, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { LTV_STAGES, LTV_SCENARIO, longevityScenario } from '../data/trustServicesData'
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

  const { inScope, scenario } = useMemo(() => {
    const inScope = LTV_STAGES.filter((s) => STAGE_ONSET[s.id] <= horizon)
    // Illustrative scenario: signed this year with the assumed classical algorithm, checked
    // against one assumed policy cutoff. The dates are shown to the learner, not hidden.
    const scenario = longevityScenario(horizon, new Date().getFullYear())
    return { inScope, scenario }
  }, [horizon])

  const spansAlgorithmChange = scenario.endsAfterCutoff

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
                ? 'In this scenario the horizon runs past the assumed policy cutoff'
                : 'In this scenario the horizon ends before the assumed policy cutoff'}
            </p>
            <p className="text-xs text-muted-foreground">
              Illustrative scenario, not a prediction. Assumed: signed in{' '}
              <strong>{scenario.signingYear}</strong> with {LTV_SCENARIO.algorithm}, needed until{' '}
              <strong>{scenario.endYear}</strong>, checked against one policy cutoff,{' '}
              <strong>{scenario.cutoffYear}</strong> ({LTV_SCENARIO.policyCutoffBasis}).
            </p>
            <p className="text-sm text-muted-foreground">
              {spansAlgorithmChange ? (
                <>
                  A {horizon}-year signature would need renewal (for example re-timestamping under a
                  quantum-safe algorithm) before the earliest of: a weakness in the signing
                  algorithm, the signing certificate becoming invalid, and a policy cutoff such as{' '}
                  {scenario.cutoffYear}. That obligation applies to every signature already in the
                  archive, so the work scales with what you have stored, not with how many
                  signatures you make from here.
                </>
              ) : (
                <>
                  Ending before {scenario.cutoffYear} does not prove the signature survives its
                  window. Certificate expiry and revocation-data availability are the nearer risks,
                  and a weakness in the algorithm, an invalid certificate or an earlier policy
                  cutoff would still require renewal. Capture a timestamp at signing and archive the
                  revocation data.
                </>
              )}
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h4 className="font-semibold">Stages inside a {horizon}-year window</h4>
        <p className="text-xs text-muted-foreground">
          The stage windows are this module&apos;s illustrative ranges, not dates for your algorithm
          or your certificates.
        </p>
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
