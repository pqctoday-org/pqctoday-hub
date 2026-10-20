// SPDX-License-Identifier: AGPL-3.0-only
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { CapacityChoice } from './CapacityChoice'
import { SaveToOperationsPack } from '@/components/BusinessCenter/operationsPack/SaveToOperationsPack'
import { hsmCapacityPlanMarkdown, type HsmCapacityPlanInputs } from '@/services/opsArtifacts'
import { generateCsv, downloadCsv, csvFilename } from '@/utils/csvExport'
import {
  USE_CASES,
  CLASSICAL_HSM_DEFAULT,
  PQC_HSM_DEFAULT,
  PAYMENT_HSM_DEFAULT,
  ALGO_IDS,
  ALGO_LABELS,
  ORG_PARAM_DEFAULTS,
  deriveUseCaseTps,
  type HsmProfile,
  type AlgoId,
  type DeploymentSize,
} from '@/data/hsmCapacityDefaults'
import {
  computeScenarios,
  HSM_MODEL_VERSION,
  HSM_MODEL_ASSUMPTIONS,
  type ScenarioResult,
  type Redundancy,
  type UseCaseState,
} from '@/data/hsmCapacityModel'
import { HsmStorageExplorer } from './HsmStorageExplorer'
export { computeScenarios } from '@/data/hsmCapacityModel'

const format = (n: number) =>
  Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: 2 }) : 'Unavailable'

function NumberControl({
  label,
  value,
  onChange,
  min = 0,
  max = 1_000_000,
  integer = false,
}: {
  label: string
  value: number
  onChange: (n: number) => void
  min?: number
  max?: number
  integer?: boolean
}) {
  return (
    <label className="block text-sm space-y-1">
      <span className="block">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={integer ? 1 : 'any'}
        onChange={(e) => {
          if (e.target.value === '') return
          const n = Number(e.target.value)
          if (Number.isFinite(n) && n >= min && n <= max && (!integer || Number.isInteger(n)))
            onChange(n)
        }}
        className="w-full rounded border border-border bg-background p-2"
      />
    </label>
  )
}

export function PqcReadinessVerdict({
  scenarios,
  numLocations,
}: {
  scenarios: ScenarioResult[]
  numLocations: number
}) {
  return (
    <div className="glass-panel p-4 space-y-2">
      <h3 className="font-semibold">Educational scenario comparison</h3>
      <p className="text-sm text-muted-foreground">
        Results depend on the selected fictional rates and recipes across {numLocations} sites. They
        do not establish production readiness or a hardware replacement ratio.
      </p>
      {scenarios.map((s) => (
        <p key={s.key} className="text-sm">
          {s.label}:{' '}
          {s.supported
            ? `${format(s.requiredWithRedundancy)} modelled devices required; ${format(s.deployedHsms)} allocated. ${s.sufficient ? 'All sites meet the selected model.' : 'At least one site falls short of the selected model.'}`
            : `Unsupported operation: ${s.unsupportedAlgorithms.map((a) => ALGO_LABELS[a]).join(', ')}. No capacity result.`}
        </p>
      ))}
    </div>
  )
}

export function TpsToHsmExplainer({
  scenarios,
  redundancy,
  numLocations,
}: {
  scenarios: ScenarioResult[]
  redundancy: Redundancy
  numLocations: number
}) {
  const supported = scenarios.filter((s) => s.supported)
  const example = supported.reduce<ScenarioResult | undefined>(
    (a, b) => (!a || b.requiredRaw > a.requiredRaw ? b : a),
    undefined
  )
  const r = example?.perLocationRaw ?? 0
  const nPlus1 = r > 0 ? r + 1 : 0
  const selectedLocal = redundancy === 'n+1' ? nPlus1 : r * 2
  return (
    <details className="glass-panel p-4" open>
      <summary className="font-semibold cursor-pointer">How TPS becomes HSM count</summary>
      <ol className="list-decimal pl-5 space-y-2 mt-3 text-sm">
        <li>Multiply per-site transactions by each recipe's operation counts.</li>
        <li>
          Sum operation demand ÷ assumed rate across algorithms. This assumes shared device time.
        </li>
        <li>Divide that sum by the target utilisation, then round up.</li>
        <li>
          Apply local redundancy: N+1 adds one device to a nonzero requirement; 2N doubles it. The
          selected setting is {redundancy === 'n+1' ? 'N+1' : '2N'}.
        </li>
        <li>
          Assess each site's actual allocation. Aggregate demand is per-site traffic × sites. Equal
          traffic and local spares do not establish whole-site failover capacity.
        </li>
      </ol>
      {example && (
        <div className="mt-3 text-sm space-y-1">
          <p>
            {example.label}: assumed device time {format(example.deviceTime)} ÷{' '}
            {example.targetUtilizationPct / 100}, rounded up gives <span>R = {r}</span>.
          </p>
          <p>
            N+1: {nPlus1} per site; 2N: {r * 2} per site.
          </p>
          <p>
            Total fleet = {numLocations} × {selectedLocal} = {numLocations * selectedLocal} HSMs
          </p>
          <p className="text-muted-foreground">
            The total above uses the selected local redundancy. Headroom is separate from spare
            devices; no spare is required for zero demand.
          </p>
        </div>
      )}
    </details>
  )
}

function ScenarioTable({ scenarios }: { scenarios: ScenarioResult[] }) {
  return (
    <div className="overflow-x-auto glass-panel p-4">
      <table className="w-full text-sm">
        <caption className="text-left font-semibold pb-3">
          Per-site requirements and actual allocations
        </caption>
        <thead>
          <tr>
            {[
              'Scenario',
              'Site',
              'Required incl. headroom',
              'Required incl. redundancy',
              'Allocated',
              'Model result',
              'Assumed utilisation',
            ].map((h) => (
              <th key={h} scope="col" className="text-left p-2">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {scenarios.flatMap((s) =>
            s.siteResults.map((site, i) => (
              <tr key={`${s.key}-${i}`} className="border-t border-border">
                <th scope="row" className="text-left p-2">
                  {s.label}
                </th>
                <td className="p-2">{i + 1}</td>
                <td className="p-2">{format(s.perLocationRaw)}</td>
                <td className="p-2">{format(s.perLocationRequired)}</td>
                <td className="p-2">{site.deployed}</td>
                <td className="p-2">
                  {!s.supported
                    ? 'Unsupported'
                    : site.sufficient
                      ? 'Meets assumptions'
                      : 'Shortfall'}
                </td>
                <td className="p-2">
                  {format(site.utilizationPct)}
                  {Number.isFinite(site.utilizationPct) ? '%' : ''}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

function ProfileControls({
  profile,
  onChange,
  algos = ALGO_IDS,
}: {
  profile: HsmProfile
  onChange: (a: AlgoId, n: number) => void
  algos?: AlgoId[]
}) {
  return (
    <div className="space-y-3">
      <h4 className="font-semibold">{profile.name}</h4>
      <p className="text-xs text-muted-foreground">{profile.sourceNote}</p>
      {algos.map((a) => (
        <NumberControl
          key={a}
          label={`${profile.name}: ${ALGO_LABELS[a]} operations/s`}
          value={profile.opsPerSec[a]}
          onChange={(n) => onChange(a, n)}
        />
      ))}
      <p className="text-xs text-muted-foreground">
        Zero means unsupported. Edited values are user assumptions.
      </p>
    </div>
  )
}

export function HsmCapacityCalculator() {
  const [state, setState] = useState<UseCaseState>(() =>
    Object.fromEntries(
      USE_CASES.map((u) => [
        u.id,
        { enabled: u.defaultEnabled, tps: deriveUseCaseTps(u.id, ORG_PARAM_DEFAULTS.medium) },
      ])
    )
  )
  const [size, setSize] = useState<DeploymentSize>('medium')
  const [sites, setSites] = useState(1)
  const [target, setTarget] = useState(70)
  const [redundancy, setRedundancy] = useState<Redundancy>('n+1')
  const [inventory, setInventory] = useState(10)
  const [profileBPerSite, setProfileBPerSite] = useState(2)
  const [paymentInventory, setPaymentInventory] = useState(2)
  const [a, setA] = useState(CLASSICAL_HSM_DEFAULT)
  const [b, setB] = useState(PQC_HSM_DEFAULT)
  const [payment, setPayment] = useState(PAYMENT_HSM_DEFAULT)
  const [codeSigningAlg, setCodeSigningAlg] = useState<'ml-dsa-65' | 'slh-dsa-128s'>('ml-dsa-65')
  const scenarios = useMemo(
    () =>
      computeScenarios({
        useCases: USE_CASES,
        state,
        classical: a,
        pqc: b,
        redundancy,
        numLocations: sites,
        hsmsPerLocation: { today: 0, tomorrow: 0, upgraded: profileBPerSite },
        targetUtilizationPct: target,
        inventoryTotal: inventory,
        codeSigningAlg,
      }),
    [state, a, b, redundancy, sites, profileBPerSite, target, inventory, codeSigningAlg]
  )
  const paymentScenarios = useMemo(
    () =>
      computeScenarios({
        useCases: USE_CASES,
        state,
        classical: payment,
        pqc: payment,
        redundancy,
        numLocations: sites,
        hsmsPerLocation: { today: 0, tomorrow: 0, upgraded: 0 },
        targetUtilizationPct: target,
        inventoryTotal: paymentInventory,
        fleet: 'payment',
      }).slice(0, 2),
    [state, payment, redundancy, sites, target, paymentInventory]
  )
  const allScenarios = [...scenarios, ...paymentScenarios]
  const update = (id: string, values: Partial<UseCaseState[string]>) =>
    setState((prev) => ({ ...prev, [id]: { ...prev[id], ...values } }))
  const snapshot = (profile: HsmProfile, defaults: HsmProfile) => ({
    name: profile.name,
    sourceNote: profile.sourceNote,
    rates: ALGO_IDS.map((algo) => ({
      algorithm: ALGO_LABELS[algo],
      opsPerSec: profile.opsPerSec[algo],
      userEntered: profile.opsPerSec[algo] !== defaults.opsPerSec[algo],
    })),
  })
  const plan: HsmCapacityPlanInputs = {
    modelVersion: HSM_MODEL_VERSION,
    deploymentSize: size,
    redundancy: redundancy === 'n+1' ? 'N+1' : '2N',
    locations: sites,
    targetUtilizationPct: target,
    migrationHorizon: 'hypothetical end-state',
    hybridSigningTransition: false,
    codeSigningAlgorithm: codeSigningAlg,
    useCases: USE_CASES.map((u) => ({
      label: u.name,
      scope: u.description,
      enabled: state[u.id].enabled,
      tps: state[u.id].tps,
      fleet: u.id === 'payment' ? 'payment' : 'general',
      classicalRecipe: u.classicalOps,
      pqcRecipe: u.id === 'code-signing' ? { [codeSigningAlg]: 1 } : u.pqcOps,
    })),
    profiles: [
      snapshot(a, CLASSICAL_HSM_DEFAULT),
      snapshot(b, PQC_HSM_DEFAULT),
      snapshot(payment, PAYMENT_HSM_DEFAULT),
    ],
    scenarios: allScenarios.map((s) => ({
      label: s.label,
      fleet: s.fleet,
      hsmProfile: s.hsmProfile.name,
      bottleneck: ALGO_LABELS[s.bottleneck],
      hsmsRequired: s.supported ? s.requiredWithRedundancy : null,
      hsmsDeployed: s.deployedHsms,
      sufficient: s.sufficient,
      fleetUtilizationPct: Number.isFinite(s.fleetUtilizationPct) ? s.fleetUtilizationPct : null,
      siteAllocations: s.siteAllocations,
      supported: s.supported,
      unsupportedAlgorithms: s.unsupportedAlgorithms.map((algo) => ALGO_LABELS[algo]),
      requiredPerSite: s.supported ? s.perLocationRequired : null,
    })),
    caveats: [HSM_MODEL_ASSUMPTIONS],
  }
  const exportCsv = () => {
    const rows = allScenarios.flatMap((s) =>
      s.siteResults.map((site, index) => ({
        s,
        site,
        index,
      }))
    )
    downloadCsv(
      generateCsv(rows, [
        { header: 'Model version', accessor: () => HSM_MODEL_VERSION },
        {
          header: 'Evidence',
          accessor: () => 'Fictional profiles / user assumptions; educational only',
        },
        { header: 'Assumptions', accessor: () => HSM_MODEL_ASSUMPTIONS },
        { header: 'Workload recipes and inputs', accessor: () => JSON.stringify(plan.useCases) },
        { header: 'Rate profiles', accessor: () => JSON.stringify(plan.profiles) },
        { header: 'Target utilization (%)', accessor: () => target },
        { header: 'Local redundancy', accessor: () => redundancy },
        { header: 'Number of equally loaded sites', accessor: () => sites },
        { header: 'Fleet', accessor: (r) => r.s.fleet },
        { header: 'Scenario', accessor: (r) => r.s.label },
        { header: 'Site', accessor: (r) => r.index + 1 },
        { header: 'Transactions/s per site', accessor: (r) => r.s.perSiteTps },
        { header: 'Transactions/s aggregate', accessor: (r) => r.s.aggregateTps },
        { header: 'Operation demand/s per site', accessor: (r) => JSON.stringify(r.s.algoLoad) },
        {
          header: 'Assumed nominal device-time share',
          accessor: (r) => (r.s.supported ? r.s.deviceTime : 'Unsupported'),
        },
        {
          header: 'Required per site before local spares',
          accessor: (r) => (r.s.supported ? r.s.perLocationRaw : 'Unsupported'),
        },
        {
          header: 'Assumed site utilisation (%)',
          accessor: (r) =>
            Number.isFinite(r.site.utilizationPct) ? r.site.utilizationPct : 'Unavailable',
        },
        {
          header: 'Unsupported operations',
          accessor: (r) => r.s.unsupportedAlgorithms.map((a) => ALGO_LABELS[a]).join('; '),
        },
        {
          header: 'Required per site',
          accessor: (r) => (r.s.supported ? r.s.perLocationRequired : 'Unsupported'),
        },
        { header: 'Allocated at site', accessor: (r) => r.site.deployed },
        { header: 'Total allocated', accessor: (r) => r.s.deployedHsms },
        {
          header: 'Status',
          accessor: (r) =>
            !r.s.supported
              ? 'Unsupported'
              : r.site.sufficient
                ? 'Meets model assumptions'
                : 'Shortfall',
        },
      ]),
      csvFilename('hsm-educational-estimate')
    )
  }
  return (
    <div className="space-y-6">
      <div className="glass-panel p-4 space-y-2">
        <h2 className="text-lg font-semibold">HSM workload and capacity explorer</h2>
        <p className="text-sm text-muted-foreground">{HSM_MODEL_ASSUMPTIONS}</p>
        <p className="text-sm">
          PQC TLS example: entirely PQC certificate chain, hybrid classical + ML-KEM exchange. This
          is a hypothetical scenario, not a product deployment recommendation.
        </p>
      </div>
      <div className="glass-panel p-4 grid gap-4 md:grid-cols-3">
        <NumberControl
          label="Number of sites"
          value={sites}
          onChange={setSites}
          min={1}
          max={32}
          integer
        />
        <NumberControl
          label="Target utilisation (%)"
          value={target}
          onChange={setTarget}
          min={1}
          max={100}
        />
        <CapacityChoice
          label="Local redundancy per site"
          selectedId={redundancy}
          items={[
            { id: 'n+1', label: 'N+1' },
            { id: '2n', label: '2N' },
          ]}
          onSelect={(id) => setRedundancy(id as Redundancy)}
          hideDefaultOption
        />
        <NumberControl
          label="General-purpose profile A inventory (total)"
          value={inventory}
          onChange={setInventory}
          max={100000}
          integer
        />
        <NumberControl
          label="General-purpose profile B allocation (per site)"
          value={profileBPerSite}
          onChange={setProfileBPerSite}
          max={100000}
          integer
        />
        <CapacityChoice
          label="Fictional workload preset"
          selectedId={size}
          items={[
            { id: 'small', label: 'Small example' },
            { id: 'medium', label: 'Medium example' },
            { id: 'large', label: 'Large example' },
          ]}
          hideDefaultOption
          onSelect={(id) => {
            const next = id as DeploymentSize
            setSize(next)
            setState((prev) =>
              Object.fromEntries(
                USE_CASES.map((u) => [
                  u.id,
                  {
                    ...prev[u.id],
                    tps: deriveUseCaseTps(u.id, ORG_PARAM_DEFAULTS[next]),
                  },
                ])
              )
            )
          }}
        />
        <p className="text-sm md:col-span-3">
          Utilisation target leaves {format(100 - target)}% nominal headroom before local spares.
          The 70% default is a teaching choice, not a universal threshold. Changing the preset
          replaces all per-site transaction rates, including payments.
        </p>
      </div>
      <section className="space-y-3">
        <h3 className="font-semibold">General-purpose workloads</h3>
        <p className="text-sm">
          {format(scenarios[0].perSiteTps)} transactions/s per site;{' '}
          {format(scenarios[0].aggregateTps)} transactions/s across {sites} equally loaded sites.
          Transactions can require several cryptographic operations.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          {USE_CASES.filter((u) => u.id !== 'payment').map((u) => (
            <div key={u.id} className="glass-panel p-4 space-y-2">
              <label className="font-medium text-sm">
                <input
                  type="checkbox"
                  checked={state[u.id].enabled}
                  onChange={(e) => update(u.id, { enabled: e.target.checked })}
                />{' '}
                {u.name}
              </label>
              <p className="text-xs text-muted-foreground">{u.description}</p>
              <NumberControl
                label={`${u.name}: transactions/s per site`}
                value={state[u.id].tps}
                onChange={(tps) => update(u.id, { tps })}
              />
              <details className="text-xs">
                <summary className="cursor-pointer">Operation recipe assumptions</summary>
                <p className="mt-2">
                  {u.id === 'code-signing'
                    ? `Classical: one RSA-2048 signature per artifact. PQC: one ${ALGO_LABELS[codeSigningAlg]} signature per artifact. Multiply by the selected per-site signing rate.`
                    : u.estimation.math}
                </p>
                <p className="mt-1">{u.estimation.rationale}</p>
              </details>
              {u.id === 'code-signing' && (
                <CapacityChoice
                  label="PQC artifact signature"
                  selectedId={codeSigningAlg}
                  items={[
                    { id: 'ml-dsa-65', label: 'ML-DSA-65' },
                    { id: 'slh-dsa-128s', label: 'SLH-DSA-128s' },
                  ]}
                  onSelect={(id) => setCodeSigningAlg(id as typeof codeSigningAlg)}
                  hideDefaultOption
                />
              )}
            </div>
          ))}
        </div>
      </section>
      <PqcReadinessVerdict scenarios={scenarios} numLocations={sites} />
      <ScenarioTable scenarios={scenarios} />
      <TpsToHsmExplainer scenarios={scenarios} redundancy={redundancy} numLocations={sites} />
      <details className="glass-panel p-4">
        <summary className="font-semibold cursor-pointer">
          Fictional general-purpose performance profiles
        </summary>
        <div className="grid gap-6 md:grid-cols-2 mt-4">
          <ProfileControls
            profile={a}
            onChange={(algo, rate) =>
              setA((p) => ({ ...p, opsPerSec: { ...p.opsPerSec, [algo]: rate } }))
            }
          />
          <ProfileControls
            profile={b}
            onChange={(algo, rate) =>
              setB((p) => ({ ...p, opsPerSec: { ...p.opsPerSec, [algo]: rate } }))
            }
          />
        </div>
      </details>
      <section className="glass-panel p-4 space-y-4">
        <h3 className="font-semibold">Separate payment-HSM fleet</h3>
        <p className="text-sm text-muted-foreground">
          {USE_CASES.find((u) => u.id === 'payment')!.description} Spare general-purpose devices
          cannot satisfy payment demand.
        </p>
        <label className="text-sm">
          <input
            type="checkbox"
            checked={state.payment.enabled}
            onChange={(e) => update('payment', { enabled: e.target.checked })}
          />{' '}
          Include payment workload
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <NumberControl
            label="Payment transactions/s per site"
            value={state.payment.tps}
            onChange={(tps) => update('payment', { tps })}
          />
          <NumberControl
            label="Payment HSM inventory (total)"
            value={paymentInventory}
            onChange={setPaymentInventory}
            max={100000}
            integer
          />
        </div>
        <p className="text-sm">
          {format(paymentScenarios[0].perSiteTps)} payment transactions/s per site;{' '}
          {format(paymentScenarios[0].aggregateTps)} across all sites.
        </p>
        <p className="text-xs text-muted-foreground">
          {USE_CASES.find((u) => u.id === 'payment')!.estimation.math}
        </p>
        <ScenarioTable scenarios={paymentScenarios} />
        <details>
          <summary className="font-medium cursor-pointer">
            Fictional payment performance assumptions
          </summary>
          <div className="mt-3">
            <ProfileControls
              profile={payment}
              algos={['rsa-2048', 'ml-kem-768', 'aes-128', 'aes-256']}
              onChange={(algo, rate) =>
                setPayment((p) => ({ ...p, opsPerSec: { ...p.opsPerSec, [algo]: rate } }))
              }
            />
          </div>
        </details>
      </section>
      <HsmStorageExplorer />
      <div className="flex flex-wrap gap-2">
        <Button onClick={exportCsv}>Export educational estimate (CSV)</Button>
        <SaveToOperationsPack
          build={() => ({
            type: 'hsm-capacity-plan' as const,
            moduleId: 'hsm-capacity',
            title: 'HSM educational estimate',
            data: hsmCapacityPlanMarkdown(plan),
            inputs: plan,
          })}
        />
      </div>
    </div>
  )
}
