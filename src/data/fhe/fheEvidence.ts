// SPDX-License-Identifier: GPL-3.0-only
/**
 * FHE + HSM validation evidence (owner decision 2026-10-03).
 *
 * `fhe-hsm-scenarios.v1.json` is the canonical scenario contract: stable scenario and
 * step ids. `fhe-evidence.v1.json` holds signed, hash-pinned records that a step ran,
 * produced by pqctoday-sandbox (reference libraries), pqctoday-fhe (KV260) and
 * pqctoday-cacp (MX95, MX95 Pro; Ventuno Q later). The Hub raises a step's validation
 * badge only for a record that validates here; with no records, no claim is shown.
 * MX95 / MX95 Pro runs are a software token on that board; the KV260 runs the untrusted
 * compute side (no token). Neither is ever hardware custody.
 */
import contractJson from './fhe-hsm-scenarios.v1.json'
import manifestJson from './fhe-evidence.v1.json'

export type EvidenceLevel = 'reference' | 'emulator' | 'board'
export type EvidenceProducer = 'pqctoday-sandbox' | 'pqctoday-fhe' | 'pqctoday-cacp'
export type EvidenceBoard = 'kv260' | 'mx95' | 'mx95-pro' | 'ventuno-q'
export type EvidenceStatus = 'estimate' | 'measured' | 'reproduced' | 'independently-reviewed'

/** FHE plan §1.2 claim scopes; each evidence level allows only matching scopes. */
export type ClaimScope =
  | 'reference-library'
  | 'browser-emulator'
  | 'native-software-token'
  | 'board-software-token'
  | 'board-untrusted-compute'

export const LEVEL_SCOPES: Record<EvidenceLevel, ClaimScope[]> = {
  reference: ['reference-library'],
  emulator: ['browser-emulator', 'native-software-token'],
  board: ['board-software-token', 'board-untrusted-compute'],
}

/** Statuses that may raise a badge; an estimate never does. */
export const BADGE_STATUSES: EvidenceStatus[] = ['measured', 'reproduced', 'independently-reviewed']

export const BOARD_LABELS: Record<EvidenceBoard, string> = {
  kv260: 'KV260',
  mx95: 'MX95',
  'mx95-pro': 'MX95 Pro',
  'ventuno-q': 'Ventuno Q',
}

/** Which boards each producer may claim (owner scope, 2026-10-03). */
export const PRODUCER_BOARDS: Record<EvidenceProducer, EvidenceBoard[]> = {
  'pqctoday-sandbox': [],
  'pqctoday-fhe': ['kv260'],
  'pqctoday-cacp': ['mx95', 'mx95-pro', 'ventuno-q'],
}

export interface EvidenceArtifact {
  name: string
  sha256: string
  url: string
}

export interface EvidenceRecord {
  id: string
  scenarioId: string
  stepIds: string[]
  level: EvidenceLevel
  producer: EvidenceProducer
  board?: EvidenceBoard
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
  claimScope: ClaimScope
  /** Free-text label, e.g. "software token on KV260". Never "hardware custody". */
  claimLabel?: string
  artifacts: EvidenceArtifact[]
  measuredAt: string
  /** Per-record signature; without it the record is hash-pinned, unsigned (manifest .sig aside). */
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

const SHA256 = /^[0-9a-f]{64}$/
const COMMIT = /^[0-9a-f]{7,40}$/
const ISO_DATE = /^\d{4}-\d{2}-\d{2}(T[\d:.]+(Z|[+-]\d{2}:\d{2}))?$/

/** Every problem with one record; an empty list means it may raise a badge. */
export function validateRecord(
  r: EvidenceRecord,
  contract: ScenarioContract = SCENARIO_CONTRACT
): string[] {
  const errors: string[] = []
  const scenario = contract.scenarios.find((s) => s.id === r.scenarioId)
  if (!r.id) errors.push('missing id')
  if (!scenario) errors.push(`unknown scenario "${r.scenarioId}"`)
  if (!Array.isArray(r.stepIds) || r.stepIds.length === 0) errors.push('no stepIds')
  else if (scenario) {
    for (const id of r.stepIds)
      if (!scenario.steps.some((s) => s.id === id)) errors.push(`unknown step "${id}"`)
  }
  if (!(r.producer in PRODUCER_BOARDS)) errors.push(`unknown producer "${r.producer}"`)
  else if (r.level === 'board') {
    if (!r.board) errors.push('board level needs a board')
    else if (!PRODUCER_BOARDS[r.producer].includes(r.board))
      errors.push(`${r.producer} cannot claim board ${r.board}`)
  } else if (r.board) errors.push(`${r.level} level must not name a board`)
  if (r.level === 'reference' && r.producer !== 'pqctoday-sandbox')
    errors.push('reference evidence comes from pqctoday-sandbox')
  if (!r.library?.name || !r.library.version || !COMMIT.test(r.library.commit ?? ''))
    errors.push('library needs name, version and a commit')
  // The KV260 is the untrusted compute server (no token): its runs measure "outside" steps
  // only and need no engine. Software-token claims (MX95 boards) cover HSM-side steps only.
  const stepStatus = (id: string) => scenario?.steps.find((s) => s.id === id)?.engineStatus
  if (r.claimScope === 'board-untrusted-compute') {
    if (r.producer !== 'pqctoday-fhe' || r.board !== 'kv260')
      errors.push('untrusted-compute evidence comes from pqctoday-fhe on the KV260')
    if (r.stepIds?.some((id) => stepStatus(id) !== 'outside'))
      errors.push('untrusted-compute evidence may cover only steps outside the HSM')
  }
  if (r.claimScope === 'board-software-token') {
    if (r.producer !== 'pqctoday-cacp')
      errors.push('software-token board evidence comes from pqctoday-cacp')
    if (r.stepIds?.some((id) => stepStatus(id) === 'outside'))
      errors.push('software-token evidence may not cover steps outside the HSM')
  }
  const needsEngine =
    r.level === 'emulator' || (r.level === 'board' && r.claimScope !== 'board-untrusted-compute')
  if (needsEngine && (!r.engine || !COMMIT.test(r.engine.commit ?? '')))
    errors.push('emulator and software-token evidence need the engine repo and commit')
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
  if (!LEVEL_SCOPES[r.level]?.includes(r.claimScope))
    errors.push(`claimScope "${r.claimScope}" does not match level ${r.level}`)
  if (/hardware custody|hsm-validated/i.test(`${r.claimScope} ${r.claimLabel ?? ''}`))
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
  /** e.g. "reference-validated (OpenFHE v1.6.0)" or "software token on MX95". */
  label: string
  board?: EvidenceBoard
  record: EvidenceRecord
}

/** Label shown for a passing record. Never says "hardware" or "HSM-validated". */
export function validationLabel(r: EvidenceRecord): string {
  if (r.level === 'reference') return `reference-validated (${r.library.name} ${r.library.version})`
  if (r.level === 'emulator') return 'token-validated · software token emulator'
  if (r.claimScope === 'board-untrusted-compute')
    return `untrusted compute on ${BOARD_LABELS[r.board as EvidenceBoard]} (software-held keys)`
  return `software token on ${BOARD_LABELS[r.board as EvidenceBoard]}`
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
    .map((r) => ({ level: r.level, label: validationLabel(r), board: r.board, record: r }))
}
