// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { ClipboardCheck, Calculator } from 'lucide-react'

/**
 * Verification Coverage Calculator — enter your estate size by tier and a
 * sampling rate, and it computes the actual number of systems to verify, the
 * evidence per tier, and the re-verification trigger. Verify Tier-1 fully,
 * sample lower tiers per wave; any sampled failure widens the check.
 * (The sampling rule is practitioner guidance, not a named standard.)
 */

const num = (v: string) => Math.max(0, Math.floor(Number(v) || 0))

function Field({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string
  value: number
  onChange: (n: number) => void
  suffix?: string
}) {
  return (
    <label className="flex items-center justify-between gap-3 text-sm">
      <span className="text-foreground">{label}</span>
      <span className="flex items-center gap-1">
        <input
          type="number"
          min={0}
          value={value}
          onChange={(e) => onChange(num(e.target.value))}
          className="w-20 rounded border border-border bg-transparent px-2 py-1 text-right text-sm text-foreground"
        />
        {suffix && <span className="w-6 text-xs text-muted-foreground">{suffix}</span>}
      </span>
    </label>
  )
}

export function CoveragePlanner() {
  const [t1, setT1] = useState(40)
  const [t2, setT2] = useState(600)
  const [t3, setT3] = useState(3400)
  const [sample, setSample] = useState(15)
  const [waves, setWaves] = useState(6)

  const v1 = t1 // 100%
  const v2 = Math.ceil(((t2 * sample) / 100) * 1) // per-wave sample, summed ≈ sample% of t2
  const v3 = Math.ceil((t3 * sample) / 100)
  const total = v1 + v2 + v3
  const estate = t1 + t2 + t3
  const pct = estate ? Math.round((total / estate) * 100) : 0
  const perWave = waves ? Math.ceil((v2 + v3) / waves) : v2 + v3

  return (
    <div className="space-y-4">
      <div className="glass-panel p-4">
        <div className="mb-1 flex items-center gap-2">
          <ClipboardCheck size={18} className="text-primary" />
          <h3 className="font-semibold text-foreground">Plan verification coverage</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Verify Tier-1 fully and sample lower tiers per wave. Enter your numbers.
        </p>
      </div>

      <div className="glass-panel space-y-2 p-4">
        <Field label="Tier-1 systems (business-critical)" value={t1} onChange={setT1} />
        <Field label="Tier-2 systems (internal, sensitive)" value={t2} onChange={setT2} />
        <Field label="Tier-3 systems (long tail)" value={t3} onChange={setT3} />
        <div className="my-1 border-t border-border" />
        <Field label="Sample rate for Tier-2/3" value={sample} onChange={setSample} suffix="%" />
        <Field label="Migration waves" value={waves} onChange={setWaves} />
      </div>

      <div className="glass-panel border border-primary/30 p-4">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
          <Calculator size={15} className="text-primary" /> Verification plan
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-border/50">
                <td className="py-1 text-foreground">Tier-1 — verify 100%</td>
                <td className="py-1 text-right font-mono text-foreground">{v1.toLocaleString()}</td>
                <td className="py-1 text-right text-xs text-muted-foreground">
                  handshake evidence
                </td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-1 text-foreground">Tier-2 — {sample}% sample</td>
                <td className="py-1 text-right font-mono text-foreground">{v2.toLocaleString()}</td>
                <td className="py-1 text-right text-xs text-muted-foreground">sampled scan</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-1 text-foreground">Tier-3 — {sample}% sample</td>
                <td className="py-1 text-right font-mono text-foreground">{v3.toLocaleString()}</td>
                <td className="py-1 text-right text-xs text-muted-foreground">drift monitoring</td>
              </tr>
              <tr>
                <td className="py-1 font-semibold text-foreground">Total verifications</td>
                <td className="py-1 text-right font-mono font-semibold text-primary">
                  {total.toLocaleString()}
                </td>
                <td className="py-1 text-right text-xs text-muted-foreground">
                  {pct}% of {estate.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          ≈ <strong>{perWave.toLocaleString()}</strong> sampled verifications per wave. Any sampled
          failure → verify 100% of that wave. Control basis: NIST CSWP 48 (draft) → CSF 2.0 / SP
          800-53.
        </p>
      </div>
    </div>
  )
}
