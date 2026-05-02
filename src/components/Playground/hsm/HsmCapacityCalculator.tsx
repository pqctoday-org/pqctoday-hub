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
import { CollapsibleSection } from '@/components/ui/CollapsibleSection'
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
 * Math model:
 *   load(a)        = Σ over enabled use-cases uc of: tps[uc] × uc.<workload>Ops[a]
 *   hsms(a)        = ceil( load(a) / hsmProfile.opsPerSec[a] )
 *   requiredRaw    = max over a of hsms(a)                       // bottleneck algorithm
 *   perLocationRaw = ceil( requiredRaw / numLocations )
 *   perLocationRequired   = applyRedundancy(perLocationRaw, mode)  // n+1: +1 ; 2n: ×2
 *   requiredWithRedundancy = numLocations × perLocationRequired
 *
 * The three scenarios pair (workload, hsmProfile) as:
 *   today    — classical workload on classical HSM
 *   tomorrow — PQC workload on the *same* classical HSM (ML-DSA in software → 150 ops/s)
 *   upgraded — PQC workload on next-gen PQC HSM (ML-DSA in hardware → 8000 ops/s)
 *
 * "Extra PQC capacity" is the delta in requiredRaw between scenarios:
 *   ΔHSM_existing_fleet = requiredRaw(tomorrow) − requiredRaw(today)
 *   ΔHSM_with_upgrade   = requiredRaw(upgraded) − requiredRaw(today)
 *
 * The PQC delta has two independent sources per use case:
 *   (1) op-count change — only TLS adds an op (hybrid X25519MLKEM768 retains ECDH and adds ML-KEM)
 *   (2) per-algorithm throughput change — dominated by ML-DSA-65 (150 ops/s on classical HSM)
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
    const hsms = opsPerSec > 0 ? Math.ceil(opsPerSec / capacity) : 0
    // Utilization is per-location: each location handles 1/numLocations of load
    const perLocLoad = opsPerSec / numLocations
    const perLocCapacity = capacity * hsmsPerLocation
    const utilizationPct = hsmsPerLocation > 0 ? (perLocLoad / perLocCapacity) * 100 : 0
    return { algo, hsms, utilizationPct, load: opsPerSec, capacity }
  })
  const requiredRaw = perAlgoHsms.reduce((m, r) => Math.max(m, r.hsms), 0)
  const bottleneck = perAlgoHsms.reduce<{ algo: AlgoId; hsms: number }>(
    (m, r) => (r.hsms > m.hsms ? { algo: r.algo, hsms: r.hsms } : m),
    { algo: 'rsa-2048', hsms: 0 }
  ).algo
  const perLocationRaw = requiredRaw > 0 ? Math.ceil(requiredRaw / numLocations) : 0
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
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => {
            const v = Number(e.target.value)
            if (!isNaN(v)) onChange(Math.min(max, Math.max(min, v)))
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
  const sufficient = scenario.perLocationSufficient
  const Icon = sufficient ? CheckCircle2 : AlertTriangle
  const statusClass = sufficient ? 'text-status-success' : 'text-status-error'
  const statusBg = sufficient
    ? 'bg-status-success/10 border-status-success/40'
    : 'bg-status-error/10 border-status-error/40'

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
          <span className={clsx('text-xs font-medium', statusClass)}>
            {sufficient ? 'Sufficient' : 'Overloaded'}
          </span>
        </div>
      </div>

      {/* Three-column breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
        <div className="rounded-md bg-muted/30 px-2 py-1.5">
          <p className="text-muted-foreground">Per location</p>
          <p className="font-mono text-foreground text-base">
            {scenario.perLocationRequired}{' '}
            <span className="text-xs text-muted-foreground">HSMs</span>
          </p>
          <p className="text-[10px] text-muted-foreground">{scenario.perLocationRaw} raw + HA</p>
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

function HsmFleetVisual({ scenario }: { scenario: ScenarioResult }) {
  const { numLocations, hsmsPerLocation, perLocationSufficient } = scenario
  const statusClass = perLocationSufficient ? 'text-status-success' : 'text-status-error'
  const MAX_ICONS_PER_LOC = Math.min(hsmsPerLocation, 12)
  const MAX_LOCS = Math.min(numLocations, 8)
  const hiddenLocs = numLocations - MAX_LOCS

  return (
    <div className="space-y-1">
      {Array.from({ length: MAX_LOCS }).map((_, locIdx) => (
        <div key={locIdx} className="flex items-center gap-1.5">
          <span className="text-[9px] font-mono text-muted-foreground w-9 shrink-0">
            Loc {locIdx + 1}
          </span>
          <div className="flex flex-wrap gap-0.5">
            {Array.from({ length: MAX_ICONS_PER_LOC }).map((_, i) => (
              <Server
                key={i}
                size={13}
                className={clsx(statusClass, 'shrink-0')}
                aria-hidden="true"
              />
            ))}
            {hsmsPerLocation > 12 && (
              <span className="text-[9px] font-mono text-muted-foreground">
                +{hsmsPerLocation - 12}
              </span>
            )}
          </div>
        </div>
      ))}
      {hiddenLocs > 0 && (
        <p className="text-[10px] font-mono text-muted-foreground ml-11">
          +{hiddenLocs} more location{hiddenLocs > 1 ? 's' : ''}
        </p>
      )}
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
    Required: s.requiredWithRedundancy,
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
      <div className="rounded-lg border border-status-warning/40 bg-status-warning/5 px-4 py-3">
        <p className="text-xs text-status-warning leading-relaxed">
          Educational model — HSM performance numbers are illustrative reference values from public
          vendor datasheets (Thales Luna 7, Entrust nShield 5c, Utimaco SecurityServer). No vendor
          currently publishes production ML-DSA hardware-accelerated TPS; that value is an
          extrapolation. Adjust every parameter to match your measured environment.
        </p>
      </div>

      {/* Fleet sizing model — collapsible */}
      <CollapsibleSection
        title="Fleet sizing model"
        icon={<Info size={14} className="text-primary" aria-hidden="true" />}
        defaultOpen={false}
      >
        <p className="text-xs text-foreground leading-relaxed">
          <span className="font-semibold text-primary">Shared-fleet sizing model.</span> A single
          HSM fleet serves all enabled use cases. Load is aggregated per algorithm across every
          checked use case, then divided by the HSM&apos;s per-algorithm capacity. The bottleneck
          algorithm (highest load / capacity ratio) determines the minimum global fleet size; that
          global count is then split across locations and redundancy is applied{' '}
          <span className="font-semibold">per location</span>.
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed mt-2">
          <span className="font-mono text-secondary">Raw required (R)</span> = max over all
          algorithms of ⌈ algo_ops/s ÷ hsm_capacity ⌉
          <br />
          <span className="font-mono text-secondary">Per-location raw</span> = ⌈ R ÷ L ⌉ &nbsp; (L =
          locations; load split evenly)
          <br />
          <span className="font-mono text-secondary">N+1 per location</span> = per-location raw + 1
          <br />
          <span className="font-mono text-secondary">2N per location</span> = per-location raw × 2
          <br />
          <span className="font-mono text-secondary">Total fleet</span> = L × per-location HA need
          <br />
          <span className="font-mono text-secondary">Utilization (per location)</span> = (load ÷ L)
          ÷ (capacity × deployed/location)
        </p>
        <p className="text-[10px] text-muted-foreground/80 leading-relaxed mt-2">
          <span className="font-semibold text-foreground">Assumptions:</span> traffic is split
          equally across locations (no regional weighting); any HSM in the fleet can run any
          algorithm; redundancy is site-local (each site survives one HSM loss for N+1, full
          duplication for 2N) — strictly more conservative than a global N+1.
          <br />
          <span className="text-muted-foreground/60">
            Verified by <span className="font-mono">HsmCapacityCalculator.test.ts</span> — size ×
            locations matrix (small/medium/large × 2/3/20).
          </span>
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
                Each location independently satisfies the selected redundancy model (local HA). Load
                is assumed evenly distributed across locations.
              </p>
              <NumericSliderRow
                label="Number of locations"
                value={numLocations}
                min={1}
                max={1_000}
                step={1}
                format={(v) => `${v} location${v !== 1 ? 's' : ''}`}
                tooltip="Physical sites, data centres, or availability zones. Each must independently satisfy the HA model."
                onChange={setNumLocations}
              />
              <CollapsibleSection
                title="Distributed capacity formula"
                icon={<Info size={12} className="text-muted-foreground" aria-hidden="true" />}
                defaultOpen={false}
              >
                <div className="text-[10px] space-y-2 font-mono text-muted-foreground">
                  <p>
                    <span className="text-secondary">Per-location raw</span> = ⌈ R ÷ L ⌉ &nbsp;
                    (load split evenly)
                  </p>
                  <p>
                    <span className="text-secondary">Per-location HA need</span> = redundancy
                    applied to per-location raw
                    <br />
                    &nbsp;&nbsp;N+1 → per-location raw + 1 &nbsp;·&nbsp; 2N → per-location raw × 2
                  </p>
                  <p>
                    <span className="text-secondary">Total fleet required</span> = L × per-location
                    HA need
                  </p>
                  <p className="text-muted-foreground/70">
                    R = total raw HSMs (bottleneck algorithm) · L = number of locations
                  </p>
                  <div className="mt-2 pt-2 border-t border-border/30 space-y-0.5">
                    <p className="text-foreground font-semibold">Example A — N+1, R=37, L=3:</p>
                    <p>Per-location raw = ⌈37 ÷ 3⌉ = 13</p>
                    <p>Per-location HA = 13 + 1 = 14 HSMs</p>
                    <p>Total required = 3 × 14 = 42 HSMs</p>
                  </div>
                  <div className="mt-2 pt-2 border-t border-border/30 space-y-0.5">
                    <p className="text-foreground font-semibold">Example B — 2N, R=37, L=3:</p>
                    <p>Per-location raw = 13</p>
                    <p>Per-location HA = 13 × 2 = 26 HSMs</p>
                    <p>Total required = 3 × 26 = 78 HSMs</p>
                  </div>
                  <p className="text-muted-foreground/70 mt-2">
                    Note: redundancy is <span className="text-foreground">per location</span>, so a
                    fleet at L locations with N+1 carries L spare HSMs total — strictly more than a
                    single global N+1 spare. With small R and large L, the &quot;⌈R/L⌉ ≥ 1&quot;
                    rounding floor pins per-location to ≥1; with N+1 the total then collapses to L ×
                    2 regardless of R.
                  </p>
                  <p className="text-muted-foreground/60 mt-2 not-italic">
                    Verified by HsmCapacityCalculator.test.ts (size × locations matrix).
                  </p>
                </div>
              </CollapsibleSection>
            </div>
          </>
        )}
      </div>

      {/* Organisation profile — sliders that derive TPS */}
      <CollapsibleSection
        title="Organisation profile"
        icon={<Users size={14} className="text-primary" aria-hidden="true" />}
        defaultOpen={true}
      >
        <p className="text-[10px] text-muted-foreground mb-3">
          Adjusting these sliders re-derives TPS defaults for all use cases using the same formulas
          documented in each use case&apos;s estimation methodology.
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
                        <label className="flex items-start gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={s.enabled}
                            onChange={(e) => setUseCaseEnabled(uc.id, e.target.checked)}
                            className="mt-0.5 accent-primary"
                            aria-label={`Enable ${uc.name}`}
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">{uc.name}</p>
                            <p className="text-[10px] text-muted-foreground">{uc.description}</p>
                            <p className="text-[10px] font-mono text-secondary mt-1">
                              Post-PQC ops: {pqcAlgos.map((a) => ALGO_LABELS[a]).join(' + ')}
                            </p>
                          </div>
                        </label>
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

      {/* HSM fleet visual — grouped by location */}
      <div className="glass-panel p-4">
        <div className="flex items-center gap-2 mb-3">
          <Server size={14} className="text-primary" aria-hidden="true" />
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            Fleet at a glance
          </p>
        </div>
        <div className="space-y-4">
          {scenarios.map((s) => (
            <div key={s.key}>
              <div className="flex items-start gap-3">
                <div className="w-40 shrink-0 text-xs">
                  <p className="font-medium text-foreground">{s.shortLabel}</p>
                  <p className="text-[10px] text-muted-foreground">{s.hsmProfile.name}</p>
                  <p className="text-[10px] font-mono text-primary mt-0.5">
                    {s.deployedHsms} total HSMs
                  </p>
                </div>
                <HsmFleetVisual scenario={s} />
              </div>
            </div>
          ))}
        </div>
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
              <Bar dataKey="Required" fill="var(--color-primary)" radius={[3, 3, 0, 0]}>
                {fleetChartData.map((_, i) => (
                  <Cell key={i} fill="var(--color-primary)" />
                ))}
              </Bar>
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
          All values start at public-datasheet reference numbers. Tune each slider to match your
          vendor&apos;s benchmarked TPS.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {([classicalHsm, pqcHsm] as HsmProfile[]).map((profile) => (
            <div key={profile.id} className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{profile.name}</p>
                <p className="text-[10px] text-muted-foreground">{profile.description}</p>
                <p className="text-[10px] text-muted-foreground italic mt-1">
                  {profile.sourceNote}
                </p>
              </div>
              {ALGO_IDS.map((algo) => {
                const range = ALGO_SLIDER_RANGES[algo]
                return (
                  <SliderRow
                    key={algo}
                    label={`${ALGO_LABELS[algo]} — ops/sec`}
                    value={profile.opsPerSec[algo]}
                    min={range.min}
                    max={range.max}
                    step={range.step}
                    format={(v) => v.toLocaleString()}
                    onChange={(v) => setHsmProfileAlgo(profile.id, algo, v)}
                  />
                )
              })}
            </div>
          ))}
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
