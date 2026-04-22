// SPDX-License-Identifier: GPL-3.0-only
import React, { useMemo, useState } from 'react'

interface Slider {
  id: string
  label: string
  help: string
  min: number
  max: number
  step: number
  value: number
  unit: string
  quantumDependent?: boolean
}

const fmt$ = (n: number) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
      ? `$${(n / 1_000).toFixed(0)}k`
      : `$${n.toFixed(0)}`

export const NoRegretROIBuilder: React.FC = () => {
  const [annualProgramCost, setAnnualProgramCost] = useState(1_800_000)
  const [sliders, setSliders] = useState<Slider[]>([
    {
      id: 'outage-avoidance',
      label: 'Cert-outage avoidance',
      help: 'Expected annual outage cost avoided. Baseline: 86% of enterprises had ≥1 event, avg $11.1M (Ponemon/Venafi).',
      min: 0,
      max: 15_000_000,
      step: 250_000,
      value: 6_500_000,
      unit: '$/year',
    },
    {
      id: 'clm-automation',
      label: 'CLM automation labor savings',
      help: '312% ROI / $10.1M NPV composite (Forrester TEI on CLM automation).',
      min: 0,
      max: 8_000_000,
      step: 100_000,
      value: 3_300_000,
      unit: '$/year',
    },
    {
      id: 'fips-drift',
      label: 'FIPS 140-3 drift remediation avoided',
      help: 'Cost of emergency re-procurement or re-validation when a cert goes historical/revoked or an IG update lands.',
      min: 0,
      max: 5_000_000,
      step: 100_000,
      value: 1_200_000,
      unit: '$/year',
    },
    {
      id: 'library-cve',
      label: 'Library-CVE response acceleration',
      help: 'Reduced exposure window × incidence rate.',
      min: 0,
      max: 3_000_000,
      step: 50_000,
      value: 750_000,
      unit: '$/year',
    },
    {
      id: 'ma-readiness',
      label: 'Time-to-market / M&A readiness',
      help: 'Gartner: ~50% lower PQC transition cost with CryptoCOE before 2028. Proxy for faster M&A integration revenue.',
      min: 0,
      max: 5_000_000,
      step: 100_000,
      value: 1_400_000,
      unit: '$/year',
    },
    {
      id: 'quantum-breach',
      label: 'Quantum breach avoidance (scenario B only)',
      help: 'HNDL-era compromise of long-lived secrets.',
      min: 0,
      max: 50_000_000,
      step: 500_000,
      value: 12_000_000,
      unit: '$/year',
      quantumDependent: true,
    },
  ])

  const setVal = (id: string, v: number) =>
    setSliders((xs) => xs.map((s) => (s.id === id ? { ...s, value: v } : s)))

  const horizonYears = 3

  const results = useMemo(() => {
    const qIndep = sliders.filter((s) => !s.quantumDependent).reduce((sum, s) => sum + s.value, 0)
    const qDep = sliders.filter((s) => s.quantumDependent).reduce((sum, s) => sum + s.value, 0)
    const totalCost = annualProgramCost * horizonYears
    const benefitA = qIndep * horizonYears
    const benefitB = (qIndep + qDep) * horizonYears
    const roiA = totalCost === 0 ? 0 : ((benefitA - totalCost) / totalCost) * 100
    const roiB = totalCost === 0 ? 0 : ((benefitB - totalCost) / totalCost) * 100
    const paybackA = qIndep <= annualProgramCost ? Infinity : annualProgramCost / qIndep
    const paybackB =
      qIndep + qDep <= annualProgramCost ? Infinity : annualProgramCost / (qIndep + qDep)
    return { qIndep, qDep, totalCost, benefitA, benefitB, roiA, roiB, paybackA, paybackB }
  }, [sliders, annualProgramCost])

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Tune your organization&apos;s assumptions. The model separates benefit streams that pay off{' '}
        <strong>regardless</strong> of quantum arrival from the single stream that depends on CRQC
        materializing within the horizon.
      </p>

      <div className="bg-muted/40 rounded-lg p-4 border border-border">
        <div className="flex justify-between items-center mb-1">
          <label htmlFor="cmm-program-cost" className="text-xs font-bold text-foreground">
            Annual CPM program cost
          </label>
          <span className="text-sm font-bold text-primary">{fmt$(annualProgramCost)}/yr</span>
        </div>
        <input
          id="cmm-program-cost"
          type="range"
          min={200_000}
          max={10_000_000}
          step={100_000}
          value={annualProgramCost}
          onChange={(e) => setAnnualProgramCost(Number(e.target.value))}
          className="w-full accent-primary"
        />
        <p className="text-[11px] text-muted-foreground mt-1">
          Headcount + tooling + CA contracts + HSM lifecycle + audit.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {sliders.map((s) => (
          <div
            key={s.id}
            className={`rounded-lg p-3 border ${
              s.quantumDependent
                ? 'bg-status-warning/10 border-status-warning/30'
                : 'bg-status-success/5 border-status-success/20'
            }`}
          >
            <div className="flex justify-between items-start gap-2 mb-1">
              <label className="text-xs font-bold text-foreground">{s.label}</label>
              <span className="text-xs font-bold text-foreground whitespace-nowrap">
                {fmt$(s.value)}
              </span>
            </div>
            <input
              type="range"
              min={s.min}
              max={s.max}
              step={s.step}
              value={s.value}
              onChange={(e) => setVal(s.id, Number(e.target.value))}
              className="w-full accent-primary"
            />
            <p className="text-[10px] text-muted-foreground mt-1">{s.help}</p>
            {s.quantumDependent && (
              <p className="text-[10px] text-status-warning font-bold mt-1">
                Quantum-dependent: applies only in Scenario B.
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-status-success/10 rounded-lg p-4 border border-status-success/30">
          <div className="font-bold text-foreground mb-2">
            Scenario A — quantum never arrives (horizon {horizonYears} y)
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Quantum-independent benefit</span>
              <span className="font-bold text-foreground">{fmt$(results.qIndep)}/yr</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total benefit (3y)</span>
              <span className="font-bold text-foreground">{fmt$(results.benefitA)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total cost (3y)</span>
              <span className="font-bold text-foreground">{fmt$(results.totalCost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payback period</span>
              <span className="font-bold text-foreground">
                {results.paybackA === Infinity
                  ? 'never in horizon'
                  : `${results.paybackA.toFixed(2)} y`}
              </span>
            </div>
            <div className="flex justify-between pt-1 border-t border-status-success/30">
              <span className="font-bold text-status-success">3-year ROI</span>
              <span className="font-bold text-status-success text-lg">
                {results.roiA.toFixed(0)}%
              </span>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground italic mt-2">
            No-regret case. This is what your board should see first.
          </p>
        </div>

        <div className="bg-status-info/10 rounded-lg p-4 border border-status-info/30">
          <div className="font-bold text-foreground mb-2">Scenario B — CRQC arrives within 5 y</div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Quantum-dependent benefit added</span>
              <span className="font-bold text-foreground">{fmt$(results.qDep)}/yr</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total benefit (3y)</span>
              <span className="font-bold text-foreground">{fmt$(results.benefitB)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total cost (3y)</span>
              <span className="font-bold text-foreground">{fmt$(results.totalCost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payback period</span>
              <span className="font-bold text-foreground">
                {results.paybackB === Infinity
                  ? 'never in horizon'
                  : `${results.paybackB.toFixed(2)} y`}
              </span>
            </div>
            <div className="flex justify-between pt-1 border-t border-status-info/30">
              <span className="font-bold text-status-info">3-year ROI</span>
              <span className="font-bold text-status-info text-lg">{results.roiB.toFixed(0)}%</span>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground italic mt-2">
            Upside case. The quantum-dependent stream is additive — never load-bearing.
          </p>
        </div>
      </div>

      <div className="bg-muted/40 rounded-lg p-3 border border-border text-xs text-muted-foreground">
        Model limitations: straight-line annualization (no discounting), no Monte-Carlo on breach
        incidence. For full board modeling pair with the Business Case module (LM-036).
      </div>
    </div>
  )
}
