// SPDX-License-Identifier: GPL-3.0-only
/**
 * FHE + HSM validation evidence (owner decisions 2026-10-03).
 *
 * `fhe-hsm-scenarios.v1.json` is the canonical scenario contract: stable scenario and
 * step ids. `fhe-evidence.v1.json` holds signed, hash-pinned records that steps ran.
 *
 * Lab roles (owner, 2026-10-03):
 *   data owner        → the Mac (M4 Pro), pqctoday-sandbox
 *   FHE server        → the KV260, pqctoday-fhe (the untrusted compute side, no token)
 *   FHE custodian/HSM → the MX95 (primary) and MX95 Pro (backup), pqctoday-cacp,
 *                       each a software token on that board; Ventuno Q later
 * Threshold scenarios are validated as 2-of-2 on the two custodian boards.
 * A run spanning devices is one end-to-end record with per-device parts. Nothing is ever
 * hardware custody. The Hub raises a step's badge only for a record that validates here.
 */
import contractJson from './fhe-hsm-scenarios.v1.json'
import manifestJson from '../../../public/data/fhe-evidence/fhe-evidence.v1.json'

export type EvidenceLevel = 'reference' | 'emulator' | 'device' | 'end-to-end'
export type EvidenceProducer = 'pqctoday-sandbox' | 'pqctoday-fhe' | 'pqctoday-cacp'
export type EvidenceDevice = 'mac-m4pro' | 'kv260' | 'mx95' | 'mx95-pro' | 'ventuno-q'
export type DeviceRole = 'data-owner' | 'fhe-server' | 'custodian' | 'backup-custodian' | 'party'
export type EvidenceStatus = 'estimate' | 'measured' | 'reproduced' | 'independently-reviewed'

/** FHE plan §1.2 claim scopes, plus the data owner's own device. */
export type ClaimScope =
  | 'reference-library'
  | 'browser-emulator'
  | 'native-software-token'
  | 'owner-device'
  | 'board-untrusted-compute'
  | 'board-software-token'

/** Statuses that may raise a badge; an estimate never does. */
export const BADGE_STATUSES: EvidenceStatus[] = ['measured', 'reproduced', 'independently-reviewed']

export const DEVICE_LABELS: Record<EvidenceDevice, string> = {
  'mac-m4pro': 'Mac (M4 Pro)',
  kv260: 'KV260',
  mx95: 'MX95',
  'mx95-pro': 'MX95 Pro',
  'ventuno-q': 'Ventuno Q',
}

/** Which producer runs on which device, and which roles each device may play. */
export const DEVICE_RULES: Record<
  EvidenceDevice,
  { producer: EvidenceProducer; roles: DeviceRole[] }
> = {
  'mac-m4pro': { producer: 'pqctoday-sandbox', roles: ['data-owner'] },
  kv260: { producer: 'pqctoday-fhe', roles: ['fhe-server'] },
  mx95: { producer: 'pqctoday-cacp', roles: ['custodian', 'party'] },
  'mx95-pro': { producer: 'pqctoday-cacp', roles: ['backup-custodian', 'party'] },
  'ventuno-q': { producer: 'pqctoday-cacp', roles: ['custodian', 'backup-custodian', 'party'] },
}

export const ROLE_SCOPE: Record<DeviceRole, ClaimScope> = {
  'data-owner': 'owner-device',
  'fhe-server': 'board-untrusted-compute',
  custodian: 'board-software-token',
  'backup-custodian': 'board-software-token',
  party: 'board-software-token',
}

const ROLE_LABEL: Record<DeviceRole, (d: string) => string> = {
  'data-owner': (d) => `data owner on ${d}`,
  'fhe-server': (d) => `FHE server on ${d} (untrusted compute, software-held keys)`,
  custodian: (d) => `custodian: software token on ${d}`,
  'backup-custodian': (d) => `backup custodian: software token on ${d}`,
  party: (d) => `key-holder party: software token on ${d}`,
}

export interface EvidenceArtifact {
  name: string
  sha256: string
  url: string
}

/** One device's share of a device or end-to-end run. */
export interface EvidencePart {
  device: EvidenceDevice
  role: DeviceRole
  producer: EvidenceProducer
  stepIds: string[]
  claimScope: ClaimScope
  engine?: { repo: string; commit: string }
}

export interface EvidenceRecord {
  id: string
  scenarioId: string
  /** Every step the run covered, including transfers between devices. */
  stepIds: string[]
  level: EvidenceLevel
  /** reference / emulator runs: the single producer. Device runs: see `parts`. */
  producer?: EvidenceProducer
  /** Required for device (exactly one) and end-to-end (one per device) runs. */
  parts?: EvidencePart[]
  /** Threshold scenarios on boards: what was actually run, e.g. 2-of-2. */
  parties?: {
    threshold: number
    total: number
    placement: { actor: string; device: EvidenceDevice }[]
  }
  library: { name: string; version: string; commit: string }
  engine?: { repo: string; commit: string }
  /** Canonical parameter-set name, e.g. V1_4_PARAM_MESSAGE_2_CARRY_2_KS_PBS_TUNIFORM_2M128. */
  parameters: string
  /** Library configuration, e.g. "default, use_dedicated_oprf_key(false)". */
  config: string
  /** SHA-256 (hex) of UTF-8 `${parameters}\n${config}`. */
  parameterHash: string
  environment: {
    hardware: string
    os: string
    browser?: string
    toolchain: string
    features: string
  }
  method: { warmup: number; samples: number; distribution: string; peakMemoryMethod: string }
  result: 'pass' | 'fail'
  status: EvidenceStatus
  /** reference / emulator runs only; device parts carry their own scope. */
  claimScope?: ClaimScope
  /** Free-text label; never "hardware custody" or "HSM-validated". */
  claimLabel?: string
  artifacts: EvidenceArtifact[]
  measuredAt: string
  /** Per-record signature; without it the record is hash-pinned under the manifest .sig. */
  signature?: { keyId: string; alg: 'ML-DSA-65'; value: string }
}

export interface EvidenceManifest {
  schema: 'fhe-evidence.v1'
  records: EvidenceRecord[]
}

export interface ScenarioContract {
  schema: 'fhe-hsm-scenarios.v1'
  scenarios: {
    id: string
    validationTargetLabel:
      | 'reference-validated'
      | 'token-validated'
      | 'conformance-mapped'
      | 'wire-interoperable'
      | 'reference-only'
    disclosures: string[]
    budgets: Record<string, number | null>
    fixtures: {
      id: string
      stepId: string
      description: string
      /** The canonical input; inputHash is SHA-256 of its sorted-key, whitespace-free JSON. */
      input: unknown
      inputHash: string
      expectedOutputHash: string
    }[]
    actors: { id: string; kind: string; zone: string }[]
    steps: {
      id: string
      from: string
      to: string
      phase: string
      data: string
      deployment: boolean
      engineStatus: 'engine' | 'planned' | 'refused' | 'outside'
      mechanism?: string
      api?: string
    }[]
  }[]
}

export const SCENARIO_CONTRACT = contractJson as unknown as ScenarioContract
export const EVIDENCE_MANIFEST = manifestJson as unknown as EvidenceManifest

type Scenario = ScenarioContract['scenarios'][number]

const SHA256 = /^[0-9a-f]{64}$/
const COMMIT = /^[0-9a-f]{7,40}$/
const ISO_DATE = /^\d{4}-\d{2}-\d{2}(T[\d:.]+(Z|[+-]\d{2}:\d{2}))?$/
const THRESHOLD_SCENARIOS = new Set(['openfhe-threshold', 'lattigo-threshold'])

/** Actor ids a role may act as in a scenario (the step's `from` or `to` must be one). */
function roleActors(s: Scenario, role: DeviceRole): string[] {
  const kindOf = (k: string) => s.actors.filter((a) => a.kind === k).map((a) => a.id)
  switch (role) {
    case 'data-owner':
      return s.actors.filter((a) => a.zone === 'owner' && a.kind === 'client').map((a) => a.id)
    case 'fhe-server':
      return s.actors.filter((a) => a.zone === 'third').map((a) => a.id)
    case 'custodian':
      return kindOf('hsm').filter((id) => id !== 'dr')
    case 'backup-custodian':
      return s.actors.filter((a) => a.id === 'dr').map((a) => a.id)
    case 'party':
      return s.actors.filter((a) => a.zone === 'party').map((a) => a.id)
  }
}

function checkPart(p: EvidencePart, s: Scenario, recordSteps: string[]): string[] {
  const e: string[] = []
  const rule = DEVICE_RULES[p.device]
  if (!rule) return [`unknown device "${p.device}"`]
  if (p.producer !== rule.producer) e.push(`${p.device} runs ${rule.producer}, not ${p.producer}`)
  if (!rule.roles.includes(p.role)) e.push(`${p.device} cannot play ${p.role}`)
  if (p.claimScope !== ROLE_SCOPE[p.role])
    e.push(`${p.role} claims ${ROLE_SCOPE[p.role]}, not ${p.claimScope}`)
  const actors = roleActors(s, p.role)
  for (const id of p.stepIds ?? []) {
    const st = s.steps.find((x) => x.id === id)
    if (!st) e.push(`unknown step "${id}"`)
    else if (!actors.includes(st.from) && !actors.includes(st.to))
      e.push(`${p.role} on ${p.device} did not take part in step "${id}"`)
    if (!recordSteps.includes(id)) e.push(`part step "${id}" missing from the record's stepIds`)
  }
  if (p.claimScope === 'board-software-token' && !COMMIT.test(p.engine?.commit ?? ''))
    e.push(`software-token part on ${p.device} needs the engine repo and commit`)
  return e
}

/** Every problem with one record; an empty list means it may raise a badge. */
export function validateRecord(
  r: EvidenceRecord,
  contract: ScenarioContract = SCENARIO_CONTRACT
): string[] {
  const errors: string[] = []
  const s = contract.scenarios.find((x) => x.id === r.scenarioId)
  if (!r.id) errors.push('missing id')
  if (!s) return [...errors, `unknown scenario "${r.scenarioId}"`]
  if (!Array.isArray(r.stepIds) || r.stepIds.length === 0) errors.push('no stepIds')
  else
    for (const id of r.stepIds)
      if (!s.steps.some((x) => x.id === id)) errors.push(`unknown step "${id}"`)

  if (r.level === 'reference' || r.level === 'emulator') {
    if (r.parts?.length) errors.push(`${r.level} runs have no device parts`)
    if (
      r.level === 'reference' &&
      (!['pqctoday-sandbox', 'pqctoday-fhe'].includes(r.producer ?? '') ||
        r.claimScope !== 'reference-library')
    )
      errors.push(
        'reference evidence comes from pqctoday-sandbox or pqctoday-fhe with claimScope reference-library'
      )
    if (r.level === 'emulator') {
      if (!['browser-emulator', 'native-software-token'].includes(r.claimScope ?? ''))
        errors.push('emulator evidence claims browser-emulator or native-software-token')
      if (!COMMIT.test(r.engine?.commit ?? ''))
        errors.push('emulator evidence needs the engine commit')
    }
  } else if (r.level === 'device' || r.level === 'end-to-end') {
    const parts = r.parts ?? []
    if (r.level === 'device' && parts.length !== 1) errors.push('a device run has exactly one part')
    if (r.level === 'end-to-end' && parts.length < 2)
      errors.push('an end-to-end run spans at least two devices')
    for (const p of parts) errors.push(...checkPart(p, s, r.stepIds ?? []))
  } else errors.push(`unknown level "${r.level}"`)

  if (THRESHOLD_SCENARIOS.has(s.id) && (r.level === 'device' || r.level === 'end-to-end')) {
    const pa = r.parties
    if (!pa)
      errors.push('threshold runs on boards must state parties (threshold, total, placement)')
    else {
      if (!(pa.threshold >= 1 && pa.threshold <= pa.total) || pa.placement.length !== pa.total)
        errors.push('parties: threshold ≤ total and one placement per party')
      for (const pl of pa.placement) {
        if (!s.actors.some((a) => a.id === pl.actor && a.zone === 'party'))
          errors.push(`parties: "${pl.actor}" is not a key-holder party`)
        if (!DEVICE_RULES[pl.device]?.roles.includes('party'))
          errors.push(`parties: ${pl.device} cannot hold a share`)
      }
    }
  }

  if (!r.library?.name || !r.library.version || !COMMIT.test(r.library.commit ?? ''))
    errors.push('library needs name, version and a commit')
  if (!r.parameters || typeof r.config !== 'string' || !SHA256.test(r.parameterHash ?? ''))
    errors.push('parameters, config and parameterHash')
  const env = r.environment
  if (!env?.hardware || !env.os || !env.toolchain || typeof env.features !== 'string')
    errors.push('environment needs hardware, os, toolchain and features')
  const m = r.method
  if (
    !m ||
    !Number.isInteger(m.warmup) ||
    !Number.isInteger(m.samples) ||
    m.samples < 1 ||
    !m.distribution ||
    !m.peakMemoryMethod
  )
    errors.push('method needs warmup, samples ≥ 1, distribution and peakMemoryMethod')
  if (r.result !== 'pass' && r.result !== 'fail') errors.push('result must be pass or fail')
  if (!['estimate', ...BADGE_STATUSES].includes(r.status)) errors.push('bad status')
  const claims = [r.claimScope, r.claimLabel, ...(r.parts ?? []).map((p) => p.claimScope)].join(' ')
  if (/hardware custody|hsm-validated/i.test(claims))
    errors.push('claims may not say hardware custody or HSM-validated')
  if (r.signature && (r.signature.alg !== 'ML-DSA-65' || !r.signature.keyId || !r.signature.value))
    errors.push('signature needs keyId, alg ML-DSA-65 and value')
  if (!Array.isArray(r.artifacts) || r.artifacts.length === 0) errors.push('no artifacts')
  else
    for (const a of r.artifacts)
      if (!a.name || !SHA256.test(a.sha256) || !/^https:\/\//.test(a.url))
        errors.push(`artifact "${a.name}" needs a sha256 and an https url`)
  if (!ISO_DATE.test(r.measuredAt ?? '')) errors.push('measuredAt must be an ISO date')
  return errors
}

export interface StepValidation {
  level: EvidenceLevel
  /** e.g. "custodian: software token on MX95 · end-to-end run". */
  label: string
  device?: EvidenceDevice
  record: EvidenceRecord
}

/** Label for one step of a passing record. Never says "hardware" or "HSM-validated". */
export function stepLabel(r: EvidenceRecord, stepId: string): string {
  if (r.level === 'reference') return `reference-validated (${r.library.name} ${r.library.version})`
  if (r.level === 'emulator') return 'token-validated · software token emulator'
  const part = r.parts?.find((p) => p.stepIds.includes(stepId))
  const base = part
    ? ROLE_LABEL[part.role](DEVICE_LABELS[part.device])
    : `transfer between ${(r.parts ?? []).map((p) => DEVICE_LABELS[p.device]).join(' → ')}`
  const e2e = r.level === 'end-to-end' ? ' · end-to-end run' : ''
  const scenario = SCENARIO_CONTRACT.scenarios.find((s) => s.id === r.scenarioId)
  const shown = (scenario as { label?: string } | undefined)?.label?.match(/\((\d+-of-\d+)\)/)?.[1]
  const ran = r.parties ? `${r.parties.threshold}-of-${r.parties.total}` : ''
  const parties = ran
    ? ` · ${ran}${shown && shown !== ran ? ` (scenario shows ${shown})` : ''}`
    : ''
  return `${base}${e2e}${parties}`
}

/** Passing, valid evidence for one step; empty while no claims exist. */
export function validationsFor(
  scenarioId: string,
  stepId: string,
  records: EvidenceRecord[] = EVIDENCE_MANIFEST.records
): StepValidation[] {
  return records
    .filter(
      (r) =>
        r.scenarioId === scenarioId &&
        r.stepIds.includes(stepId) &&
        r.result === 'pass' &&
        BADGE_STATUSES.includes(r.status) &&
        validateRecord(r).length === 0
    )
    .map((r) => ({
      level: r.level,
      label: stepLabel(r, stepId),
      device: r.parts?.find((p) => p.stepIds.includes(stepId))?.device,
      record: r,
    }))
}
