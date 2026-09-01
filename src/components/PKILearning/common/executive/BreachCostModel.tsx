// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router'
import {
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Sliders,
  Zap,
  Info,
  Percent,
  Clock,
  BookOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { resolveIndustryBreachBaseline } from '@/utils/roiMath'
import {
  US_VS_GLOBAL_BREACH_COST_MULTIPLIER,
  ANNUAL_BREACH_PROBABILITY_PCT,
  IBM_BASELINE_UNVERIFIED_NOTE,
  type OrgSizeTier,
} from '@/data/roiBaselines'
import {
  computeBreachCosts,
  HNDL_MULTIPLIER_CAP,
  DATA_SHELF_LIFE_YEARS,
  DATA_SHELF_LIFE_HAS_CITATION,
  DATA_SENSITIVITY_LABELS,
  type DataSensitivityClass,
} from '@/utils/breachCostModel'
import { computeMoscaVerdict, costOfWaiting } from '@/utils/moscaTheorem'

/** The full set of scenario sliders below, for restore-on-mount and for
 *  reporting the raw inputs back up (not just the computed costs) so a
 *  caller can persist and later restore all of them, not only `industry`. */
export interface BreachScenarioInputs {
  breachScale: number
  yearsOfData: number
  orgSizeTier: OrgSizeTier
  hndlFactorPct: number
  dataSensitivityClass: DataSensitivityClass
  planningHorizonYears: number
  discountRateAnnual: number
  migrationDurationYears: number
  region: 'global' | 'us'
}

interface BreachCostModelProps {
  industry?: string
  /** Seeds every slider on mount — omit to use the built-in defaults
   *  (unaffected existing callers keep exactly their current behavior). */
  initialValues?: Partial<BreachScenarioInputs>
  onCostCalculated?: (costs: {
    classicalCost: number
    quantumCost: number
    delta: number
    pCrqc: number
    quantumALE: number
    latestSafeStartYear: number
    alreadyLate: boolean
    dataSensitivityClass: DataSensitivityClass
    yearsOfData: number
    hndlFactorPct: number
    annualBreachProbPct: number
  }) => void
  /** All raw slider values, reported on every change — the restorable half
   *  `onCostCalculated` doesn't cover (breachScale, planningHorizonYears,
   *  discountRateAnnual, migrationDurationYears, orgSizeTier, region). */
  onInputsChanged?: (inputs: BreachScenarioInputs) => void
}

/**
 * Print a percentage at the precision actually used in the maths.
 *
 * This line is a "show your working" formula — its only job is to let a reader
 * reconcile the inputs against the result. It used Math.round, which was
 * harmless while every organization-size tier was a whole number. Making the
 * tiers fractional on 2026-08-11 (8.7 / 9.3 / 12.8, read off IRIS 2025 Fig. 7)
 * silently broke it: the default scenario displayed "9%" and computed 9.3%, so
 * the arithmetic on screen no longer came out to the number beside it. Caught
 * reviewing that change, not by any test.
 */
function formatPct(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

function formatCurrency(amount: number): string {
  const sign = amount < 0 ? '-' : ''
  const a = Math.abs(amount)
  if (a >= 1_000_000_000) return `${sign}$${(a / 1_000_000_000).toFixed(1)}B`
  if (a >= 1_000_000) return `${sign}$${(a / 1_000_000).toFixed(1)}M`
  if (a >= 1_000) return `${sign}$${(a / 1_000).toFixed(0)}K`
  return `${sign}$${a.toFixed(0)}`
}

const DATA_CLASS_OPTIONS: DataSensitivityClass[] = [
  'general-pii',
  'payment-card',
  'health-record',
  'ip-trade-secret',
  'state-secret',
]

const ORG_SIZE_TIER_OPTIONS: { tier: OrgSizeTier; label: string }[] = [
  { tier: 'smb', label: 'SMB' },
  { tier: 'average', label: 'Average org' },
  { tier: 'fortune1000', label: 'Fortune-1000-class' },
]

export const BreachCostModel: React.FC<BreachCostModelProps> = ({
  industry = 'Other',
  initialValues,
  onCostCalculated,
  onInputsChanged,
}) => {
  // Scenario inputs. "Breach severity" scales the authoritative industry-average
  // total breach cost, rather than a fabricated flat per-record figure.
  const [breachScale, setBreachScale] = useState(initialValues?.breachScale ?? 1)
  const [yearsOfData, setYearsOfData] = useState(initialValues?.yearsOfData ?? 5)
  // Default prior comes from Cyentia IRIS 2025's organization-size anchors
  // (average org ~9%/yr), not an unsourced flat figure — see roiBaselines.ts.
  const [orgSizeTier, setOrgSizeTier] = useState<OrgSizeTier>(
    initialValues?.orgSizeTier ?? 'average'
  )
  const [annualBreachProbPct, setAnnualBreachProbPct] = useState(
    ANNUAL_BREACH_PROBABILITY_PCT[initialValues?.orgSizeTier ?? 'average']
  )
  const selectOrgSizeTier = (tier: OrgSizeTier) => {
    setOrgSizeTier(tier)
    setAnnualBreachProbPct(ANNUAL_BREACH_PROBABILITY_PCT[tier])
  }
  const [hndlFactorPct, setHndlFactorPct] = useState(initialValues?.hndlFactorPct ?? 30)
  const [dataSensitivityClass, setDataSensitivityClass] = useState<DataSensitivityClass>(
    initialValues?.dataSensitivityClass ?? 'general-pii'
  )
  const [planningHorizonYears, setPlanningHorizonYears] = useState(
    initialValues?.planningHorizonYears ?? 10
  )
  const [discountRateAnnual, setDiscountRateAnnual] = useState(
    initialValues?.discountRateAnnual ?? 0.06
  )
  const [migrationDurationYears, setMigrationDurationYears] = useState(
    initialValues?.migrationDurationYears ?? 3
  )
  const [region, setRegion] = useState<'global' | 'us'>(initialValues?.region ?? 'global')

  const asOfYear = useMemo(() => new Date().getFullYear(), [])

  // Single source of truth — the same IBM 2025 baseline the ROI Calculator and
  // Cost Model Explorer use. No private, drifted table.
  const globalBaseline = resolveIndustryBreachBaseline(industry)
  const baseline =
    region === 'us' ? globalBaseline * US_VS_GLOBAL_BREACH_COST_MULTIPLIER : globalBaseline

  const modelInputs = useMemo(
    () => ({
      baseline,
      breachScale,
      yearsOfData,
      hndlFactorPct,
      annualBreachProbPct,
      dataSensitivityClass,
      asOfYear,
      planningHorizonYears,
      discountRateAnnual,
    }),
    [
      baseline,
      breachScale,
      yearsOfData,
      hndlFactorPct,
      annualBreachProbPct,
      dataSensitivityClass,
      asOfYear,
      planningHorizonYears,
      discountRateAnnual,
    ]
  )

  const costs = useMemo(() => computeBreachCosts(modelInputs), [modelInputs])

  const shelfLifeYears = DATA_SHELF_LIFE_YEARS[dataSensitivityClass]
  const shelfLifeHasCitation = DATA_SHELF_LIFE_HAS_CITATION[dataSensitivityClass]

  const mosca = useMemo(
    () =>
      computeMoscaVerdict(
        { shelfLifeYears, migrationDurationYears, crqcScenario: 'consensus' },
        asOfYear
      ),
    [shelfLifeYears, migrationDurationYears, asOfYear]
  )

  const waitTwoYearsCost = useMemo(() => costOfWaiting(modelInputs, 2), [modelInputs])

  // Emit in an effect, not during render/useMemo (the previous model called the
  // parent setter inside useMemo — a side effect during render).
  useEffect(() => {
    onCostCalculated?.({
      classicalCost: costs.classicalSLE,
      quantumCost: costs.quantumSLE,
      delta: costs.delta,
      pCrqc: costs.pCrqc,
      quantumALE: costs.quantumALE,
      latestSafeStartYear: mosca.latestSafeStartYear,
      alreadyLate: mosca.alreadyLate,
      dataSensitivityClass,
      yearsOfData,
      hndlFactorPct,
      annualBreachProbPct,
    })
  }, [
    onCostCalculated,
    costs,
    mosca,
    dataSensitivityClass,
    yearsOfData,
    hndlFactorPct,
    annualBreachProbPct,
  ])

  useEffect(() => {
    onInputsChanged?.({
      breachScale,
      yearsOfData,
      orgSizeTier,
      hndlFactorPct,
      dataSensitivityClass,
      planningHorizonYears,
      discountRateAnnual,
      migrationDurationYears,
      region,
    })
  }, [
    onInputsChanged,
    breachScale,
    yearsOfData,
    orgSizeTier,
    hndlFactorPct,
    dataSensitivityClass,
    planningHorizonYears,
    discountRateAnnual,
    migrationDurationYears,
    region,
  ])

  const pctIncrease = costs.classicalSLE > 0 ? (costs.delta / costs.classicalSLE) * 100 : 0

  return (
    <div className="space-y-6">
      {/* ── Scenario Inputs ── */}
      <details className="glass-panel p-4" open>
        <summary className="text-sm font-semibold text-foreground cursor-pointer flex items-center gap-2">
          <Sliders size={16} className="text-primary shrink-0" />
          Scenario Inputs
        </summary>
        <div className="mt-4">
          <div className="bg-muted/50 rounded-lg p-3 flex items-start gap-2 mb-4">
            <Info size={14} className="text-muted-foreground shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground">
              <p>
                Industry baseline ({industry}, {region === 'us' ? 'US' : 'global'}):{' '}
                <span className="font-mono text-foreground font-semibold">
                  {formatCurrency(baseline)}
                </span>{' '}
                average total breach cost &mdash; IBM Cost of a Data Breach 2025. This total already
                includes detection, notification, lost business and reputational damage, so those
                are not added again.
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span>Region:</span>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setRegion('global')}
                  className={`h-auto px-2 py-0.5 rounded-full border text-[11px] ${
                    region === 'global'
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border hover:text-foreground'
                  }`}
                >
                  Global
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setRegion('us')}
                  className={`h-auto px-2 py-0.5 rounded-full border text-[11px] ${
                    region === 'us'
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border hover:text-foreground'
                  }`}
                >
                  US ({US_VS_GLOBAL_BREACH_COST_MULTIPLIER.toFixed(1)}× global)
                </Button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="breach-severity"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Breach Severity (× industry average)
              </label>
              <input
                id="breach-severity"
                type="range"
                min={0.25}
                max={4}
                step={0.25}
                value={breachScale}
                onChange={(e) => setBreachScale(parseFloat(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0.25×</span>
                <span className="text-sm font-mono text-primary">{breachScale.toFixed(2)}×</span>
                <span>4×</span>
              </div>
            </div>
            <div>
              <label
                htmlFor="breach-years-data"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Years of Stored Data (HNDL)
              </label>
              <input
                id="breach-years-data"
                type="range"
                min={1}
                max={25}
                value={yearsOfData}
                onChange={(e) => setYearsOfData(parseInt(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1 yr</span>
                <span className="text-sm font-mono text-primary">{yearsOfData} years</span>
                <span>25 yrs</span>
              </div>
            </div>
            <div>
              <label
                htmlFor="breach-annual-prob"
                className="block text-sm font-medium text-foreground mb-2 flex items-center gap-1"
              >
                <Percent size={13} className="text-muted-foreground" />
                Annual Breach Probability
              </label>
              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                {ORG_SIZE_TIER_OPTIONS.map(({ tier, label }) => (
                  <Button
                    key={tier}
                    type="button"
                    variant="ghost"
                    onClick={() => selectOrgSizeTier(tier)}
                    className={`h-auto px-2 py-0.5 rounded-full border text-[11px] ${
                      orgSizeTier === tier
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border hover:text-foreground'
                    }`}
                  >
                    {label} ({ANNUAL_BREACH_PROBABILITY_PCT[tier]}%)
                  </Button>
                ))}
              </div>
              <input
                id="breach-annual-prob"
                type="range"
                min={1}
                max={50}
                // 0.1 steps and parseFloat: the IRIS tier anchors are fractional
                // (8.7 / 9.3 / 12.8) and parseInt silently truncated them to
                // integers the moment the slider was touched.
                step={0.1}
                value={annualBreachProbPct}
                onChange={(e) => setAnnualBreachProbPct(parseFloat(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1%</span>
                <span className="text-sm font-mono text-primary">{annualBreachProbPct}%</span>
                <span>50%</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Default reflects the selected organization size — Cyentia IRIS 2025 anchors: SMB
                8.7%/yr, average org 9.3%/yr, Fortune-1000-class 12.8%/yr. The tiers sit close
                together because IRIS 2025's finding is that they have converged: small-firm risk
                has more than doubled since 2008 while the largest firms' has fallen. Drag the
                slider to override.
              </p>
            </div>
          </div>
        </div>
      </details>

      {/* ── Data sensitivity & horizon ── */}
      <details className="glass-panel p-4" open>
        <summary className="text-sm font-semibold text-foreground cursor-pointer flex items-center gap-2">
          <Clock size={16} className="text-primary shrink-0" />
          Data Sensitivity &amp; Planning Horizon
        </summary>
        <div className="mt-4 space-y-4">
          <div>
            <span
              id="data-sensitivity-label"
              className="block text-sm font-medium text-foreground mb-2"
            >
              What kind of data is at HNDL risk?
            </span>
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-labelledby="data-sensitivity-label"
            >
              {DATA_CLASS_OPTIONS.map((key) => (
                <Button
                  key={key}
                  type="button"
                  variant="ghost"
                  onClick={() => setDataSensitivityClass(key)}
                  className={`h-auto text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    dataSensitivityClass === key
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {DATA_SENSITIVITY_LABELS[key]}
                </Button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">
              Shelf life: <span className="font-mono text-foreground">{shelfLifeYears} years</span>{' '}
              &mdash; how long this data class stays damaging if later decrypted.{' '}
              {shelfLifeHasCitation
                ? 'Approximates automatic-declassification schedules (e.g. US EO 13526: 25 years).'
                : 'Assumption — no single authoritative source; adjust to your own retention/sensitivity policy.'}
            </p>
          </div>
          <div>
            <label
              htmlFor="planning-horizon"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Planning Horizon
            </label>
            <input
              id="planning-horizon"
              type="range"
              min={5}
              max={20}
              value={planningHorizonYears}
              onChange={(e) => setPlanningHorizonYears(parseInt(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>5 yrs</span>
              <span className="text-sm font-mono text-primary">{planningHorizonYears} years</span>
              <span>20 yrs</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Also the window used to look up CRQC-arrival probability below.
            </p>
          </div>
          <div>
            <label
              htmlFor="discount-rate"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Discount Rate (for future losses)
            </label>
            <input
              id="discount-rate"
              type="range"
              min={0}
              max={0.12}
              step={0.01}
              value={discountRateAnnual}
              onChange={(e) => setDiscountRateAnnual(parseFloat(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0%</span>
              <span className="text-sm font-mono text-primary">
                {Math.round(discountRateAnnual * 100)}%
              </span>
              <span>12%</span>
            </div>
          </div>
        </div>
      </details>

      {/* ── Quantum Assumptions ── */}
      <details className="glass-panel p-4" open>
        <summary className="text-sm font-semibold text-foreground cursor-pointer flex items-center gap-2">
          <Zap size={16} className="text-primary shrink-0" />
          Quantum Assumptions
        </summary>
        <div className="mt-4">
          <div className="bg-muted/50 rounded-lg p-3 flex items-start gap-2 mb-4">
            <Info size={14} className="text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Two separate ingredients: (1){' '}
              <strong className="text-foreground">harvest-now-decrypt-later</strong> amplification —
              once a quantum computer exists, a breach exposes years of accumulated harvested data,
              decayed by how long this data class stays sensitive; and (2) the{' '}
              <strong className="text-foreground">probability a CRQC exists</strong> within your
              planning horizon, from the Global Risk Institute&apos;s 2025 expert survey. The
              headline expected-loss figure blends both — it does not assume a CRQC already exists.
            </p>
          </div>
          <div className="max-w-sm">
            <label
              htmlFor="breach-hndl-factor"
              className="block text-sm font-medium text-foreground mb-2"
            >
              HNDL Exposure Factor
            </label>
            <input
              id="breach-hndl-factor"
              type="range"
              min={5}
              max={100}
              step={5}
              value={hndlFactorPct}
              onChange={(e) => setHndlFactorPct(parseInt(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>5%</span>
              <span className="text-sm font-mono text-primary">{hndlFactorPct}%</span>
              <span>100%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2 font-mono">
              Amplification (decay-adjusted):{' '}
              <span className="text-foreground font-bold">{costs.hndlMultiplier.toFixed(2)}×</span>{' '}
              &middot; decay factor {costs.decayFactor.toFixed(2)}
            </p>
          </div>
        </div>
      </details>

      {/* ── Per-event cost comparison (SLE) ── */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">
          Cost <em>if</em> a breach occurs, assuming a CRQC already exists (single-loss expectancy):
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-panel p-6 text-center">
            <DollarSign size={24} className="mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-1">Classical Breach</p>
            <p className="text-3xl font-bold text-foreground">
              {formatCurrency(costs.classicalSLE)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">{industry} average × severity</p>
          </div>
          <div className="glass-panel p-6 text-center border-status-error/30 border-2">
            <AlertTriangle size={24} className="mx-auto text-status-error mb-2" />
            <p className="text-sm text-muted-foreground mb-1">Quantum-Enabled Breach</p>
            <p className="text-3xl font-bold text-status-error">
              {formatCurrency(costs.quantumSLE)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              If CRQC exists — includes decayed HNDL exposure
            </p>
          </div>
          <div className="glass-panel p-6 text-center">
            <TrendingUp size={24} className="mx-auto text-status-warning mb-2" />
            <p className="text-sm text-muted-foreground mb-1">Additional Quantum Risk</p>
            <p className="text-3xl font-bold text-status-warning">{formatCurrency(costs.delta)}</p>
            <p className="text-xs text-muted-foreground mt-2">
              {pctIncrease.toFixed(0)}% increase over classical, if CRQC exists
            </p>
          </div>
        </div>
      </div>

      {/* ── Expected annual loss (ALE), probability-weighted ── */}
      <div className="glass-panel p-4 border-l-4 border-l-primary">
        <div className="flex items-start gap-2 mb-3">
          <Info size={14} className="text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            <strong>Expected annual loss</strong> blends the classical and quantum-enabled cases,
            weighted by the probability a CRQC exists within your {planningHorizonYears}-year
            horizon (
            <span className="font-mono text-foreground">{Math.round(costs.pCrqc * 100)}%</span>,
            consensus scenario) — this is the figure that belongs in an ROI model, not the fully
            quantum-conditional number above.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Classical — annual expected loss</p>
            <p className="text-xl font-bold text-foreground">
              {formatCurrency(costs.classicalALE)}
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">
              Quantum-weighted — annual expected loss
            </p>
            <p className="text-xl font-bold text-status-error">
              {formatCurrency(costs.quantumALE)}
            </p>
          </div>
        </div>
        <div className="bg-muted/30 rounded-lg p-3">
          <p className="text-[10px] text-muted-foreground mb-2">
            Range across CRQC-arrival scenarios (GRI 2025 survey bounds) — not a single point
            estimate:
          </p>
          <div className="flex items-center justify-between text-xs font-mono">
            <span>
              Low ({Math.round(costs.range.low.pCrqc * 100)}%):{' '}
              <span className="text-foreground">{formatCurrency(costs.range.low.quantumALE)}</span>
            </span>
            <span>
              Central ({Math.round(costs.range.central.pCrqc * 100)}%):{' '}
              <span className="text-foreground font-bold">
                {formatCurrency(costs.range.central.quantumALE)}
              </span>
            </span>
            <span>
              High ({Math.round(costs.range.high.pCrqc * 100)}%):{' '}
              <span className="text-foreground">{formatCurrency(costs.range.high.quantumALE)}</span>
            </span>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">
          Present value of the {planningHorizonYears}-year quantum-risk delta at{' '}
          {Math.round(discountRateAnnual * 100)}% discount:{' '}
          <span className="font-mono text-foreground font-semibold">
            {formatCurrency(costs.pvQuantumDelta)}
          </span>
        </p>
      </div>

      {/* ── Mosca decision layer ── */}
      <div className="glass-panel p-4 space-y-3 border-l-4 border-l-status-warning">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-status-warning" />
          <h4 className="text-sm font-bold text-foreground">
            When does migration need to start? (Mosca&apos;s theorem)
          </h4>
        </div>
        <p className="text-xs text-muted-foreground">
          If (data shelf life) + (migration time) exceeds the time until a CRQC exists, you are
          already too late.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-muted-foreground">x — shelf life</p>
            <p className="font-mono text-foreground text-lg font-bold">{shelfLifeYears} yrs</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <label htmlFor="migration-duration" className="text-muted-foreground block mb-1">
              y — migration time
            </label>
            <input
              id="migration-duration"
              type="range"
              min={1}
              max={8}
              value={migrationDurationYears}
              onChange={(e) => setMigrationDurationYears(parseInt(e.target.value))}
              className="w-full accent-primary mb-1"
            />
            <p className="font-mono text-foreground text-lg font-bold">
              {migrationDurationYears} yrs
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-muted-foreground">z — median CRQC year (consensus)</p>
            <p className="font-mono text-foreground text-lg font-bold">
              {Math.round(mosca.crqcYear)}
            </p>
          </div>
        </div>
        <div
          className={`rounded-lg p-3 text-sm ${
            mosca.alreadyLate
              ? 'bg-status-error/10 border border-status-error/30 text-status-error'
              : 'bg-status-success/10 border border-status-success/30 text-status-success'
          }`}
        >
          {mosca.alreadyLate ? (
            <>
              <strong>Already {Math.round(mosca.yearsLate)} year(s) late:</strong> migration should
              have started by {Math.round(mosca.latestSafeStartYear)} to protect{' '}
              {DATA_SENSITIVITY_LABELS[dataSensitivityClass].toLowerCase()} created today through
              the median CRQC arrival year.
            </>
          ) : (
            <>
              <strong>Latest safe start year: {Math.round(mosca.latestSafeStartYear)}.</strong>{' '}
              Starting migration by then keeps{' '}
              {DATA_SENSITIVITY_LABELS[dataSensitivityClass].toLowerCase()} protected through the
              median CRQC arrival year.
            </>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Cost of waiting 2 more years to start:{' '}
          <span className="font-mono text-status-warning font-semibold">
            +{formatCurrency(Math.max(0, waitTwoYearsCost))}
          </span>{' '}
          in present-value quantum-risk exposure.
        </p>
      </div>

      {/* ── Breakdown ── */}
      <details className="glass-panel p-4" open>
        <summary className="text-sm font-semibold text-foreground cursor-pointer flex items-center gap-2">
          <AlertTriangle size={16} className="text-status-error shrink-0" />
          How the quantum breach is built
        </summary>
        <div className="mt-3 space-y-1 bg-muted/50 rounded-lg p-3">
          <p className="text-xs font-mono text-muted-foreground">
            Classical: {formatCurrency(baseline)} × {breachScale.toFixed(2)} severity ={' '}
            <span className="text-foreground font-semibold">
              {formatCurrency(costs.classicalSLE)}
            </span>
          </p>
          <p className="text-xs font-mono text-muted-foreground">
            Shelf-life decay ({shelfLifeYears}yr {DATA_SENSITIVITY_LABELS[dataSensitivityClass]}):{' '}
            <span className="text-foreground font-semibold">{costs.decayFactor.toFixed(2)}×</span>
          </p>
          <p className="text-xs font-mono text-muted-foreground">
            HNDL amplification: 1 + min({HNDL_MULTIPLIER_CAP}, {yearsOfData}yr × {hndlFactorPct}% ×
            decay) ={' '}
            <span className="text-foreground font-semibold">
              {costs.hndlMultiplier.toFixed(2)}×
            </span>
          </p>
          <p className="text-xs font-mono text-muted-foreground">
            Quantum SLE: {formatCurrency(costs.classicalSLE)} × {costs.hndlMultiplier.toFixed(2)} ={' '}
            <span className="text-status-error font-bold">{formatCurrency(costs.quantumSLE)}</span>
          </p>
          <p className="text-xs font-mono text-muted-foreground">
            CRQC probability within {planningHorizonYears}yr horizon (consensus):{' '}
            <span className="text-foreground font-semibold">{Math.round(costs.pCrqc * 100)}%</span>
          </p>
          <p className="text-xs font-mono text-muted-foreground">
            Blended ALE: {formatCurrency(costs.classicalALE)} × (1 − {Math.round(costs.pCrqc * 100)}
            %) + {formatCurrency(costs.quantumSLE)} × {formatPct(annualBreachProbPct)}% ×{' '}
            {Math.round(costs.pCrqc * 100)}% ={' '}
            <span className="text-status-error font-bold">{formatCurrency(costs.quantumALE)}</span>
          </p>
        </div>
      </details>

      {/* ── Methodology ── */}
      <details className="glass-panel p-4">
        <summary className="text-sm font-medium text-foreground cursor-pointer">
          Calculation Methodology
        </summary>
        <div className="mt-3 text-sm text-muted-foreground space-y-2">
          <p>
            <strong>Baseline:</strong> the industry average total breach cost (IBM Cost of a Data
            Breach 2025), shared with the ROI Calculator and Cost Model Explorer — one source, no
            drift. It already includes reputational and lost-business costs, so those are not added
            separately.
          </p>
          <p>
            <strong>Severity:</strong> scales that average up or down for your scenario, instead of
            a flat per-record cost that would grow without bound.
          </p>
          <p>
            <strong>HNDL amplification:</strong> 1 + (years × exposure factor × shelf-life decay),
            capped at {1 + HNDL_MULTIPLIER_CAP}×. Decay is linear to zero at the data class&apos;s
            shelf life, using the harvested corpus&apos;s average age — a simplification, not an
            exponential curve.
          </p>
          <p>
            <strong>CRQC probability:</strong> looked up from the Global Risk Institute 2025 expert
            survey curve for the chosen planning horizon. This is a simple cumulative-probability
            difference, not conditioned on a CRQC not already existing today — a simplification that
            is negligible for near-term reference years.
          </p>
          <p>
            <strong>Expected annual loss:</strong> blends the classical and CRQC-conditional cases,
            weighted by that probability — not the old model&apos;s assumption that a CRQC already
            exists.
          </p>
          <p>
            <strong>Present value:</strong> the annual expected-loss delta is discounted as a level
            annuity over the planning horizon — an approximation, not a year-by-year integration of
            a growing risk curve.
          </p>
          <p>
            <strong>Mosca&apos;s theorem:</strong> compares data shelf life + migration time against
            the median CRQC arrival year to flag whether migration is already overdue.
          </p>
          <p className="text-xs italic mt-2">
            Educational estimates for planning. Actual costs vary widely by organization size,
            geography, and regulatory environment.
          </p>
        </div>
      </details>

      {/* ── References ── */}
      <details className="glass-panel p-4">
        <summary className="text-sm font-medium text-foreground cursor-pointer flex items-center gap-2">
          <BookOpen size={14} className="text-primary shrink-0" />
          References
        </summary>
        <ul className="mt-3 text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
          <li>
            <a
              href="https://www.ibm.com/reports/data-breach"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              IBM Cost of a Data Breach Report 2025
            </a>{' '}
            — industry breach-cost baselines and per-record costs by data type.{' '}
            <span className="text-status-warning">{IBM_BASELINE_UNVERIFIED_NOTE}</span>
          </li>
          <li>
            <a
              href="https://globalriskinstitute.org/publication/quantum-threat-timeline-report-2025b/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Global Risk Institute — Quantum Threat Timeline Report 2025
            </a>{' '}
            — expert-survey CRQC-arrival probability curve.
          </li>
          {/* Both of these point INTO the library rather than out to the
              publisher. The library row is the stronger destination: it records
              which figure each constant was read from, the sha256 of the
              archived PDF, and the fact that reading it corrected three of the
              five numbers these tools rely on. The publisher's page carries
              none of that — it is the page that stood in for the report while
              the errors went unnoticed. (2026-08-11.) */}
          <li>
            <Link
              to={`/library?ref=${encodeURIComponent('NetDiligence Cyber Claims Study 2025')}`}
              className="text-primary hover:underline"
            >
              NetDiligence Cyber Claims Study 2025
            </Link>{' '}
            — organization-size cost anchors. Figures 9 and 10, five-year average incident cost:
            $264K for SMEs under $2B revenue, $10.3M for large companies.
          </li>
          <li>
            <Link
              to={`/library?ref=${encodeURIComponent('Cyentia IRIS 2025')}`}
              className="text-primary hover:underline"
            >
              Cyentia Institute — Information Risk Insights Study (IRIS) 2025
            </Link>{' '}
            — annual breach-probability defaults by organization size. Figure 6 for the typical
            firm, Figure 7 by revenue tier.
          </li>
          {shelfLifeHasCitation && (
            <li>
              <a
                href="https://www.archives.gov/isoo/policy-documents/eo-13526.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                US Executive Order 13526
              </a>{' '}
              — 25-year automatic declassification schedule, the basis for the classified/state
              secret shelf-life estimate.
            </li>
          )}
        </ul>
      </details>
    </div>
  )
}
