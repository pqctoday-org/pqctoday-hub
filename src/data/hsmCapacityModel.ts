// SPDX-License-Identifier: AGPL-3.0-only
import {
  ALGO_IDS,
  SIGNATURE_ALGOS,
  PQC_SIG_ALGOS,
  type AlgoId,
  type HsmProfile,
  type UseCase,
  type MigrationHorizon,
  type CodeSigningAlg,
} from './hsmCapacityDefaults'

export const HSM_MODEL_VERSION = '2'
export const HSM_MODEL_ASSUMPTIONS =
  'Educational model with fictional performance profiles. Demand is per site; all sites receive equal traffic. ' +
  'Sum assumed device-time shares, divide by the utilization target, round up, then apply local N+1 or 2N. ' +
  'Independent operation rates do not validate concurrent hardware performance. Local redundancy does not model whole-site failure or traffic redistribution. ' +
  'Displayed utilisation averages demand across all allocated devices, not only active devices in a cold-standby design. ' +
  'TLS signing and key exchange are HSM-offloaded; one server signature and one classical exchange including ephemeral key generation, plus one server ML-KEM encapsulation for hybrid exchange. ' +
  'Certificate issuance and peer verification are separate workloads. No queueing, latency, session, partition or product-limit prediction. ' +
  'Payment and general-purpose fleets are independent. User-entered rates remain assumptions, not verified benchmarks.'

export type Redundancy = 'n+1' | '2n'
export type Fleet = 'general' | 'payment'
export type UseCaseState = Record<string, { enabled: boolean; tps: number }>
export interface ScenarioResult {
  key: string
  label: string
  shortLabel: string
  workload: 'classical' | 'pqc'
  hsmProfile: HsmProfile
  fleet: Fleet
  algoLoad: { algo: AlgoId; opsPerSec: number }[]
  perAlgoHsms: {
    algo: AlgoId
    hsms: number
    utilizationPct: number
    load: number
    capacity: number
  }[]
  bottleneck: AlgoId
  requiredRaw: number
  perLocationRaw: number
  perLocationRequired: number
  requiredWithRedundancy: number
  /** Minimum allocation across sites; siteAllocations contains actual counts. */
  hsmsPerLocation: number
  deployedHsms: number
  numLocations: number
  perLocationSufficient: boolean
  sufficient: boolean
  fleetUtilizationPct: number
  targetUtilizationPct: number
  siteAllocations: number[]
  siteResults: { deployed: number; sufficient: boolean; utilizationPct: number }[]
  supported: boolean
  unsupportedAlgorithms: AlgoId[]
  deviceTime: number
  perSiteTps: number
  aggregateTps: number
}

export function distributeInventory(total: number, sites: number): number[] {
  if (!Number.isSafeInteger(total) || total < 0 || !Number.isSafeInteger(sites) || sites < 1) {
    throw new RangeError('Inventory must be a nonnegative integer and sites a positive integer.')
  }
  return Array.from(
    { length: sites },
    (_, i) => Math.floor(total / sites) + (i < total % sites ? 1 : 0)
  )
}

export function resolvePqcOps(uc: UseCase, horizon: MigrationHorizon, alg: CodeSigningAlg) {
  const base = horizon === 'standards-today' ? uc.pqcTodayOps : uc.pqcOps
  if (uc.id === 'code-signing' && alg !== 'ml-dsa-65' && base['ml-dsa-65']) {
    const { 'ml-dsa-65': count, ...rest } = base
    return { ...rest, [alg]: count }
  }
  return base
}

export interface HsmScenarioInputs {
  useCases: UseCase[]
  state: UseCaseState
  classical: HsmProfile
  pqc: HsmProfile
  redundancy: Redundancy
  hsmsPerLocation: { today: number; tomorrow: number; upgraded: number }
  numLocations: number
  targetUtilizationPct?: number
  hybridSigningTransition?: boolean
  migrationHorizon?: MigrationHorizon
  codeSigningAlg?: CodeSigningAlg
  fleet?: Fleet
  /** Existing total inventory for profile A, spread without creating devices. */
  inventoryTotal?: number
}

export function computeScenarios(p: HsmScenarioInputs): ScenarioResult[] {
  const target = p.targetUtilizationPct ?? 70
  const fleet = p.fleet ?? 'general'
  if (
    !Number.isSafeInteger(p.numLocations) ||
    p.numLocations < 1 ||
    !Number.isFinite(target) ||
    target <= 0 ||
    target > 100 ||
    !['n+1', '2n'].includes(p.redundancy)
  )
    throw new RangeError('Invalid sizing settings.')
  const cases = p.useCases.filter((uc) =>
    fleet === 'payment' ? uc.id === 'payment' : uc.id !== 'payment'
  )
  for (const uc of cases) {
    const s = p.state[uc.id]
    if (s?.enabled && (!Number.isFinite(s.tps) || s.tps < 0))
      throw new RangeError('Invalid workload rate.')
  }
  const perSiteTps = cases.reduce(
    (sum, uc) => sum + (p.state[uc.id]?.enabled ? p.state[uc.id].tps : 0),
    0
  )
  if (!Number.isFinite(perSiteTps * p.numLocations))
    throw new RangeError('Workload exceeds numeric range.')
  const definitions = [
    {
      key: 'today' as const,
      workload: 'classical' as const,
      profile: p.classical,
      title: 'Classical · profile A',
    },
    {
      key: 'tomorrow' as const,
      workload: 'pqc' as const,
      profile: p.classical,
      title: 'PQC · profile A',
    },
    {
      key: 'upgraded' as const,
      workload: 'pqc' as const,
      profile: p.pqc,
      title: 'PQC · profile B',
    },
  ]
  return definitions.map(({ key, workload, profile, title }) => {
    const load = Object.fromEntries(ALGO_IDS.map((a) => [a, 0])) as Record<AlgoId, number>
    for (const uc of cases) {
      const state = p.state[uc.id]
      if (!state?.enabled) continue
      const ops =
        workload === 'classical'
          ? uc.classicalOps
          : resolvePqcOps(uc, p.migrationHorizon ?? 'end-state', p.codeSigningAlg ?? 'ml-dsa-65')
      for (const [algo, count] of Object.entries(ops)) {
        if (!ALGO_IDS.includes(algo as AlgoId) || !Number.isFinite(count) || count < 0) {
          throw new RangeError('Invalid operation recipe.')
        }
        load[algo as AlgoId] += state.tps * count
      }
      // Dual artifact signatures do not change the approved homogeneous TLS certificate example.
      if (
        workload === 'pqc' &&
        p.hybridSigningTransition &&
        uc.id !== 'tls' &&
        Object.keys(ops).some((a) => PQC_SIG_ALGOS.includes(a as AlgoId))
      ) {
        for (const algo of SIGNATURE_ALGOS) load[algo] += state.tps * (uc.classicalOps[algo] ?? 0)
      }
    }
    if (Object.values(load).some((v) => !Number.isFinite(v)))
      throw new RangeError('Operation load exceeds numeric range.')
    const unsupportedAlgorithms = ALGO_IDS.filter(
      (a) => load[a] > 0 && (!Number.isFinite(profile.opsPerSec[a]) || profile.opsPerSec[a] <= 0)
    )
    const supported = unsupportedAlgorithms.length === 0
    const shares = ALGO_IDS.map((a) =>
      load[a] === 0
        ? 0
        : profile.opsPerSec[a] > 0 && Number.isFinite(profile.opsPerSec[a])
          ? load[a] / profile.opsPerSec[a]
          : Infinity
    )
    const deviceTime = shares.reduce((sum, value) => sum + value, 0)
    const perLocationRaw = supported ? Math.ceil(deviceTime / (target / 100)) : Infinity
    const perLocationRequired =
      perLocationRaw === 0 ? 0 : p.redundancy === 'n+1' ? perLocationRaw + 1 : perLocationRaw * 2
    if (supported && !Number.isSafeInteger(perLocationRequired * p.numLocations)) {
      throw new RangeError('Required inventory exceeds numeric range.')
    }
    const count = p.hsmsPerLocation[key]
    if (!Number.isSafeInteger(count) || count < 0)
      throw new RangeError('Invalid per-site inventory.')
    const siteAllocations =
      p.inventoryTotal !== undefined && key !== 'upgraded'
        ? distributeInventory(p.inventoryTotal, p.numLocations)
        : Array.from({ length: p.numLocations }, () => count)
    const deployedHsms = siteAllocations.reduce((a, b) => a + b, 0)
    if (!Number.isSafeInteger(deployedHsms))
      throw new RangeError('Inventory exceeds numeric range.')
    const siteResults = siteAllocations.map((deployed) => ({
      deployed,
      sufficient: supported && deployed >= perLocationRequired,
      utilizationPct:
        deviceTime === 0 ? 0 : deployed > 0 ? (deviceTime / deployed) * 100 : Infinity,
    }))
    const sufficient = siteResults.every((s) => s.sufficient)
    const hsmsPerLocation = Math.min(...siteAllocations)
    return {
      key,
      label:
        fleet === 'payment'
          ? `${workload === 'classical' ? 'Classical' : 'PQC'} · payment profile`
          : title,
      shortLabel: title,
      workload,
      fleet,
      hsmProfile: profile,
      algoLoad: ALGO_IDS.map((algo) => ({ algo, opsPerSec: load[algo] })),
      perAlgoHsms: ALGO_IDS.map((algo, i) => ({
        algo,
        hsms: Math.ceil(shares[i]),
        load: load[algo],
        capacity: profile.opsPerSec[algo],
        utilizationPct:
          load[algo] === 0
            ? 0
            : hsmsPerLocation > 0
              ? (shares[i] / hsmsPerLocation) * 100
              : Infinity,
      })),
      bottleneck: ALGO_IDS[shares.indexOf(Math.max(...shares))],
      requiredRaw: perLocationRaw,
      perLocationRaw,
      perLocationRequired,
      requiredWithRedundancy: perLocationRequired * p.numLocations,
      hsmsPerLocation,
      deployedHsms,
      numLocations: p.numLocations,
      perLocationSufficient: sufficient,
      sufficient,
      fleetUtilizationPct:
        deviceTime === 0
          ? 0
          : deployedHsms > 0
            ? ((deviceTime * p.numLocations) / deployedHsms) * 100
            : Infinity,
      targetUtilizationPct: target,
      siteAllocations,
      siteResults,
      supported,
      unsupportedAlgorithms,
      deviceTime,
      perSiteTps,
      aggregateTps: perSiteTps * p.numLocations,
    }
  })
}
