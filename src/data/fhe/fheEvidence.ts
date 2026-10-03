// SPDX-License-Identifier: GPL-3.0-only
/**
 * FHE + HSM validation evidence (owner decision 2026-10-03).
 *
 * `fhe-hsm-scenarios.v1.json` is the canonical scenario contract: stable scenario and
 * step ids. `fhe-evidence.v1.json` holds signed, hash-pinned records that a step ran,
 * produced by pqctoday-sandbox (reference libraries), pqctoday-fhe (KV260) and
 * pqctoday-cacp (MX95, MX95 Pro; Ventuno Q later). The Hub raises a step's validation
 * badge only for a record that validates here; with no records, no claim is shown.
 * A board run is a software token on that board, never hardware custody.
 */
import contractJson from './fhe-hsm-scenarios.v1.json'
import manifestJson from './fhe-evidence.v1.json'

export type EvidenceLevel = 'reference' | 'emulator' | 'board'
export type EvidenceProducer = 'pqctoday-sandbox' | 'pqctoday-fhe' | 'pqctoday-cacp'
export type EvidenceBoard = 'kv260' | 'mx95' | 'mx95-pro' | 'ventuno-q'
export type EvidenceStatus = 'measured' | 'reproduced' | 'reviewed'

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
  parameters: string
  parameterHash: string
  method: string
  result: 'pass' | 'fail'
  status: EvidenceStatus
  claimScope: string
  artifacts: EvidenceArtifact[]
  measuredAt: string
}

export interface EvidenceManifest {
  schema: 'fhe-evidence.v1'
  records: EvidenceRecord[]
}

export interface ScenarioContract {
  schema: 'fhe-hsm-scenarios.v1'
  scenarios: {
    id: string
    actors: { id: string; kind: string; zone: string }[]
    steps: {
      id: string
      from: string
      to: string
      phase: string
      data: string
      deployment: boolean
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
  if (r.level !== 'reference' && (!r.engine || !COMMIT.test(r.engine.commit ?? '')))
    errors.push('emulator and board evidence need the engine repo and commit')
  if (!r.parameters || !SHA256.test(r.parameterHash ?? '')) errors.push('parameters and hash')
  if (!r.method) errors.push('missing method')
  if (r.result !== 'pass' && r.result !== 'fail') errors.push('result must be pass or fail')
  if (!['measured', 'reproduced', 'reviewed'].includes(r.status)) errors.push('bad status')
  if (!r.claimScope) errors.push('missing claimScope')
  if (/hardware custody|hsm-validated/i.test(r.claimScope ?? ''))
    errors.push('claimScope may not claim hardware custody')
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
        validateRecord(r).length === 0
    )
    .map((r) => ({ level: r.level, label: validationLabel(r), board: r.board, record: r }))
}
