// SPDX-License-Identifier: GPL-3.0-only
/**
 * The operations pack's own artifacts (Layer 2). Each is stored in the
 * artifact store as Markdown (`data`) plus its structured `inputs`:
 *
 * - `ops-scope`: what the change covers, edited in the pack panel;
 * - `hsm-capacity-plan`: a snapshot of the HSM Capacity Calculator, with every
 *   rate's source and whether the user changed it;
 * - `cert-capacity-plan`: a snapshot of the Cert Capacity Calculator;
 * - `protocol-config`: a configuration fragment from a config generator, with
 *   the version it needs and how (or whether) it was checked;
 * - `vpn-sim-run`: what one VPN simulator exchange used and showed, with the
 *   simulator's own statement of what was real and what was modelled;
 * - `ops-test-plan`: the shared migration checklist, operations lines.
 *
 * Every artifact says what kind of claim its numbers are, so a neat pack never
 * reads as measured production evidence. Design note: pqctoday-plan,
 * it-operations-operations-package-design-note.
 */

// ── Shared helpers ─────────────────────────────────────────────────────────

const orNotStated = (s: string) => (s.trim() ? s.trim() : '_Not stated._')

const cell = (s: string | number) => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ').trim()

const num = (n: number) => n.toLocaleString('en-US')

/** What kind of number a value is. Shown next to every rate and estimate. */
export type EvidenceType =
  | 'standard-constant'
  | 'vendor-published'
  | 'editorial-estimate'
  | 'user-entered'
  | 'browser-measurement'

export const EVIDENCE_TYPE_LABELS: Record<EvidenceType, string> = {
  'standard-constant': 'Standard constant',
  'vendor-published': 'Vendor-published',
  'editorial-estimate': 'Editorial estimate (not a measurement)',
  'user-entered': 'User-entered',
  'browser-measurement': 'Measured in this browser',
}

// ── Scope ──────────────────────────────────────────────────────────────────

export interface OpsScopeInputs {
  environments: string
  responsibility: string
  systems: string
  changeWindows: string
  changePolicy: string
  recovery: string
}

export const OPS_SCOPE_FIELDS: { key: keyof OpsScopeInputs; label: string; hint: string }[] = [
  {
    key: 'environments',
    label: 'Environments',
    hint: 'For example: production EU and US, staging, DR site',
  },
  {
    key: 'responsibility',
    label: 'What your team operates',
    hint: 'Which parts you run and which belong to another team, a cloud provider or a vendor',
  },
  {
    key: 'systems',
    label: 'Systems and protocols in scope',
    hint: 'TLS terminators, VPN gateways, SSH fleet, HSM/KMS, signing pipelines — with versions',
  },
  {
    key: 'changeWindows',
    label: 'Change and renewal windows',
    hint: 'Maintenance windows, certificate renewal dates, hardware refresh dates',
  },
  {
    key: 'changePolicy',
    label: 'Change policy',
    hint: 'Approval steps, canary rules, emergency-change process',
  },
  {
    key: 'recovery',
    label: 'Recovery objectives',
    hint: 'RTO and RPO, rollback owner, backup and restore for keys',
  },
]

export const emptyOpsScope = (): OpsScopeInputs => ({
  environments: '',
  responsibility: '',
  systems: '',
  changeWindows: '',
  changePolicy: '',
  recovery: '',
})

export function opsScopeMarkdown(s: OpsScopeInputs): string {
  return [
    '# Operations scope',
    '',
    ...OPS_SCOPE_FIELDS.flatMap((f) => [`## ${f.label}`, '', orNotStated(s[f.key]), '']),
  ].join('\n')
}

/** One-line summary for the pack cover. */
export const opsScopeSummary = (s: OpsScopeInputs): string =>
  (s.systems.trim() || s.environments.trim()).split('\n')[0] ?? ''

// ── HSM capacity plan ──────────────────────────────────────────────────────

export interface HsmRate {
  algorithm: string
  opsPerSec: number
  /** True when the user changed this rate from the calculator default. */
  userEntered: boolean
}

export interface HsmProfileSnapshot {
  name: string
  sourceNote: string
  rates: HsmRate[]
}

export interface HsmScenarioSnapshot {
  label: string
  hsmProfile: string
  bottleneck: string
  hsmsRequired: number
  hsmsDeployed: number
  sufficient: boolean
  fleetUtilizationPct: number
}

export interface HsmCapacityPlanInputs {
  deploymentSize: string
  redundancy: string
  locations: number
  targetUtilizationPct: number
  migrationHorizon: string
  hybridSigningTransition: boolean
  codeSigningAlgorithm: string
  useCases: { label: string; enabled: boolean; tps: number }[]
  profiles: HsmProfileSnapshot[]
  scenarios: HsmScenarioSnapshot[]
  /** The calculator's own caveats, copied verbatim so the plan carries them. */
  caveats: string[]
}

export function hsmCapacityPlanMarkdown(p: HsmCapacityPlanInputs): string {
  const enabled = p.useCases.filter((u) => u.enabled)
  const total = enabled.reduce((a, u) => a + u.tps, 0)
  return [
    '# HSM capacity plan',
    '',
    'Claim status: Estimate. The result is only as good as the rates below; replace editorial estimates with measurements from your own HSM, firmware, mechanism and configuration before using it for procurement or a change board.',
    '',
    '## Results',
    '',
    '| Scenario | HSM profile | Bottleneck | HSMs required | HSMs deployed | Sufficient | Fleet utilisation |',
    '|---|---|---|---|---|---|---|',
    ...p.scenarios.map(
      (s) =>
        `| ${cell(s.label)} | ${cell(s.hsmProfile)} | ${cell(s.bottleneck)} | ${s.hsmsRequired} | ${s.hsmsDeployed} | ${s.sufficient ? 'Yes' : 'No'} | ${Math.round(s.fleetUtilizationPct)}% |`
    ),
    '',
    '## Settings',
    '',
    `- Deployment size preset: ${p.deploymentSize}`,
    `- Redundancy: ${p.redundancy}`,
    `- Locations: ${p.locations}`,
    `- Target utilisation: ${p.targetUtilizationPct}%${p.targetUtilizationPct >= 100 ? ' (no headroom)' : ''}`,
    `- Migration horizon: ${p.migrationHorizon}`,
    `- Hybrid signing during transition: ${p.hybridSigningTransition ? 'yes' : 'no'}`,
    `- Code-signing algorithm: ${p.codeSigningAlgorithm}`,
    '',
    '## Workload',
    '',
    `${enabled.length} of ${p.useCases.length} use cases enabled, ${num(total)} transactions per second in total.`,
    '',
    '| Use case | Enabled | Transactions/s |',
    '|---|---|---|',
    ...p.useCases.map((u) => `| ${cell(u.label)} | ${u.enabled ? 'Yes' : 'No'} | ${num(u.tps)} |`),
    '',
    '## HSM throughput assumptions',
    '',
    ...p.profiles.flatMap((prof) => [
      `### ${prof.name}`,
      '',
      `Source as stated by the calculator: ${orNotStated(prof.sourceNote)}`,
      '',
      '| Algorithm | Ops/s per HSM | Evidence type |',
      '|---|---|---|',
      ...prof.rates.map(
        (r) =>
          `| ${cell(r.algorithm)} | ${num(r.opsPerSec)} | ${
            EVIDENCE_TYPE_LABELS[r.userEntered ? 'user-entered' : 'editorial-estimate']
          } |`
      ),
      '',
    ]),
    '## Caveats',
    '',
    ...(p.caveats.length ? p.caveats.map((c) => `- ${c}`) : ['_None recorded._']),
    '',
  ].join('\n')
}

// ── Certificate capacity plan ──────────────────────────────────────────────

export interface CertCapacityRow {
  algorithm: string
  storageMB: number
  renewalsPerYear: number
  tlsKBPerHandshake: number
  aggregateMBPerSec: number
  signOpsPerSecPerCore: number
  cpuCorePercent: number
  sizeSource: string
  perfSource: string
}

export interface CertCapacityPlanInputs {
  certCount: number
  renewalDays: number
  handshakesPerSec: number
  rows: CertCapacityRow[]
}

export function certCapacityPlanMarkdown(p: CertCapacityPlanInputs): string {
  return [
    '# Certificate capacity plan',
    '',
    'Claim status: Estimate. Sizes follow the published algorithm parameters plus a fixed 512-byte allowance for the rest of the certificate; signing speeds are reference single-core benchmarks, not your servers.',
    '',
    '## Inputs (user-entered)',
    '',
    `- Certificates: ${num(p.certCount)}`,
    `- Renewal interval: ${p.renewalDays} days`,
    `- TLS handshakes per second: ${num(p.handshakesPerSec)}`,
    '',
    '## Results',
    '',
    '| Algorithm | CA archive MB/year | Renewals/year | TLS KB/handshake | MB/s at this rate | Sign ops/s (1 core) | % of one core |',
    '|---|---|---|---|---|---|---|',
    ...p.rows.map(
      (r) =>
        `| ${cell(r.algorithm)} | ${r.storageMB} | ${r.renewalsPerYear} | ${r.tlsKBPerHandshake} | ${r.aggregateMBPerSec} | ${num(r.signOpsPerSecPerCore)} | ${r.cpuCorePercent} |`
    ),
    '',
    '## Sources',
    '',
    '| Algorithm | Size source | Performance source |',
    '|---|---|---|',
    ...p.rows.map(
      (r) => `| ${cell(r.algorithm)} | ${cell(r.sizeSource)} | ${cell(r.perfSource)} |`
    ),
    '',
  ].join('\n')
}

// ── Protocol configuration ─────────────────────────────────────────────────

export interface ProtocolConfigInputs {
  /** e.g. "OpenSSH server (sshd_config)". */
  product: string
  /** e.g. "Hybrid". */
  profile: string
  /** e.g. "OpenSSH 9.9 or later". */
  minimumVersion: string
  /** What this fragment does not change (e.g. host and user authentication). */
  doesNotChange: string
  /** How the fragment was checked. Generated text is "Not machine-checked". */
  checked: string
  config: string
  /** Generator the fragment came from, for the pack's "where from" line. */
  source: string
}

/** The `# Requires …` lines of a generated fragment, as one sentence. */
export function requirementsFrom(config: string): string {
  return config
    .split('\n')
    .map((l) => /^\s*#\s*Requires\s+(.*)$/i.exec(l)?.[1]?.trim())
    .filter((s): s is string => !!s)
    .join('; ')
}

export const NOT_MACHINE_CHECKED =
  'Not machine-checked: generated by PQC Today. Test it with the product’s own config check before use.'

export function protocolConfigMarkdown(p: ProtocolConfigInputs): string {
  return [
    `# Configuration: ${p.product} (${p.profile})`,
    '',
    `- Needs: ${orNotStated(p.minimumVersion)}`,
    `- Does not change: ${orNotStated(p.doesNotChange)}`,
    `- How it was checked: ${orNotStated(p.checked)}`,
    `- Generated by: ${p.source}`,
    '',
    '```',
    p.config.trimEnd(),
    '```',
    '',
  ].join('\n')
}

// ── VPN simulator run ──────────────────────────────────────────────────────

export interface VpnRunMessage {
  label: string
  bytes: number
}

export interface VpnSimRunInputs {
  keyExchange: string
  initiatorAuth: string
  responderAuth: string
  mtu: number
  fragmentation: boolean
  messages: VpnRunMessage[]
  totalBytes: number
  /** When the run was saved (Unix ms). */
  ranAt: number
  /** The simulator's statement of what was real and what was modelled. */
  executionNotes: string[]
}

export function vpnSimRunMarkdown(r: VpnSimRunInputs): string {
  return [
    '# VPN simulator run (IKEv2)',
    '',
    'Claim status: Scenario. One exchange between two in-browser strongSwan workers; it is not a test of your gateways or network path.',
    '',
    `- Key exchange: ${r.keyExchange}`,
    `- Authentication: initiator ${r.initiatorAuth}, responder ${r.responderAuth}`,
    `- MTU: ${r.mtu} bytes · IKEv2 fragmentation (RFC 7383): ${r.fragmentation ? 'on' : 'off'}`,
    `- Run saved: ${new Date(r.ranAt).toISOString().slice(0, 16).replace('T', ' ')} UTC`,
    '',
    '## Messages',
    '',
    'Sizes are the simulator’s message model for this configuration, not bytes captured on a network.',
    '',
    '| Message | Bytes | Over the MTU |',
    '|---|---|---|',
    ...r.messages.map(
      (m) => `| ${cell(m.label)} | ${num(m.bytes)} | ${m.bytes > r.mtu ? 'Yes' : 'No'} |`
    ),
    `| Total | ${num(r.totalBytes)} | |`,
    '',
    '## How this run was produced',
    '',
    ...r.executionNotes.map((n) => `- ${n}`),
    '',
  ].join('\n')
}

/** What the VPN simulator really executes, per its own disclosure panel. */
export const VPN_SIM_EXECUTION_NOTES: string[] = [
  'Real: two strongSwan charon builds compiled to WebAssembly, exchanging real IKEv2 messages between browser workers.',
  'Real: RFC 7383 fragmentation and reassembly when it is on.',
  'Real in certificate mode: ML-DSA signing through PKCS #11 on SoftHSM (a software token in the browser, not a hardware or validated HSM).',
  'Simulated: the kernel is a stub, so no ESP data-plane traffic is carried.',
  'Simulated: step-by-step progress is driven by matching log lines.',
]
