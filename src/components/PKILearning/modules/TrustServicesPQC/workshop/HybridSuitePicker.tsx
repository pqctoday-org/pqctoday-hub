// SPDX-License-Identifier: GPL-3.0-only
/**
 * Hybrid Suite Picker.
 *
 * ETSI TS 119 312 V2.1.1 Table 3.3, filtered by what you already deploy. The
 * point is that the recommended PQC partner is determined by the classical
 * component's strength — you do not get to mix a weak classical component with
 * a strong post-quantum one and call it high security.
 */
import { useMemo, useState } from 'react'
import { KeyRound, Info } from 'lucide-react'
import { HYBRID_SUITES, HYBRID_RULE } from '../data/trustServicesData'
import { Button } from '@/components/ui/button'

const USE_CASES = Array.from(new Set(HYBRID_SUITES.map((h) => h.useCase)))

export const HybridSuitePicker = () => {
  const [useCase, setUseCase] = useState<string>('all')

  const shown = useMemo(
    () => (useCase === 'all' ? HYBRID_SUITES : HYBRID_SUITES.filter((h) => h.useCase === useCase)),
    [useCase]
  )

  return (
    <div className="space-y-6">
      <section className="glass-panel p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <KeyRound size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gradient">Hybrid Suite Picker</h3>
            <p className="text-sm text-muted-foreground">
              The hybrid combinations ETSI recommends, and the rule that governs them.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-status-info/10 border border-status-info/30">
          <p className="text-sm">
            <Info size={14} className="inline mr-1.5 -mt-0.5 text-status-info" />
            {HYBRID_RULE.requirement}
          </p>
        </div>

        <fieldset className="border-0 p-0 m-0">
          <legend className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5">
            Use case
          </legend>
          <div className="flex flex-wrap gap-1.5">
            <Button
              type="button"
              variant={useCase === 'all' ? 'gradient' : 'outline'}
              onClick={() => setUseCase('all')}
              className="px-3 py-1 text-xs"
              aria-pressed={useCase === 'all'}
            >
              All
            </Button>
            {USE_CASES.map((u) => (
              <Button
                key={u}
                type="button"
                variant={useCase === u ? 'gradient' : 'outline'}
                onClick={() => setUseCase(u)}
                className="px-3 py-1 text-xs"
                aria-pressed={useCase === u}
              >
                {u}
              </Button>
            ))}
          </div>
        </fieldset>
      </section>

      <section className="glass-panel p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-4 text-muted-foreground font-medium">
                  Classical component
                </th>
                <th className="text-left py-2 pr-4 text-muted-foreground font-medium">
                  PQC component
                </th>
                <th className="text-left py-2 text-muted-foreground font-medium">Use case</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((h) => (
                <tr key={`${h.classical}-${h.pqc}`} className="border-b border-border/50">
                  <td className="py-2 pr-4 text-muted-foreground">{h.classical}</td>
                  <td className="py-2 pr-4 font-mono text-foreground">{h.pqc}</td>
                  <td className="py-2 text-muted-foreground">{h.useCase}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Source: ETSI TS 119 312 V2.1.1, Table 3.3.
        </p>
      </section>

      <section className="glass-panel p-6">
        <h4 className="font-semibold">Two authorities, opposite defaults</h4>
        <p className="mt-2 text-sm text-muted-foreground">{HYBRID_RULE.contrast}</p>
      </section>
    </div>
  )
}
