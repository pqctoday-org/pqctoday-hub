// SPDX-License-Identifier: GPL-3.0-only
import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts'
import {
  Info,
  Server,
  Cpu,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Gauge,
  Download,
  ChevronDown,
  MapPin,
  Users,
  Network,
  Lock,
  CreditCard,
  Shield,
} from 'lucide-react'
import clsx from 'clsx'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { CollapsibleSection } from '@/components/ui/CollapsibleSection'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import {
  USE_CASES,
  CLASSICAL_HSM_DEFAULT,
  PQC_HSM_DEFAULT,
  SIZE_PRESETS,
  ALGO_IDS,
  ALGO_LABELS,
  ALGO_SLIDER_RANGES,
  ORG_PARAM_DEFAULTS,
  ORG_PARAM_RANGES,
  REGION_PRESETS,
  BASE_UNIT_ALGO,
  deriveUseCaseTps,
  type AlgoId,
  type DeploymentSize,
  type UseCase,
  type HsmProfile,
  type OrgParams,
} from '@/data/hsmCapacityDefaults'
import { generateCsv, downloadCsv, csvFilename } from '@/utils/csvExport'

type Workload = 'classical' | 'pqc'
type Redundancy = 'n+1' | '2n'

interface UseCaseState {
  enabled: boolean
  tps: number
}

interface AlgoLoad {
  algo: AlgoId
  opsPerSec: number
}

interface ScenarioResult {
  key: string
  label: string
  shortLabel: string
  workload: Workload
  hsmProfile: HsmProfile
  algoLoad: AlgoLoad[]
  perAlgoHsms: Array<{
    algo: AlgoId
    hsms: number
    utilizationPct: number
    load: number
    capacity: number
  }>
  bottleneck: AlgoId
  /** Raw HSMs needed across the whole fleet (before distribution or redundancy). */
  requiredRaw: number
  /** Per-location raw need = ceil(requiredRaw / numLocations). */
  perLocationRaw: number
  /** Per-location need after local HA redundancy. */
  perLocationRequired: number
  /** Total fleet required = numLocations × perLocationRequired. */
  requiredWithRedundancy: number
  /** HSMs per location the user has deployed. */
  hsmsPerLocation: number
  /** Total deployed across all locations. */
  deployedHsms: number
  numLocations: number
  /** Whether each individual location meets its HA requirement. */
  perLocationSufficient: boolean
  sufficient: boolean
  fleetUtilizationPct: number
}

function applyRedundancy(n: number, mode: Redundancy): number {
  if (n <= 0) return 0
  return mode === '2n' ? n * 2 : n + 1
}

function computeAlgoLoad(
  useCases: UseCase[],
  state: Record<string, UseCaseState>,
  workload: Workload
): AlgoLoad[] {
  const totals: Record<AlgoId, number> = {
    'rsa-2048': 0,
    'ecdsa-p256': 0,
    'ecdh-p256': 0,
    'ml-dsa-65': 0,
    'ml-kem-768': 0,
    'aes-128': 0,
    'aes-256': 0,
  }
  for (const uc of useCases) {
    const s = state[uc.id]
    if (!s || !s.enabled) continue
    const ops = workload === 'classical' ? uc.classicalOps : uc.pqcOps
    for (const [algo, perTx] of Object.entries(ops)) {
      totals[algo as AlgoId] += s.tps * (perTx as number)
    }
  }
  return ALGO_IDS.map((algo) => ({ algo, opsPerSec: totals[algo] }))
}

/**
 * Compute one capacity scenario (today / tomorrow / upgraded).
 *
 * Math model — **per-site demand, geo-redundant active-active**:
 *   - Use-case TPS values describe what ONE site experiences (per-site load).
 *   - Each location is independently sized to serve the full per-site demand.
 *   - Multiple locations add geo-redundancy (any single site can fail entirely).
 *   - Each location also has its own local HA (N+1 or 2N).
 *
 *   load(a)              = Σ over enabled use-cases uc of: tps[uc] × uc.<workload>Ops[a]
 *                          (this is per-site load — TPS sliders are per-site)
 *   perLocationRaw(a)    = ceil( load(a) / hsmProfile.opsPerSec[a] )
 *   perLocationRaw       = max over a of perLocationRaw(a)              // bottleneck
 *   perLocationRequired  = applyRedundancy(perLocationRaw, mode)        // +1 or ×2
 *   requiredWithRedundancy = numLocations × perLocationRequired         // total fleet
 *
 *   `requiredRaw` is retained as a global figure for the worked-example explainer
 *   and is identical to `perLocationRaw` (each site already carries full demand).
 *
 * The three scenarios pair (workload, hsmProfile) as:
 *   today    — classical workload on classical HSM
 *   tomorrow — PQC workload on the *same* classical HSM (ML-DSA in software → 150 ops/s)
 *   upgraded — PQC workload on next-gen PQC HSM (ML-DSA in hardware → 8000 ops/s)
 *
 * See HsmCapacityCalculator.test.ts for the validated size × locations matrix.
 */
function computeScenario(
  key: string,
  label: string,
  shortLabel: string,
  workload: Workload,
  hsmProfile: HsmProfile,
  useCases: UseCase[],
  state: Record<string, UseCaseState>,
  redundancy: Redundancy,
  hsmsPerLocation: number,
  numLocations: number
): ScenarioResult {
  const algoLoad = computeAlgoLoad(useCases, state, workload)
  const perAlgoHsms = algoLoad.map(({ algo, opsPerSec }) => {
    const capacity = hsmProfile.opsPerSec[algo]
    // Per-site demand = full slider load (geo-redundant active-active, no splitting).
    const hsms = opsPerSec > 0 ? Math.ceil(opsPerSec / capacity) : 0
    const perLocCapacity = capacity * hsmsPerLocation
    const utilizationPct = hsmsPerLocation > 0 ? (opsPerSec / perLocCapacity) * 100 : 0
    return { algo, hsms, utilizationPct, load: opsPerSec, capacity }
  })
  // Per-site raw need (bottleneck algorithm).
  const perLocationRaw = perAlgoHsms.reduce((m, r) => Math.max(m, r.hsms), 0)
  const requiredRaw = perLocationRaw // global figure under per-site model; each site = R
  const bottleneck = perAlgoHsms.reduce<{ algo: AlgoId; hsms: number }>(
    (m, r) => (r.hsms > m.hsms ? { algo: r.algo, hsms: r.hsms } : m),
    { algo: 'rsa-2048', hsms: 0 }
  ).algo
  const perLocationRequired = applyRedundancy(perLocationRaw, redundancy)
  const requiredWithRedundancy = numLocations * perLocationRequired
  const deployedHsms = numLocations * hsmsPerLocation
  const perLocationSufficient = hsmsPerLocation >= perLocationRequired
  const fleetUtilizationPct = perAlgoHsms.reduce((m, r) => Math.max(m, r.utilizationPct), 0)
  return {
    key,
    label,
    shortLabel,
    workload,
    hsmProfile,
    algoLoad,
    perAlgoHsms,
    bottleneck,
    requiredRaw,
    perLocationRaw,
    perLocationRequired,
    requiredWithRedundancy,
    hsmsPerLocation,
    deployedHsms,
    numLocations,
    perLocationSufficient,
    sufficient: perLocationSufficient,
    fleetUtilizationPct,
  }
}

export function computeScenarios(params: {
  useCases: UseCase[]
  state: Record<string, UseCaseState>
  classical: HsmProfile
  pqc: HsmProfile
  redundancy: Redundancy
  hsmsPerLocation: { today: number; tomorrow: number; upgraded: number }
  numLocations: number
}): ScenarioResult[] {
  const { useCases, state, classical, pqc, redundancy, hsmsPerLocation, numLocations } = params
  return [
    computeScenario(
      'today',
      'Today — classical workload on classical HSM',
      'Today',
      'classical',
      classical,
      useCases,
      state,
      redundancy,
      hsmsPerLocation.today,
      numLocations
    ),
    computeScenario(
      'tomorrow',
      'Post-PQC migration on existing classical HSM fleet',
      'Post-PQC (existing fleet)',
      'pqc',
      classical,
      useCases,
      state,
      redundancy,
      hsmsPerLocation.tomorrow,
      numLocations
    ),
    computeScenario(
      'upgraded',
      'Post-PQC migration with next-gen PQC HSM',
      'Post-PQC (next-gen HSM)',
      'pqc',
      pqc,
      useCases,
      state,
      redundancy,
      hsmsPerLocation.upgraded,
      numLocations
    ),
  ]
}

const INVENTORY_SIZING: Record<
  DeploymentSize,
  {
    hsmMin: number
    hsmMax: number
    hsmStep: number
    hsmDefault: number
    locMax: number
    locDefault: number
  }
> = {
  small: { hsmMin: 2, hsmMax: 20, hsmStep: 1, hsmDefault: 4, locMax: 10, locDefault: 1 },
  medium: { hsmMin: 4, hsmMax: 200, hsmStep: 5, hsmDefault: 20, locMax: 100, locDefault: 5 },
  large: { hsmMin: 4, hsmMax: 10_000, hsmStep: 50, hsmDefault: 200, locMax: 1_000, locDefault: 20 },
}

function utilizationColor(pct: number): string {
  if (pct > 100) return 'var(--destructive)'
  if (pct >= 70) return 'var(--warning, #f59e0b)'
  return 'var(--primary)'
}

function utilizationClass(pct: number): string {
  if (pct > 100) return 'text-status-error'
  if (pct >= 70) return 'text-status-warning'
  return 'text-status-success'
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  format,
  tooltip,
  onChange,
  disabled,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  format: (v: number) => string
  tooltip?: string
  onChange: (v: number) => void
  disabled?: boolean
}) {
  return (
    <div className={clsx('space-y-1', disabled && 'opacity-50')}>
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-medium text-foreground flex items-center gap-1">
          {label}
          {tooltip && (
            <span
              title={tooltip}
              className="text-muted-foreground cursor-help"
              aria-label={tooltip}
            >
              <Info size={11} />
            </span>
          )}
        </label>
        <span className="text-xs font-mono text-primary">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary"
        aria-label={label}
        disabled={disabled}
      />
    </div>
  )
}

function NumericSliderRow({
  label,
  value,
  min,
  max,
  step,
  format,
  tooltip,
  onChange,
  disabled,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  format: (v: number) => string
  tooltip?: string
  onChange: (v: number) => void
  disabled?: boolean
}) {
  // Uncontrolled input so partial typing ("5", "50", "500") is preserved during
  // edit. Remount via `key` whenever `value` changes externally; commit on blur
  // or Enter. Avoids the classic controlled-input bug where clamping each
  // keystroke below `min` clobbers the user's intended target value.
  const commit = (raw: string) => {
    if (raw.trim() === '') return
    const v = Number(raw)
    if (Number.isFinite(v)) {
      const clamped = Math.min(max, Math.max(min, v))
      if (clamped !== value) onChange(clamped)
    }
  }

  return (
    <div className={clsx('space-y-1', disabled && 'opacity-50')}>
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-medium text-foreground flex items-center gap-1">
          {label}
          {tooltip && (
            <span
              title={tooltip}
              className="text-muted-foreground cursor-help"
              aria-label={tooltip}
            >
              <Info size={11} />
            </span>
          )}
        </label>
        <input
          key={String(value)}
          type="number"
          min={min}
          max={max}
          step={step}
          defaultValue={value}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              ;(e.currentTarget as HTMLInputElement).blur()
            }
          }}
          className="w-20 text-xs font-mono text-primary bg-muted/40 border border-border rounded px-1.5 py-0.5 text-right focus:outline-none focus:border-primary"
          aria-label={`${label} numeric input`}
          disabled={disabled}
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 accent-primary"
          aria-label={label}
          disabled={disabled}
        />
        <span className="text-[10px] font-mono text-muted-foreground w-20 text-right shrink-0">
          {format(value)}
        </span>
      </div>
    </div>
  )
}

function ScenarioCard({
  scenario,
  onHsmCountChange,
  onResetToRequired,
  hsmCountMax,
  inventoryLocked,
  inventoryCallout,
}: {
  scenario: ScenarioResult
  onHsmCountChange: (v: number) => void
  onResetToRequired: () => void
  hsmCountMax: number
  inventoryLocked?: boolean
  inventoryCallout?: string
}) {
  const demandMet = scenario.hsmsPerLocation >= scenario.perLocationRaw
  const haMet = scenario.perLocationSufficient
  const sufficient = haMet
  const Icon = sufficient ? CheckCircle2 : AlertTriangle
  const statusClass = sufficient
    ? 'text-status-success'
    : demandMet
      ? 'text-status-warning'
      : 'text-status-error'
  const statusBg = sufficient
    ? 'bg-status-success/10 border-status-success/40'
    : demandMet
      ? 'bg-status-warning/10 border-status-warning/40'
      : 'bg-status-error/10 border-status-error/40'
  const overallLabel = sufficient ? 'Sufficient' : demandMet ? 'Demand only' : 'Overloaded'

  // Capacity / requirement ratio gauge — bottleneck-driven so it matches the
  // sufficient/insufficient verdict. ratio ≥ 1.0 ⇔ HA met.
  const ratioVsRequirement =
    scenario.perLocationRequired > 0
      ? scenario.hsmsPerLocation / scenario.perLocationRequired
      : Infinity
  const ratioVsDemand =
    scenario.perLocationRaw > 0 ? scenario.hsmsPerLocation / scenario.perLocationRaw : Infinity
  const fmtRatio = (r: number) =>
    !Number.isFinite(r) ? 'idle' : r >= 100 ? '≥100×' : `${r.toFixed(2)}×`
  const gaugePct = Math.min(150, Math.max(0, ratioVsRequirement * 100))

  return (
    <div className="glass-panel p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            {scenario.shortLabel}
          </p>
          <p className="text-sm text-foreground mt-1">{scenario.hsmProfile.name}</p>
        </div>
        <div className={clsx('rounded-md border px-2 py-1 flex items-center gap-1', statusBg)}>
          <Icon size={14} className={statusClass} aria-hidden="true" />
          <span className={clsx('text-xs font-medium', statusClass)}>{overallLabel}</span>
        </div>
      </div>

      {/* Dual-badge: demand met / HA met */}
      <div className="grid grid-cols-2 gap-2">
        <div
          className={clsx(
            'rounded-md border px-2 py-1.5 text-[10px]',
            demandMet
              ? 'border-status-success/40 bg-status-success/5'
              : 'border-status-error/40 bg-status-error/5'
          )}
          title="Deployed HSMs ≥ raw HSMs required to serve TPS demand (no redundancy)"
        >
          <p className="font-mono uppercase tracking-widest text-muted-foreground">Demand</p>
          <p
            className={clsx(
              'font-mono font-semibold',
              demandMet ? 'text-status-success' : 'text-status-error'
            )}
          >
            {demandMet ? '✓ met' : '✗ short'} · {fmtRatio(ratioVsDemand)}
          </p>
          <p className="text-muted-foreground">
            {scenario.hsmsPerLocation} / {scenario.perLocationRaw} HSMs (per loc)
          </p>
        </div>
        <div
          className={clsx(
            'rounded-md border px-2 py-1.5 text-[10px]',
            haMet
              ? 'border-status-success/40 bg-status-success/5'
              : demandMet
                ? 'border-status-warning/40 bg-status-warning/5'
                : 'border-status-error/40 bg-status-error/5'
          )}
          title="Deployed HSMs ≥ raw + redundancy (availability target)"
        >
          <p className="font-mono uppercase tracking-widest text-muted-foreground">
            Availability (HA)
          </p>
          <p
            className={clsx(
              'font-mono font-semibold',
              haMet
                ? 'text-status-success'
                : demandMet
                  ? 'text-status-warning'
                  : 'text-status-error'
            )}
          >
            {haMet ? '✓ met' : '✗ short'} · {fmtRatio(ratioVsRequirement)}
          </p>
          <p className="text-muted-foreground">
            {scenario.hsmsPerLocation} / {scenario.perLocationRequired} HSMs (per loc)
          </p>
        </div>
      </div>

      {/* Capacity / requirement ratio gauge */}
      <div className="rounded-md bg-muted/20 px-2 py-1.5">
        <div className="flex items-center justify-between text-[10px] font-mono">
          <span className="text-muted-foreground uppercase tracking-widest">
            Capacity / requirement
          </span>
          <span className={clsx('font-semibold', statusClass)}>
            {fmtRatio(ratioVsRequirement)} ({Math.round(gaugePct)}%)
          </span>
        </div>
        <div className="h-2 bg-muted/40 rounded-full overflow-hidden mt-1 relative">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${(gaugePct / 150) * 100}%`,
              background: haMet
                ? 'var(--color-status-success, #10b981)'
                : demandMet
                  ? 'var(--warning, #f59e0b)'
                  : 'var(--destructive)',
            }}
          />
          {/* 100% threshold marker */}
          <div
            className="absolute top-0 bottom-0 w-px bg-foreground/40"
            style={{ left: `${(100 / 150) * 100}%` }}
            aria-hidden="true"
          />
        </div>
        <p className="text-[9px] text-muted-foreground mt-0.5">
          Marker at 1.0× = HA target. Below 1.0× = HA gap (demand may still be met).
        </p>
      </div>

      {/* Three-column breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
        <div className="rounded-md bg-muted/30 px-2 py-1.5">
          <p className="text-muted-foreground">Per location</p>
          <p className="font-mono text-foreground text-base">
            {scenario.perLocationRequired}{' '}
            <span className="text-xs text-muted-foreground">HSMs</span>
          </p>
          <p className="text-[10px] text-muted-foreground">
            {scenario.perLocationRaw} raw demand +{' '}
            {scenario.perLocationRequired - scenario.perLocationRaw} HA
          </p>
        </div>
        <div className="rounded-md bg-muted/30 px-2 py-1.5">
          <p className="text-muted-foreground">Deployed / loc</p>
          <p className="font-mono text-foreground text-base">
            {scenario.hsmsPerLocation} <span className="text-xs text-muted-foreground">HSMs</span>
          </p>
          <p className={clsx('text-[10px]', utilizationClass(scenario.fleetUtilizationPct))}>
            Peak {scenario.fleetUtilizationPct.toFixed(0)}% util
          </p>
        </div>
        <div className="rounded-md bg-muted/30 px-2 py-1.5">
          <p className="text-muted-foreground">Total fleet</p>
          <p className="font-mono text-foreground text-base">
            {scenario.deployedHsms} <span className="text-xs text-muted-foreground">HSMs</span>
          </p>
          <p className="text-[10px] text-muted-foreground">
            {scenario.numLocations} × {scenario.hsmsPerLocation}
          </p>
        </div>
      </div>

      {inventoryLocked ? (
        <p className="text-[10px] text-muted-foreground italic">
          HSM count locked by inventory mode
        </p>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-[11px] font-medium text-muted-foreground">
              HSMs / location (slider)
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetToRequired}
              className="h-8 min-w-[44px] text-[11px] px-2"
              title="Set deployed HSMs to the computed required count"
              aria-label="Set to required"
            >
              Use required
            </Button>
          </div>
          <input
            type="range"
            min={1}
            max={hsmCountMax}
            step={1}
            value={scenario.hsmsPerLocation}
            onChange={(e) => onHsmCountChange(Number(e.target.value))}
            className="w-full accent-primary"
            aria-label={`${scenario.shortLabel} HSMs per location`}
          />
        </div>
      )}

      {/* Per-algo utilization bars */}
      <div className="space-y-1">
        {scenario.perAlgoHsms
          .filter((r) => r.load > 0)
          .map((r) => (
            <div key={r.algo} className="space-y-0.5">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-muted-foreground">{ALGO_LABELS[r.algo]}</span>
                <span className={utilizationClass(r.utilizationPct)}>
                  {r.utilizationPct.toFixed(0)}%
                </span>
              </div>
              <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(r.utilizationPct, 100)}%`,
                    background: utilizationColor(r.utilizationPct),
                  }}
                />
              </div>
            </div>
          ))}
      </div>

      {scenario.key === 'tomorrow' && (
        <p className="text-[10px] text-status-warning bg-status-warning/5 border border-status-warning/20 rounded px-2 py-1.5 leading-relaxed">
          Requires vendor firmware update (PKCS#11 v3.2) for ML-KEM. Some classical HSMs cannot run
          ML-KEM without hardware replacement.
        </p>
      )}
      {inventoryCallout && (
        <p className="text-[10px] text-primary bg-primary/5 border border-primary/20 rounded px-2 py-1.5 leading-relaxed">
          {inventoryCallout}
        </p>
      )}
      <p className="text-[10px] text-muted-foreground italic">
        Bottleneck: <span className="font-mono">{ALGO_LABELS[scenario.bottleneck]}</span>
        {scenario.numLocations > 1 && (
          <span> · load split across {scenario.numLocations} locations</span>
        )}
      </p>
    </div>
  )
}

function TpsToHsmExplainer({
  scenarios,
  redundancy,
  numLocations,
}: {
  scenarios: ScenarioResult[]
  redundancy: Redundancy
  numLocations: number
}) {
  // Use the worst-case (most stressed) scenario to ground the worked example.
  const worst = scenarios.reduce((m, s) => (s.requiredRaw > m.requiredRaw ? s : m), scenarios[0])
  const R = worst.requiredRaw
  const L = Math.max(1, numLocations)
  const perLocRaw = R > 0 ? Math.ceil(R / L) : 0
  const nPlus1 = perLocRaw + 1
  const twoN = perLocRaw * 2
  const bottleneckLabel = ALGO_LABELS[worst.bottleneck]
  const bottleneckLoad = worst.perAlgoHsms.find((r) => r.algo === worst.bottleneck)?.load ?? 0
  const bottleneckCap = worst.perAlgoHsms.find((r) => r.algo === worst.bottleneck)?.capacity ?? 1

  return (
    <div className="glass-panel p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Info size={14} className="text-primary" aria-hidden="true" />
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          How TPS becomes HSM count
        </p>
      </div>
      <ol className="text-xs text-foreground space-y-2 list-decimal list-inside leading-relaxed">
        <li>
          <span className="font-semibold">Aggregate (per site)</span> — sum every enabled use
          case&apos;s TPS × ops-per-transaction, by algorithm. TPS values describe what{' '}
          <em>one site</em> experiences; result is ops/sec per algorithm at a single location.
        </li>
        <li>
          <span className="font-semibold">Bottleneck</span> — divide each algorithm&apos;s load by
          its HSM capacity; round up. The slowest algorithm sets the floor. In the worst current
          scenario (<span className="font-mono text-primary">{worst.shortLabel}</span>
          ), the bottleneck is <span className="font-mono text-primary">
            {bottleneckLabel}
          </span> at{' '}
          <span className="font-mono">{Math.round(bottleneckLoad).toLocaleString()}</span> ops/s ÷{' '}
          <span className="font-mono">{bottleneckCap.toLocaleString()}</span> ops/s ={' '}
          <span className="font-mono text-secondary">R = {R}</span> HSMs to serve one
          location&apos;s demand.
        </li>
        <li>
          <span className="font-semibold">Replicate per location</span> — each of{' '}
          <span className="font-mono">L = {L}</span> location
          {L !== 1 ? 's' : ''} independently runs the full per-site workload (geo-redundant
          active-active). No load splitting: every site carries{' '}
          <span className="font-mono">R = {perLocRaw}</span> HSM
          {perLocRaw !== 1 ? 's' : ''} of demand. Multi-location adds geo-HA (any single site can
          fail entirely).
        </li>
        <li>
          <span className="font-semibold">Add local availability headroom</span> — on top of the raw
          demand count, each location gets its own N+1 or 2N spare. The raw count <em>alone</em>{' '}
          meets TPS demand; local redundancy keeps that site serving traffic when an HSM there
          fails.
        </li>
      </ol>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        <div
          className={clsx(
            'rounded-md border px-3 py-2 space-y-1',
            redundancy === 'n+1' ? 'border-primary/50 bg-primary/5' : 'border-border/40 bg-muted/20'
          )}
        >
          <p className="text-xs font-semibold text-foreground">N + 1 — tolerate 1 failure</p>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Per-location HSMs = <span className="font-mono">raw + 1</span> = {perLocRaw} + 1 ={' '}
            <span className="font-mono text-primary">{nPlus1}</span> HSM
            {nPlus1 !== 1 ? 's' : ''}. The +1 is an idle spare; demand is met by the {perLocRaw}{' '}
            active HSM{perLocRaw !== 1 ? 's' : ''}. Lose one and the remaining {nPlus1 - 1} still
            cover {perLocRaw} HSMs&apos; worth of demand.
          </p>
          <p className="text-[10px] font-mono text-muted-foreground">
            Total fleet = {L} × {nPlus1} = {L * nPlus1} HSMs
          </p>
        </div>
        <div
          className={clsx(
            'rounded-md border px-3 py-2 space-y-1',
            redundancy === '2n' ? 'border-primary/50 bg-primary/5' : 'border-border/40 bg-muted/20'
          )}
        >
          <p className="text-xs font-semibold text-foreground">
            2N — fully redundant active-active
          </p>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Per-location HSMs = <span className="font-mono">raw × 2</span> = {perLocRaw} × 2 ={' '}
            <span className="font-mono text-primary">{twoN}</span> HSM{twoN !== 1 ? 's' : ''}. Two
            parallel sets of {perLocRaw} HSMs both serve traffic; lose an entire set and the other
            still carries 100% of demand.
          </p>
          <p className="text-[10px] font-mono text-muted-foreground">
            Total fleet = {L} × {twoN} = {L * twoN} HSMs
          </p>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground italic leading-relaxed">
        Key invariant —{' '}
        <span className="text-foreground">TPS demand is met by the raw count alone</span> (
        {perLocRaw} HSMs/location). Redundancy ({redundancy === 'n+1' ? 'N+1' : '2N'}) adds{' '}
        {redundancy === 'n+1'
          ? '1 spare per location'
          : `${perLocRaw} additional active HSMs per location`}{' '}
        to maintain availability under failure. Sufficiency status in each scenario card below
        reports both: <span className="text-status-success">Demand met</span> (deployed ≥ raw) AND{' '}
        <span className="text-status-success">HA met</span> (deployed ≥ raw + redundancy).
      </p>
    </div>
  )
}

function PerLocationCard({
  locIndex,
  regionLabel,
  onRegionChange,
  scenarios,
  redundancy,
}: {
  locIndex: number
  regionLabel: string
  onRegionChange: (label: string) => void
  scenarios: ScenarioResult[]
  redundancy: Redundancy
}) {
  return (
    <div className="glass-panel p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <MapPin size={12} className="text-primary" aria-hidden="true" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Loc {locIndex + 1}
          </span>
        </div>
        <FilterDropdown
          items={REGION_PRESETS}
          selectedId={regionLabel}
          onSelect={onRegionChange}
          size="sm"
          variant="ghost"
          defaultLabel={regionLabel}
          defaultIcon={null}
          noContainer
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {scenarios.map((s) => (
          <ScenarioLocationBlock key={s.key} scenario={s} redundancy={redundancy} />
        ))}
      </div>
    </div>
  )
}

function ScenarioLocationBlock({
  scenario,
  redundancy,
}: {
  scenario: ScenarioResult
  redundancy: Redundancy
}) {
  const {
    hsmsPerLocation,
    perLocationRaw,
    perLocationRequired,
    perLocationSufficient,
    hsmProfile,
  } = scenario
  const baseRate = hsmProfile.opsPerSec[BASE_UNIT_ALGO]
  const capacityRsa = hsmsPerLocation * baseRate
  // Demand: met by raw count alone (redundancy is for availability, not throughput).
  const demandMet = hsmsPerLocation >= perLocationRaw
  const haMet = perLocationSufficient
  const statusClass = haMet
    ? 'text-status-success'
    : demandMet
      ? 'text-status-warning'
      : 'text-status-error'
  const MAX_ICONS = Math.min(hsmsPerLocation, 8)
  const extra = hsmsPerLocation - MAX_ICONS
  const demandRatio = perLocationRaw > 0 ? hsmsPerLocation / perLocationRaw : Infinity
  const demandLabel =
    demandRatio === Infinity ? 'idle' : demandRatio >= 100 ? '≥100×' : `${demandRatio.toFixed(2)}×`
  const spare = Math.max(0, hsmsPerLocation - perLocationRaw)
  const haTarget = perLocationRequired - perLocationRaw
  const haLabel =
    redundancy === 'n+1' ? `N+1: +${haTarget} spare` : `2N: ×2 (+${haTarget} active spare)`

  return (
    <div className="rounded-md border border-border/40 bg-muted/20 px-2 py-1.5 space-y-1">
      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        {scenario.shortLabel}
      </p>
      <div className="flex flex-wrap items-center gap-0.5 min-h-[16px]">
        {Array.from({ length: MAX_ICONS }).map((_, i) => {
          const isSpare = i >= perLocationRaw
          return (
            <Server
              key={i}
              size={11}
              className={clsx('shrink-0', isSpare ? 'text-muted-foreground' : statusClass)}
              aria-hidden="true"
            />
          )
        })}
        {extra > 0 && (
          <span className="text-[9px] font-mono text-muted-foreground ml-0.5">+{extra}</span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-x-2 text-[10px] font-mono">
        <span className="text-muted-foreground">Deployed:</span>
        <span className="text-foreground text-right">
          {hsmsPerLocation} HSM{hsmsPerLocation !== 1 ? 's' : ''}
        </span>
        <span className="text-muted-foreground" title="HSMs needed to serve TPS demand">
          Demand needs:
        </span>
        <span className={clsx('text-right', demandMet ? 'text-foreground' : 'text-status-error')}>
          {perLocationRaw} HSM{perLocationRaw !== 1 ? 's' : ''} · {demandLabel}
        </span>
        <span className="text-muted-foreground" title="Extra HSMs for availability when one fails">
          HA target:
        </span>
        <span className={clsx('text-right', haMet ? 'text-foreground' : 'text-status-warning')}>
          {perLocationRequired} ({haLabel})
        </span>
        <span className="text-muted-foreground">Capacity:</span>
        <span className="text-foreground text-right">{capacityRsa.toLocaleString()}</span>
        <span className="text-muted-foreground" />
        <span className="text-[9px] text-muted-foreground text-right">RSA-2048 ops/s</span>
        <span className="text-muted-foreground">Spare HSMs:</span>
        <span className="text-foreground text-right">{spare}</span>
      </div>
    </div>
  )
}

const USE_CASE_CATEGORIES = [
  {
    label: 'Network & Infrastructure',
    icon: Network,
    ids: ['tls', 'vpn-ike', 'ssh', 'dnssec'],
  },
  {
    label: 'PKI & Signing',
    icon: Shield,
    ids: ['pki-ca', 'code-signing', 'doc-signing'],
  },
  {
    label: 'Data Security & Cloud',
    icon: Lock,
    ids: ['tde', 'kms'],
  },
  {
    label: 'Payments',
    icon: CreditCard,
    ids: ['payment'],
  },
]

export function HsmCapacityCalculator() {
  const [size, setSize] = useState<DeploymentSize>('medium')
  const [redundancy, setRedundancy] = useState<Redundancy>('n+1')
  const [numLocations, setNumLocations] = useState(1)
  const [orgParams, setOrgParams] = useState<OrgParams>(() => ORG_PARAM_DEFAULTS.medium)

  const [hasManualTpsAdjustments, setHasManualTpsAdjustments] = useState(false)
  const [, setReseedWarning] = useState(false)
  const [useCaseState, setUseCaseState] = useState<Record<string, UseCaseState>>(() => {
    const out: Record<string, UseCaseState> = {}
    for (const uc of USE_CASES) {
      out[uc.id] = {
        enabled: uc.defaultEnabled,
        tps: deriveUseCaseTps(uc.id, ORG_PARAM_DEFAULTS.medium),
      }
    }
    return out
  })

  const [classicalHsm, setClassicalHsm] = useState<HsmProfile>(CLASSICAL_HSM_DEFAULT)
  const [pqcHsm, setPqcHsm] = useState<HsmProfile>(PQC_HSM_DEFAULT)

  const [planningMode, setPlanningMode] = useState<'demand' | 'inventory'>('demand')
  const [inventoryHsmCount, setInventoryHsmCount] = useState(5)

  // Per-location HSM counts per scenario (user-adjustable). Auto-tracks the
  // computed per-location requirement until the user manually overrides.
  const [hsmsPerLocation, setHsmsPerLocation] = useState({ today: 2, tomorrow: 20, upgraded: 2 })
  const autoTrackRef = useRef<Record<'today' | 'tomorrow' | 'upgraded', boolean>>({
    today: true,
    tomorrow: true,
    upgraded: true,
  })

  // Seed TPS from org params for all use cases.
  const seedTpsFromOrgParams = useCallback((params: OrgParams) => {
    setUseCaseState((prev) => {
      const out: Record<string, UseCaseState> = {}
      for (const uc of USE_CASES) {
        out[uc.id] = {
          enabled: prev[uc.id]?.enabled ?? uc.defaultEnabled,
          tps: deriveUseCaseTps(uc.id, params),
        }
      }
      return out
    })
  }, [])

  const handleSizeChange = useCallback(
    (next: DeploymentSize) => {
      if (hasManualTpsAdjustments) {
        setReseedWarning(true)
        setHasManualTpsAdjustments(false)
      }
      setSize(next)
      const nextOrgParams = ORG_PARAM_DEFAULTS[next]
      setOrgParams(nextOrgParams)
      seedTpsFromOrgParams(nextOrgParams)
      const s = INVENTORY_SIZING[next]
      setInventoryHsmCount(s.hsmDefault)
      setNumLocations(s.locDefault)
      autoTrackRef.current = { today: true, tomorrow: true, upgraded: true }
    },
    [hasManualTpsAdjustments, seedTpsFromOrgParams]
  )

  const handleOrgParamChange = useCallback(
    (field: keyof OrgParams, value: number) => {
      if (hasManualTpsAdjustments) {
        setReseedWarning(true)
        setHasManualTpsAdjustments(false)
      }
      setOrgParams((prev) => {
        const next = { ...prev, [field]: value }
        seedTpsFromOrgParams(next)
        return next
      })
      autoTrackRef.current = { today: true, tomorrow: true, upgraded: true }
    },
    [hasManualTpsAdjustments, seedTpsFromOrgParams]
  )

  const scenarios = useMemo(() => {
    let hpl = hsmsPerLocation
    if (planningMode === 'inventory') {
      const perLocClassical = Math.max(1, Math.ceil(inventoryHsmCount / numLocations))
      // perLocationRequired is load-driven only — one draft call gives the correct
      // upgraded requirement without depending on hsmsPerLocation.upgraded.
      const draftUpgraded = computeScenarios({
        useCases: USE_CASES,
        state: useCaseState,
        classical: classicalHsm,
        pqc: pqcHsm,
        redundancy,
        numLocations,
        hsmsPerLocation: { today: perLocClassical, tomorrow: perLocClassical, upgraded: 1 },
      })[2]
      hpl = {
        today: perLocClassical,
        tomorrow: perLocClassical,
        upgraded: Math.max(1, draftUpgraded.perLocationRequired),
      }
    }
    return computeScenarios({
      useCases: USE_CASES,
      state: useCaseState,
      classical: classicalHsm,
      pqc: pqcHsm,
      redundancy,
      numLocations,
      hsmsPerLocation: hpl,
    })
  }, [
    useCaseState,
    classicalHsm,
    pqcHsm,
    redundancy,
    hsmsPerLocation,
    numLocations,
    planningMode,
    inventoryHsmCount,
  ])

  // Auto-track per-location slider to computed requirement (demand mode only).
  // Inventory mode computes hsmsPerLocation inline in the useMemo above.
  useEffect(() => {
    if (planningMode === 'inventory') return
    setHsmsPerLocation((prev) => {
      const next = { ...prev }
      let changed = false
      const keys = ['today', 'tomorrow', 'upgraded'] as const
      keys.forEach((k, i) => {
        const req = scenarios[i].perLocationRequired
        if (autoTrackRef.current[k] && prev[k] !== req) {
          next[k] = Math.max(1, req)
          changed = true
        }
      })
      return changed ? next : prev
    })
  }, [scenarios, planningMode])

  const setUseCaseEnabled = useCallback((id: string, enabled: boolean) => {
    setUseCaseState((prev) => ({ ...prev, [id]: { ...prev[id], enabled } }))
  }, [])

  const setUseCaseTps = useCallback((id: string, tps: number) => {
    setHasManualTpsAdjustments(true)
    setUseCaseState((prev) => ({ ...prev, [id]: { ...prev[id], tps } }))
  }, [])

  const setHsmProfileAlgo = useCallback((which: 'classical' | 'pqc', algo: AlgoId, v: number) => {
    const setter = which === 'classical' ? setClassicalHsm : setPqcHsm
    setter((prev) => ({ ...prev, opsPerSec: { ...prev.opsPerSec, [algo]: v } }))
  }, [])

  const setHsmCount = useCallback((key: 'today' | 'tomorrow' | 'upgraded', v: number) => {
    autoTrackRef.current[key] = false
    setHsmsPerLocation((prev) => ({ ...prev, [key]: v }))
  }, [])

  const resetHsmCount = useCallback(
    (key: 'today' | 'tomorrow' | 'upgraded') => {
      autoTrackRef.current[key] = true
      setHsmsPerLocation((prev) => ({
        ...prev,
        [key]: Math.max(
          1,
          scenarios[key === 'today' ? 0 : key === 'tomorrow' ? 1 : 2].perLocationRequired
        ),
      }))
    },
    [scenarios]
  )

  // Region labels per location — purely cosmetic, persisted in component state.
  // Defaults rotate through REGION_PRESETS so the first N locations show plausible
  // global active-active sites.
  const [regionLabels, setRegionLabels] = useState<Record<number, string>>({})
  const regionLabelFor = useCallback(
    (idx: number) => regionLabels[idx] ?? REGION_PRESETS[idx % REGION_PRESETS.length],
    [regionLabels]
  )
  const setRegionLabel = useCallback((idx: number, label: string) => {
    setRegionLabels((prev) => ({ ...prev, [idx]: label }))
  }, [])

  const [expandedEstimations, setExpandedEstimations] = useState<Set<string>>(new Set())
  const toggleEstimation = useCallback((id: string) => {
    setExpandedEstimations((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  // Per-location slider max
  const hsmCountMax = useMemo(
    () => Math.max(10, ...scenarios.map((s) => s.perLocationRequired * 3)),
    [scenarios]
  )

  // Inventory mode: how many next-gen HSMs give equivalent ML-DSA capacity to the classical fleet
  const equivalentNextGenTotal = useMemo(
    () =>
      Math.max(
        1,
        Math.ceil(
          (inventoryHsmCount * classicalHsm.opsPerSec['ml-dsa-65']) / pqcHsm.opsPerSec['ml-dsa-65']
        )
      ),
    [inventoryHsmCount, classicalHsm, pqcHsm]
  )

  const fleetChartData = scenarios.map((s) => ({
    name: s.shortLabel,
    'Required (demand)': s.numLocations * s.perLocationRaw,
    'Required (HA target)': s.requiredWithRedundancy,
    Deployed: s.deployedHsms,
  }))

  const pqcLoad = useMemo(() => computeAlgoLoad(USE_CASES, useCaseState, 'pqc'), [useCaseState])
  const classicalLoad = useMemo(
    () => computeAlgoLoad(USE_CASES, useCaseState, 'classical'),
    [useCaseState]
  )
  const loadChartData = ALGO_IDS.map((algo) => ({
    name: ALGO_LABELS[algo],
    Classical: classicalLoad.find((l) => l.algo === algo)?.opsPerSec ?? 0,
    PQC: pqcLoad.find((l) => l.algo === algo)?.opsPerSec ?? 0,
  }))

  const totalEnabledTps = useMemo(
    () =>
      USE_CASES.reduce(
        (sum, uc) => sum + (useCaseState[uc.id]?.enabled ? useCaseState[uc.id].tps : 0),
        0
      ),
    [useCaseState]
  )

  const handleExport = useCallback(() => {
    const rows = scenarios.flatMap((s) =>
      s.perAlgoHsms
        .filter((r) => r.load > 0)
        .map((r) => ({
          scenario: s.shortLabel,
          workload: s.workload,
          hsmProfile: s.hsmProfile.name,
          algorithm: ALGO_LABELS[r.algo],
          load: Math.round(r.load),
          capacity: r.capacity,
          numLocations: s.numLocations,
          hsmsPerLocation: s.hsmsPerLocation,
          perLocationRequired: s.perLocationRequired,
          hsmsRequired: s.requiredWithRedundancy,
          deployedHsms: s.deployedHsms,
          utilizationPct: Math.round(r.utilizationPct),
          perLocationSufficient: s.perLocationSufficient ? 'Yes' : 'No',
          sufficient: s.sufficient ? 'Yes' : 'No',
        }))
    )
    downloadCsv(
      generateCsv(rows, [
        { header: 'Scenario', accessor: (r) => r.scenario },
        { header: 'Workload', accessor: (r) => r.workload },
        { header: 'HSM profile', accessor: (r) => r.hsmProfile },
        { header: 'Algorithm', accessor: (r) => r.algorithm },
        { header: 'Load (ops/s)', accessor: (r) => r.load },
        { header: 'HSM capacity (ops/s)', accessor: (r) => r.capacity },
        { header: 'Locations', accessor: (r) => r.numLocations },
        { header: 'HSMs / location (deployed)', accessor: (r) => r.hsmsPerLocation },
        { header: 'HSMs / location (required)', accessor: (r) => r.perLocationRequired },
        { header: 'Total HSMs required', accessor: (r) => r.hsmsRequired },
        { header: 'Total HSMs deployed', accessor: (r) => r.deployedHsms },
        { header: 'Utilization % (per location)', accessor: (r) => r.utilizationPct },
        { header: 'Per-location sufficient', accessor: (r) => r.perLocationSufficient },
        { header: 'Sufficient', accessor: (r) => r.sufficient },
      ]),
      csvFilename('hsm-capacity')
    )
  }, [scenarios])

  return (
    <div className="space-y-6">
      {/* Disclaimer */}
      <div className="rounded-lg border border-status-warning/40 bg-status-warning/5 px-4 py-3 space-y-1.5">
        <p className="text-xs text-status-warning leading-relaxed">
          <span className="font-semibold">
            Simplified educational model — not a substitute for a consultant-grade capacity
            analysis.
          </span>{' '}
          This simulator assumes per-site demand with geo-redundant active-active replication (each
          location independently sized for the full workload), a single uniform HSM SKU per
          scenario, peak-window sizing, and best-case PKCS#11 throughput. It does not model latency
          budgets, per-tenant key isolation, geo-failover, cold-start surges, batching, partition
          slots, firmware-specific limits, or compliance-driven duty-cycle constraints. Use it to
          sanity-check ranges and explore trade-offs, not to size a production fleet.
        </p>
        <p className="text-xs text-status-warning leading-relaxed">
          HSM performance numbers are illustrative reference values from public vendor datasheets
          (Thales Luna 7, Entrust nShield 5c, Utimaco SecurityServer). No vendor currently publishes
          production ML-DSA hardware-accelerated TPS; that value is an extrapolation. Adjust every
          parameter to match your measured environment, and engage a vendor or HSM architect for a
          real deployment.
        </p>
      </div>

      {/* Fleet sizing model — collapsible */}
      <CollapsibleSection
        title="Fleet sizing model"
        icon={<Info size={14} className="text-primary" aria-hidden="true" />}
        defaultOpen={false}
      >
        <p className="text-xs text-foreground leading-relaxed">
          <span className="font-semibold text-primary">Per-site, geo-redundant active-active.</span>{' '}
          TPS sliders describe the load at a <em>single</em> location. Each location is
          independently sized to serve the full per-site workload; multiple locations exist for
          geo-redundancy (any single site can fail entirely without affecting the others). Local HA
          (N+1 or 2N) is applied at <span className="font-semibold">each</span> location on top of
          that raw per-site count.
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed mt-2">
          <span className="font-mono text-secondary">Per-site raw (R)</span> = max over all
          algorithms of ⌈ algo_ops/s ÷ hsm_capacity ⌉
          <br />
          <span className="font-mono text-secondary">N+1 per location</span> = R + 1
          <br />
          <span className="font-mono text-secondary">2N per location</span> = R × 2
          <br />
          <span className="font-mono text-secondary">Total fleet</span> = L × per-location HA need
          <br />
          <span className="font-mono text-secondary">Utilization (per location)</span> = load ÷
          (capacity × deployed/location)
        </p>
        <p className="text-[10px] text-muted-foreground/80 leading-relaxed mt-2">
          <span className="font-semibold text-foreground">Assumptions:</span> every site carries the
          same workload (no regional weighting; no load splitting); any HSM in the fleet can run any
          algorithm; redundancy is site-local; geo-redundancy across sites is in addition to local
          HA (most conservative sizing).
        </p>
      </CollapsibleSection>

      {/* Model limits & caveats — collapsible */}
      <CollapsibleSection
        title="Model limits & caveats"
        icon={<AlertTriangle size={14} className="text-status-warning" aria-hidden="true" />}
        defaultOpen={false}
      >
        <p className="text-xs text-foreground leading-relaxed">
          The calculator answers one specific question:{' '}
          <span className="italic">how many HSMs does steady-state throughput require?</span> A real
          production sizing exercise needs several factors this model deliberately does not capture.
          Treat the output as a first-order estimate — a starting point for vendor conversations and
          capacity-planning spreadsheets, not a final BOM.
        </p>

        <div className="mt-3 space-y-3 text-[11px] text-muted-foreground leading-relaxed">
          <div>
            <p className="font-semibold text-foreground mb-0.5">
              Distribution &amp; redundancy assumptions
            </p>
            <ul className="list-disc list-inside space-y-0.5 marker:text-muted-foreground/60">
              <li>
                <span className="text-foreground">Equal load split across locations.</span> Traffic
                is divided evenly by location count. No regional weighting, time-zone shift
                modelling, or follow-the-sun load curves. If your busiest region carries 60% of
                traffic, model that region as a separate single-location calculation.
              </li>
              <li>
                <span className="text-foreground">Redundancy is site-local.</span> N+1 means each
                site survives one HSM loss; 2N means each site is fully duplicated.{' '}
                <span className="italic">Cross-location failover is not modelled</span> — a
                whole-site outage would require additional capacity at peer sites that this
                calculator does not size for.
              </li>
              <li>
                <span className="text-foreground">No headroom / target-utilization factor.</span>{' '}
                Sizing rounds up to 100% HSM capacity. Production ops typically design for ~70%
                target utilization to absorb spikes. Add 30–40% to required HSMs as a working rule
                if you do not run a separate peak-vs-average study.
              </li>
            </ul>
          </div>

          <div>
            <p className="font-semibold text-foreground mb-0.5">Workload modelling</p>
            <ul className="list-disc list-inside space-y-0.5 marker:text-muted-foreground/60">
              <li>
                <span className="text-foreground">Throughput-based, not latency-based.</span> The
                model assumes a workload is feasible as long as ops/sec ≤ capacity. It does not
                model queueing, p99 latency, or HSM session-pool saturation. A 99%-utilized HSM
                meets throughput but typically misses tail-latency SLOs.
              </li>
              <li>
                <span className="text-foreground">Shared fleet.</span> Any HSM in the fleet is
                assumed to run any algorithm. Deployments that partition HSMs by use case (e.g.
                dedicated payment / PKI / KMS HSMs) need separate calculations per partition.
              </li>
              <li>
                <span className="text-foreground">Single PQC parameter set per algorithm.</span> The
                model uses ML-DSA-65 and ML-KEM-768. ML-DSA-44 (faster) and ML-DSA-87 (slower) are
                not selectable, and SLH-DSA / FN-DSA — required by some compliance regimes for
                code-signing roots — are not modelled at all.
              </li>
              <li>
                <span className="text-foreground">No batching / amortization.</span> Op counts
                assume one HSM call per transaction. Real workloads with batched AES bulk encryption
                or pipelined PKCS#11 calls scale differently.
              </li>
            </ul>
          </div>

          <div>
            <p className="font-semibold text-foreground mb-0.5">HSM throughput data caveats</p>
            <ul className="list-disc list-inside space-y-0.5 marker:text-muted-foreground/60">
              <li>
                <span className="text-foreground">PQC numbers are extrapolated.</span> No vendor
                currently publishes production ML-DSA hardware-accelerated TPS. The &quot;next-gen
                PQC HSM&quot; defaults are derived from FPGA / ASIC prototype benchmarks (NIST PQC
                reports, Marvell LiquidSecurity 2, Samsung S3SSE2A). Real shipping silicon may land
                within 1.5–3× of these estimates in either direction.
              </li>
              <li>
                <span className="text-foreground">
                  Classical numbers are vendor datasheet peaks.
                </span>{' '}
                Sustained TPS in production is typically 60–80% of datasheet peak after PKCS#11
                round-trip overhead, session management, and audit logging. Override the sliders
                with your benchmarked numbers when available.
              </li>
              <li>
                <span className="text-foreground">No network / interconnect overhead.</span> A
                network HSM adds 1–2 ms of PKCS#11 round-trip latency per call. For ML-DSA at 150
                ops/s the network is not the bottleneck; for AES at 25 000 ops/s it can be.
              </li>
            </ul>
          </div>

          <div>
            <p className="font-semibold text-foreground mb-0.5">Migration dynamics not modelled</p>
            <ul className="list-disc list-inside space-y-0.5 marker:text-muted-foreground/60">
              <li>
                <span className="text-foreground">One-time re-keying spike.</span> Migrating
                certificates, TDE master keys, code-signing roots, and PIN zones to PQC produces a
                bulk re-signing / re-encrypting event that can run 10× steady-state for
                hours-to-days. Plan for that separately as a project event, not as steady-state
                capacity.
              </li>
              <li>
                <span className="text-foreground">Hybrid signature transitions.</span> Only TLS is
                modelled as hybrid (X25519MLKEM768 KEM). Some operators run hybrid signatures (RSA +
                ML-DSA on every artifact) during the transition window — that doubles signing load
                and is not in the current model.
              </li>
              <li>
                <span className="text-foreground">Audit, backup, and key-import load.</span> HSM
                firmware updates, partition backups, and bulk key import during provisioning
                generate short-lived peaks not represented in the steady-state TPS view.
              </li>
            </ul>
          </div>

          <div>
            <p className="font-semibold text-foreground mb-0.5">
              UI behaviour — non-obvious slider interactions
            </p>
            <ul className="list-disc list-inside space-y-0.5 marker:text-muted-foreground/60">
              <li>
                <span className="text-foreground">
                  Deployed HSM-per-location sliders do not affect required HSMs.
                </span>{' '}
                The today / tomorrow / upgraded sliders set{' '}
                <span className="italic">what you have deployed</span>. They drive utilization % and
                the sufficient/overloaded flag, but they do not change{' '}
                <span className="font-mono">requiredRaw</span> or{' '}
                <span className="font-mono">requiredWithRedundancy</span> — those depend only on
                load and HSM capacity. Dragging the deployed slider cannot &quot;fix&quot; an
                undersized fleet.
              </li>
              <li>
                <span className="text-foreground">
                  Changing an organisation-profile slider re-seeds every use-case TPS.
                </span>{' '}
                Org sliders (employees, developers, servers, databases, microservices, payment TPS)
                feed every use case&apos;s TPS via the per-case formula. So nudging
                &quot;employees&quot; after manually setting a TLS TPS will overwrite that manual
                value. Per-use-case enabled checkboxes are preserved across the re-seed.
              </li>
              <li>
                <span className="text-foreground">
                  Per-scenario deployed sliders auto-track the computed requirement until you drag
                  one.
                </span>{' '}
                On first render, today / tomorrow / upgraded snap to{' '}
                <span className="font-mono">perLocationRequired</span>. Once you drag a slider, it
                stops auto-tracking for that scenario. Clicking a deployment-size preset (small /
                medium / large) resets all three back to auto-track.
              </li>
              <li>
                <span className="text-foreground">Inventory mode locks the deployed sliders.</span>{' '}
                In Inventory sizing, today and post-PQC classical deployed counts are computed as ⌈
                inventory ÷ locations ⌉ and not user-editable; the next-gen scenario&apos;s deployed
                count is sized to the load.
              </li>
              <li>
                <span className="text-foreground">
                  &quot;Deployment size&quot; (small / medium / large) is a preset, not a model
                  parameter.
                </span>{' '}
                It is a one-shot button that re-seeds organisation params, inventory defaults, and
                location count. After clicking it, every value can still be tuned individually — the
                size label does not constrain the calculation downstream.
              </li>
            </ul>
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground/80 leading-relaxed mt-3 italic">
          When in doubt, override the per-algorithm capacity sliders, the per-use-case TPS sliders,
          and the redundancy mode to match your measured environment — every default in this
          calculator is exposed as a tunable parameter for exactly this reason.
        </p>
      </CollapsibleSection>

      {/* Deployment size + redundancy + distributed topology */}
      <div className="glass-panel p-4 space-y-4">
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          Deployment profile
        </p>

        {/* Planning mode toggle */}
        <div className="flex flex-wrap items-center gap-3 pb-3 border-b border-border/40">
          <span className="text-xs text-muted-foreground shrink-0">Planning mode:</span>
          <div className="flex rounded-md overflow-hidden border border-border">
            {(['demand', 'inventory'] as const).map((m) => (
              <Button
                key={m}
                variant="ghost"
                size="sm"
                onClick={() => {
                  setPlanningMode(m)
                  if (m === 'demand')
                    autoTrackRef.current = { today: true, tomorrow: true, upgraded: true }
                }}
                className={clsx(
                  'px-3 py-1 text-xs font-mono rounded-none h-auto',
                  planningMode === m
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-muted/30 text-foreground hover:bg-muted/60'
                )}
                aria-pressed={planningMode === m}
              >
                {m === 'demand' ? 'Demand sizing' : 'Inventory sizing'}
              </Button>
            ))}
          </div>
          <span className="text-[10px] text-muted-foreground">
            {planningMode === 'demand'
              ? 'Enter workload → compute required HSMs'
              : 'Enter your existing fleet → compute headroom & replacement'}
          </span>
        </div>

        {/* Inventory mode input */}
        {planningMode === 'inventory' && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Enter your existing classical HSM fleet size. Today&apos;s and post-PQC classical
              scenario counts are locked to this value. The next-gen scenario is computed.
            </p>
            <NumericSliderRow
              label="Classical HSMs I currently own (total fleet)"
              value={inventoryHsmCount}
              min={INVENTORY_SIZING[size].hsmMin}
              max={INVENTORY_SIZING[size].hsmMax}
              step={INVENTORY_SIZING[size].hsmStep}
              format={(v) => `${v} HSM${v !== 1 ? 's' : ''}`}
              tooltip="Total classical HSMs across all locations. Per-location = ceil(N ÷ locations)."
              onChange={setInventoryHsmCount}
            />
            <NumericSliderRow
              label="Number of locations"
              value={numLocations}
              min={1}
              max={INVENTORY_SIZING[size].locMax}
              step={1}
              format={(v) => `${v} location${v !== 1 ? 's' : ''}`}
              tooltip="Physical sites or data centres. Each independently satisfies the HA model."
              onChange={setNumLocations}
            />
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">HA model per location:</span>
              <div className="flex rounded-md overflow-hidden border border-border">
                {(['n+1', '2n'] as Redundancy[]).map((r) => (
                  <Button
                    key={r}
                    variant="ghost"
                    size="sm"
                    onClick={() => setRedundancy(r)}
                    className={clsx(
                      'px-3 py-1 text-xs font-mono rounded-none h-auto',
                      redundancy === r
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'bg-muted/30 text-foreground hover:bg-muted/60'
                    )}
                    aria-pressed={redundancy === r}
                  >
                    {r === 'n+1' ? 'N + 1' : '2N'}
                  </Button>
                ))}
              </div>
            </div>
            <p className="text-[10px] font-mono text-muted-foreground">
              Today &amp; post-PQC classical:{' '}
              <span className="text-primary">
                {Math.ceil(inventoryHsmCount / numLocations)} HSM
                {Math.ceil(inventoryHsmCount / numLocations) !== 1 ? 's' : ''}/location
              </span>{' '}
              · Post-PQC next-gen:{' '}
              <span className="text-primary">
                computed · equivalent capacity: {equivalentNextGenTotal} next-gen HSM
                {equivalentNextGenTotal !== 1 ? 's' : ''} total
              </span>
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {SIZE_PRESETS.map((p) => (
            <Button
              key={p.id}
              variant="ghost"
              onClick={() => handleSizeChange(p.id)}
              className={clsx(
                'text-left rounded-lg border px-3 py-2 h-auto flex-col items-start transition-colors',
                size === p.id
                  ? 'border-primary bg-primary/10 hover:bg-primary/15'
                  : 'border-border bg-muted/20 hover:border-primary/40'
              )}
              aria-pressed={size === p.id}
            >
              <p className="text-sm font-semibold text-foreground">{p.name}</p>
              <p className="text-[10px] text-muted-foreground whitespace-normal">{p.description}</p>
              <p className="text-[10px] font-mono text-primary mt-0.5">
                ~{p.aggregateTps.toLocaleString()} TPS aggregate
              </p>
            </Button>
          ))}
        </div>

        {/* Redundancy + Distributed topology — hidden in inventory mode (those controls live in the inventory panel above) */}
        {planningMode === 'demand' && (
          <>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">Redundancy:</span>
              <div className="flex rounded-md overflow-hidden border border-border">
                {(['n+1', '2n'] as Redundancy[]).map((r) => (
                  <Button
                    key={r}
                    variant="ghost"
                    size="sm"
                    onClick={() => setRedundancy(r)}
                    className={clsx(
                      'px-3 py-1 text-xs font-mono rounded-none h-auto',
                      redundancy === r
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'bg-muted/30 text-foreground hover:bg-muted/60'
                    )}
                    aria-pressed={redundancy === r}
                  >
                    {r === 'n+1' ? 'N + 1' : '2N'}
                  </Button>
                ))}
              </div>
              <span className="ml-auto text-xs text-muted-foreground">
                Checked TPS total:{' '}
                <span className="font-mono text-primary">{totalEnabledTps.toLocaleString()}</span>
              </span>
            </div>

            <div className="border-t border-border/40 pt-4 space-y-3">
              <div className="flex items-center gap-2">
                <MapPin size={13} className="text-primary" aria-hidden="true" />
                <p className="text-xs font-medium text-foreground">Distributed topology</p>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Each location runs the{' '}
                <span className="font-semibold text-foreground">full per-site workload</span>{' '}
                independently — multi-location deployments add geo-redundancy (one site can fail
                without affecting others). Each site also has its own local HA (N+1 or 2N) on top of
                raw demand.
              </p>
              <NumericSliderRow
                label="Number of locations"
                value={numLocations}
                min={1}
                max={1_000}
                step={1}
                format={(v) => `${v} location${v !== 1 ? 's' : ''}`}
                tooltip="Physical sites, data centres, or availability zones. Each independently serves the full per-site workload AND satisfies the local HA model."
                onChange={setNumLocations}
              />
              <CollapsibleSection
                title="Per-location capacity formula"
                icon={<Info size={12} className="text-muted-foreground" aria-hidden="true" />}
                defaultOpen={false}
              >
                <div className="text-[10px] space-y-2 font-mono text-muted-foreground">
                  <p>
                    <span className="text-secondary">Per-site raw (R)</span> = max over all
                    algorithms of ⌈ algo_ops/s ÷ hsm_capacity ⌉
                  </p>
                  <p>
                    <span className="text-secondary">Per-location HA need</span> = redundancy
                    applied to R
                    <br />
                    &nbsp;&nbsp;N+1 → R + 1 &nbsp;·&nbsp; 2N → R × 2
                  </p>
                  <p>
                    <span className="text-secondary">Total fleet required</span> = L × per-location
                    HA need
                  </p>
                  <p className="text-muted-foreground/70">
                    R = per-site raw HSMs (bottleneck algorithm) · L = number of geo-redundant sites
                  </p>
                  <div className="mt-2 pt-2 border-t border-border/30 space-y-0.5">
                    <p className="text-foreground font-semibold">Example A — N+1, R=13, L=3:</p>
                    <p>Per-location raw = R = 13 HSMs</p>
                    <p>Per-location HA = 13 + 1 = 14 HSMs</p>
                    <p>Total required = 3 × 14 = 42 HSMs</p>
                  </div>
                  <div className="mt-2 pt-2 border-t border-border/30 space-y-0.5">
                    <p className="text-foreground font-semibold">Example B — 2N, R=13, L=3:</p>
                    <p>Per-location raw = R = 13 HSMs</p>
                    <p>Per-location HA = 13 × 2 = 26 HSMs</p>
                    <p>Total required = 3 × 26 = 78 HSMs</p>
                  </div>
                  <p className="text-muted-foreground/70 mt-2">
                    Note: this model treats each site as fully active-active. Adding L locations
                    multiplies total HSM count by L (since every site carries the full workload) —
                    this is the most conservative geo-redundant sizing. If your real deployment
                    splits load across sites, divide R by your active-site count.
                  </p>
                </div>
              </CollapsibleSection>
            </div>
          </>
        )}
      </div>

      {/* Organisation profile — sliders that derive TPS */}
      <CollapsibleSection
        title="Organisation profile (per-site)"
        icon={<Users size={14} className="text-primary" aria-hidden="true" />}
        defaultOpen={true}
      >
        <p className="text-[10px] text-muted-foreground mb-3">
          These sliders describe what{' '}
          <span className="font-semibold text-foreground">one location</span> experiences. Adjusting
          any of them re-derives the per-site TPS for every use case using the formulas in each use
          case&apos;s &quot;How we estimated this&quot; panel. Multi-location deployments replicate
          this load at every site for geo-redundancy.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          {(Object.keys(ORG_PARAM_RANGES) as (keyof OrgParams)[]).map((field) => {
            const range = ORG_PARAM_RANGES[field]
            return (
              <div key={field} className="space-y-0.5">
                <NumericSliderRow
                  label={range.label}
                  value={orgParams[field]}
                  min={range.min}
                  max={range.max}
                  step={range.step}
                  format={(v) =>
                    field === 'paymentTps' ? `${v.toLocaleString()} TPS` : v.toLocaleString()
                  }
                  tooltip={range.description}
                  onChange={(v) => handleOrgParamChange(field, v)}
                />
              </div>
            )
          })}
        </div>
      </CollapsibleSection>

      {/* Use cases — checkboxes + TPS sliders */}
      <div className="glass-panel p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            Enterprise use cases
          </p>
          <p className="text-[10px] text-muted-foreground">
            Check a use case to add its load to the fleet requirement.
          </p>
        </div>
        <div>
          {USE_CASE_CATEGORIES.map((cat) => {
            const categoryUseCases = USE_CASES.filter((uc) => cat.ids.includes(uc.id))
            if (categoryUseCases.length === 0) return null
            return (
              <div key={cat.label} className="mb-6 last:mb-0">
                <div className="flex items-center gap-1.5 mb-3">
                  <cat.icon size={14} className="text-muted-foreground" />
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    {cat.label}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {categoryUseCases.map((uc) => {
                    const s = useCaseState[uc.id]
                    const pqcAlgos = Object.keys(uc.pqcOps) as AlgoId[]
                    return (
                      <div
                        key={uc.id}
                        className={clsx(
                          'rounded-lg border p-3 space-y-2 transition-colors',
                          s.enabled ? 'border-primary/40 bg-primary/5' : 'border-border bg-muted/10'
                        )}
                      >
                        <div className="flex items-start gap-2 cursor-pointer">
                          <Switch
                            checked={s.enabled}
                            onCheckedChange={(checked) => setUseCaseEnabled(uc.id, checked)}
                            aria-label={`Enable ${uc.name}`}
                            className="mt-0.5 shrink-0"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">{uc.name}</p>
                            <p className="text-[10px] text-muted-foreground">{uc.description}</p>
                            <p className="text-[10px] font-mono text-secondary mt-1">
                              Post-PQC ops: {pqcAlgos.map((a) => ALGO_LABELS[a]).join(' + ')}
                            </p>
                          </div>
                        </div>
                        <SliderRow
                          label="Transactions / sec"
                          value={s.tps}
                          min={0}
                          max={Math.max(uc.defaultTps.large * 3, 100)}
                          step={Math.max(1, Math.floor(uc.defaultTps[size] / 50) || 1)}
                          format={(v) => v.toLocaleString()}
                          onChange={(v) => setUseCaseTps(uc.id, v)}
                          disabled={!s.enabled}
                        />
                        <Button
                          variant="ghost"
                          onClick={() => toggleEstimation(uc.id)}
                          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors mt-1 h-auto p-0"
                          aria-expanded={expandedEstimations.has(uc.id)}
                        >
                          <ChevronDown
                            size={12}
                            className={clsx(
                              'transition-transform duration-150',
                              expandedEstimations.has(uc.id) && 'rotate-180'
                            )}
                            aria-hidden="true"
                          />
                          How we estimated this
                        </Button>
                        {expandedEstimations.has(uc.id) && (
                          <div className="mt-2 pt-2 border-t border-border/30 space-y-2 text-[10px]">
                            <p className="text-muted-foreground leading-relaxed">
                              {uc.estimation.rationale}
                            </p>
                            <p>
                              <span className="font-mono text-secondary uppercase tracking-wide">
                                Math ·{' '}
                              </span>
                              <span className="text-muted-foreground">{uc.estimation.math}</span>
                            </p>
                            <p>
                              <span className="font-mono text-secondary uppercase tracking-wide">
                                PQC impact ·{' '}
                              </span>
                              <span className="text-muted-foreground">
                                {uc.estimation.pqcImpact}
                              </span>
                            </p>
                            <p>
                              <span className="font-mono text-secondary uppercase tracking-wide">
                                Sources ·{' '}
                              </span>
                              <span className="text-muted-foreground">
                                {uc.estimation.sources.join(' · ')}
                              </span>
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Scenario cards */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Gauge size={16} className="text-primary" aria-hidden="true" />
          <p className="text-sm font-semibold text-foreground">Fleet sizing & sufficiency</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {scenarios.map((s, idx) => {
            const isInventoryLocked = planningMode === 'inventory'
            const inventoryCallout =
              planningMode === 'inventory' && s.key === 'upgraded'
                ? `Equivalent capacity: ${inventoryHsmCount} classical → ${equivalentNextGenTotal} next-gen HSM${equivalentNextGenTotal !== 1 ? 's' : ''} for ML-DSA workload (${Math.round(inventoryHsmCount / Math.max(1, equivalentNextGenTotal))}× fewer units)`
                : undefined
            return (
              <ScenarioCard
                key={s.key}
                scenario={s}
                hsmCountMax={hsmCountMax}
                inventoryLocked={isInventoryLocked}
                inventoryCallout={inventoryCallout}
                onHsmCountChange={(v) =>
                  setHsmCount(idx === 0 ? 'today' : idx === 1 ? 'tomorrow' : 'upgraded', v)
                }
                onResetToRequired={() =>
                  resetHsmCount(idx === 0 ? 'today' : idx === 1 ? 'tomorrow' : 'upgraded')
                }
              />
            )
          })}
        </div>
      </div>

      {/* How TPS becomes HSM count — explainer */}
      <TpsToHsmExplainer
        scenarios={scenarios}
        redundancy={redundancy}
        numLocations={numLocations}
      />

      {/* Per-location distribution panel */}
      <div className="glass-panel p-4 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-primary" aria-hidden="true" />
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              Per-location distribution
            </p>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Each of {numLocations} location{numLocations !== 1 ? 's' : ''} independently serves the
            full per-site workload (geo-redundant active-active). Region labels are cosmetic.
          </p>
        </div>
        {(() => {
          const MAX_LOCS = Math.min(numLocations, 8)
          const hiddenLocs = numLocations - MAX_LOCS
          return (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Array.from({ length: MAX_LOCS }).map((_, idx) => (
                  <PerLocationCard
                    key={idx}
                    locIndex={idx}
                    regionLabel={regionLabelFor(idx)}
                    onRegionChange={(label) => setRegionLabel(idx, label)}
                    scenarios={scenarios}
                    redundancy={redundancy}
                  />
                ))}
              </div>
              {hiddenLocs > 0 && (
                <p className="text-[10px] font-mono text-muted-foreground italic">
                  +{hiddenLocs} more location{hiddenLocs > 1 ? 's' : ''} identical to those above
                  (same HSM count, same load share, same redundancy).
                </p>
              )}
            </>
          )
        })()}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-panel p-4">
          <div className="flex items-center gap-2 mb-3">
            <Cpu size={14} className="text-primary" aria-hidden="true" />
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              HSMs required vs deployed
            </p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={fleetChartData} margin={{ top: 5, right: 5, bottom: 40, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 9, fill: 'var(--color-muted-foreground)' }}
                angle={-25}
                textAnchor="end"
                interval={0}
              />
              <YAxis tick={{ fontSize: 9, fill: 'var(--color-muted-foreground)' }} />
              <Tooltip
                contentStyle={{
                  background: 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                  fontSize: 11,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar
                dataKey="Required (demand)"
                fill="var(--color-muted-foreground)"
                radius={[3, 3, 0, 0]}
              />
              <Bar
                dataKey="Required (HA target)"
                fill="var(--color-primary)"
                radius={[3, 3, 0, 0]}
              />
              <Bar dataKey="Deployed" fill="var(--color-secondary)" radius={[3, 3, 0, 0]}>
                {fleetChartData.map((_d, i) => (
                  <Cell
                    key={i}
                    fill={scenarios[i].sufficient ? 'var(--color-secondary)' : 'var(--destructive)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-panel p-4">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck size={14} className="text-accent" aria-hidden="true" />
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              Workload per algorithm (ops / sec)
            </p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={loadChartData} margin={{ top: 5, right: 5, bottom: 40, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 9, fill: 'var(--color-muted-foreground)' }}
                angle={-25}
                textAnchor="end"
                interval={0}
              />
              <YAxis tick={{ fontSize: 9, fill: 'var(--color-muted-foreground)' }} />
              <Tooltip
                contentStyle={{
                  background: 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                  fontSize: 11,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="Classical" fill="var(--color-primary)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="PQC" fill="var(--color-accent)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* HSM performance profiles — sliders */}
      <CollapsibleSection
        title="HSM performance profiles (advanced)"
        icon={<Cpu size={14} className="text-primary" aria-hidden="true" />}
        defaultOpen={false}
      >
        <p className="text-[10px] text-muted-foreground mb-3">
          TPS per HSM is expressed in the industry-standard{' '}
          <span className="font-mono text-foreground">RSA-2048 ops/sec</span> base unit. Every other
          algorithm shows its <span className="font-mono text-foreground">cost ratio</span> against
          that anchor (the number of RSA-2048-equivalent ops one operation of that algorithm
          consumes). Tune each slider to match your vendor&apos;s benchmarked TPS.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {([classicalHsm, pqcHsm] as HsmProfile[]).map((profile) => {
            const baseRate = profile.opsPerSec[BASE_UNIT_ALGO]
            return (
              <div key={profile.id} className="space-y-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{profile.name}</p>
                  <p className="text-[10px] text-muted-foreground">{profile.description}</p>
                  <div className="mt-2 rounded-md border border-primary/30 bg-primary/5 px-2 py-1.5">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
                      Per-HSM throughput (base unit)
                    </p>
                    <p className="text-base font-mono text-primary mt-0.5">
                      {baseRate.toLocaleString()}{' '}
                      <span className="text-xs text-muted-foreground">RSA-2048 ops/s</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      All other algorithm rates shown below as cost ratio × this baseline.
                    </p>
                  </div>
                  <p className="text-[10px] text-muted-foreground italic mt-2">
                    {profile.sourceNote}
                  </p>
                </div>
                {ALGO_IDS.map((algo) => {
                  const range = ALGO_SLIDER_RANGES[algo]
                  const isBase = algo === BASE_UNIT_ALGO
                  const value = profile.opsPerSec[algo]
                  const ratio = isBase ? 1 : baseRate / Math.max(1, value)
                  const ratioLabel = isBase
                    ? '1× (base unit)'
                    : ratio >= 1
                      ? `${ratio < 10 ? ratio.toFixed(1) : Math.round(ratio)}× RSA-2048 cost`
                      : `${(1 / ratio).toFixed(1)}× faster than RSA-2048`
                  return (
                    <SliderRow
                      key={algo}
                      label={`${ALGO_LABELS[algo]} — ops/sec · ${ratioLabel}`}
                      value={value}
                      min={range.min}
                      max={range.max}
                      step={range.step}
                      format={(v) => v.toLocaleString()}
                      onChange={(v) => setHsmProfileAlgo(profile.id, algo, v)}
                    />
                  )
                })}
              </div>
            )
          })}
        </div>
      </CollapsibleSection>

      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
          <Download size={14} />
          Export CSV
        </Button>
      </div>
    </div>
  )
}
