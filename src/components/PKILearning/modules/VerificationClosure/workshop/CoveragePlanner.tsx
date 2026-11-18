// SPDX-License-Identifier: AGPL-3.0-only
import { useState } from 'react'
import { ClipboardCheck, Calculator } from 'lucide-react'

const count = (value: string) => (/^\d+$/.test(value) ? Number(value) : NaN)

function Field({
  label,
  value,
  onChange,
  min = 0,
  max,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  min?: number
  max?: number
}) {
  return (
    <label className="flex items-center justify-between gap-3 text-sm">
      <span className="text-foreground">{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-24 min-h-[44px] rounded border border-border bg-transparent px-2 py-1 text-right text-sm text-foreground"
      />
    </label>
  )
}

function lowerTierPlan(size: number, rate: number, waves: number, failureWave: number) {
  const base = Math.floor(size / waves)
  const extra = size % waves
  // Preserve integer precision for large counts and round the sample up within each wave.
  const sample = (systems: number) =>
    Math.floor(systems / 100) * rate + Math.ceil(((systems % 100) * rate) / 100)
  const scheduled = sample(base) * (waves - extra) + sample(base + 1) * extra
  const inFailedWave = failureWave > 0 ? base + Number(failureWave <= extra) : 0
  const scheduledInFailedWave = sample(inFailedWave)
  return { scheduled, inFailedWave, scheduledInFailedWave }
}

export function CoveragePlanner() {
  const [tier1Input, setTier1] = useState('40')
  const [tier2Input, setTier2] = useState('600')
  const [tier3Input, setTier3] = useState('3400')
  const [rateInput, setRate] = useState('15')
  const [wavesInput, setWaves] = useState('6')
  const [failedInput, setFailed] = useState('0')

  const [tier1, tier2, tier3, rate, waves, failed] = [
    tier1Input,
    tier2Input,
    tier3Input,
    rateInput,
    wavesInput,
    failedInput,
  ].map(count)
  const estate = tier1 + tier2 + tier3
  const inputError = ![tier1, tier2, tier3, estate].every(Number.isSafeInteger)
    ? 'Use non-negative whole system counts with a total within the supported range.'
    : !Number.isSafeInteger(rate) || rate > 100
      ? 'Sample rate must be between 0 and 100%. Enter a whole percentage.'
      : !Number.isSafeInteger(waves) || waves < 1
        ? 'Enter at least one migration wave.'
        : !Number.isSafeInteger(failed) || failed > waves
          ? 'Enter a wave number in the plan, or 0 when no sample failed.'
          : undefined

  const tier2Plan = inputError ? null : lowerTierPlan(tier2, rate, waves, failed)
  const tier3Plan = inputError ? null : lowerTierPlan(tier3, rate, waves, failed)
  const priorChecks =
    (tier2Plan?.scheduledInFailedWave ?? 0) + (tier3Plan?.scheduledInFailedWave ?? 0)
  const expandedChecks = (tier2Plan?.inFailedWave ?? 0) + (tier3Plan?.inFailedWave ?? 0)
  const error =
    inputError ??
    (failed > 0 && priorChecks === 0
      ? `Wave ${failed} has no lower-tier sample. Increase the sample rate or choose a sampled wave.`
      : undefined)
  const tier2Total = tier2Plan
    ? tier2Plan.scheduled + (tier2Plan.inFailedWave - tier2Plan.scheduledInFailedWave)
    : 0
  const tier3Total = tier3Plan
    ? tier3Plan.scheduled + (tier3Plan.inFailedWave - tier3Plan.scheduledInFailedWave)
    : 0
  const total = tier1 + tier2Total + tier3Total

  return (
    <div className="space-y-4">
      <div className="glass-panel p-4">
        <div className="mb-1 flex items-center gap-2">
          <ClipboardCheck size={18} className="text-primary" />
          <h3 className="font-semibold text-foreground">Plan verification coverage</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Verify every Tier-1 system. This planning example spreads each lower tier evenly across
          waves, placing any extra systems in the earlier waves. It rounds each wave’s sample for
          each tier up to a whole system. Use the actual wave inventory and your sampling policy at
          work.
        </p>
      </div>

      <div className="glass-panel space-y-2 p-4">
        <Field label="Tier-1 systems (business-critical)" value={tier1Input} onChange={setTier1} />
        <Field
          label="Tier-2 systems (internal, sensitive)"
          value={tier2Input}
          onChange={setTier2}
        />
        <Field label="Tier-3 systems (long tail)" value={tier3Input} onChange={setTier3} />
        <div className="my-1 border-t border-border" />
        <Field
          label="Sample rate for Tier-2/3 (%)"
          value={rateInput}
          onChange={setRate}
          max={100}
        />
        <Field label="Migration waves" value={wavesInput} onChange={setWaves} min={1} />
        <Field
          label="Wave with a failed lower-tier sample"
          value={failedInput}
          onChange={setFailed}
        />
        <p className="text-xs text-muted-foreground">
          Enter 0 for no failure. A failed lower-tier sample expands that wave to full coverage.
        </p>
      </div>

      {error ? (
        <p role="alert" className="glass-panel p-4 text-status-error">
          {error}
        </p>
      ) : (
        <div className="glass-panel border border-primary/30 p-4">
          <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Calculator size={15} className="text-primary" /> Verification plan
          </h4>
          <div className="overflow-x-auto">
            <table aria-label="Verification plan" className="w-full text-sm">
              <tbody>
                {[
                  { label: 'Tier-1', checks: tier1, evidence: 'handshake evidence' },
                  { label: 'Tier-2', checks: tier2Total, evidence: 'sampled scan' },
                  { label: 'Tier-3', checks: tier3Total, evidence: 'drift monitoring' },
                ].map(({ label, checks, evidence }) => (
                  <tr key={label} className="border-b border-border/50">
                    <th scope="row" className="py-1 text-left font-normal text-foreground">
                      {label}
                    </th>
                    <td className="py-1 text-right font-mono text-foreground">
                      {checks.toLocaleString()}
                    </td>
                    <td className="py-1 text-right text-xs text-muted-foreground">{evidence}</td>
                  </tr>
                ))}
                <tr>
                  <th scope="row" className="py-1 text-left font-semibold text-foreground">
                    Total verifications
                  </th>
                  <td className="py-1 text-right font-mono font-semibold text-primary">
                    {total.toLocaleString()}
                  </td>
                  <td className="py-1 text-right text-xs text-muted-foreground">
                    {estate ? Math.round((total / estate) * 100) : 0}% of {estate.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          {failed > 0 && (
            <p role="status" className="mt-3 text-xs text-muted-foreground">
              Wave {failed} expands from {priorChecks.toLocaleString()} to{' '}
              {expandedChecks.toLocaleString()} lower-tier checks.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
