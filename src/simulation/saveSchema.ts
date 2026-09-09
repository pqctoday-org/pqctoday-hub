// SPDX-License-Identifier: GPL-3.0-only
/**
 * saveSchema — validate a portable run BEFORE any of it reaches the store.
 *
 * The defect this replaces: `importSave` checked three things (is it an object,
 * is `kind` right, is `state` an object) and then applied the payload field by
 * field with `typeof` guards and silent fallbacks. `q: 99`, `year: -5`, an
 * unknown phase id and a save written by any past or future schema version all
 * imported cleanly and corrupted the live run. The `version` the exporter
 * writes was never read back.
 *
 * Contract here:
 *  - validate the WHOLE payload first, collecting every problem;
 *  - reject atomically — a rejected import must leave the current run byte-for
 *    byte as it was, with actionable errors;
 *  - state the supported schema version explicitly, both directions.
 */
import { PHASE_ORDER } from '@/data/frameworkPhases'
import { isOpenStep } from '@/store/useSimulationStore'
import type { SimulationData } from '@/services/storage/snapshotTypes'
import type { DifficultyId } from '@/data/simBalance'
import { STATUS_RANK, type EvidenceOrigin, type SimEvidenceRecord } from './evidence'

/** Bumped with the store version whenever the run slice's shape changes. */
export const SAVE_SCHEMA_VERSION = 18
export const SAVE_KIND = 'pqc-simulation-save'
export const SAVE_APP = 'pqc-today'

/** Oldest schema this build can still read. */
export const MIN_SUPPORTED_SAVE_VERSION = 17

const SIZES = ['small', 'mid', 'large', 'global']
const DIFFICULTIES: DifficultyId[] = ['easy', 'realistic', 'hard']
const EDGE_CHOICES = ['hybrid', 'pure']
const ORIGINS: EvidenceOrigin[] = ['learner', 'imported', 'narrated-example', 'ai-delegated']
const EVENT_SEVERITIES = ['danger', 'warning', 'success', 'info']
/** W5.5 — the phase tabs a restored run may point at. */
const PHASE_TABS = ['decide', 'progress', 'resources', 'signals']

/** A run cannot start before the framework existed or run past a sane horizon. */
const YEAR_MIN = 2020
const YEAR_MAX = 2100

export type ValidationResult =
  | { ok: true; data: SimulationData; version: number }
  | { ok: false; errors: string[] }

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === 'string')

const isInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v)

const isFiniteNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

function validateEvidenceRecord(r: unknown, i: number, errors: string[]): boolean {
  if (!isRecord(r)) {
    errors.push(`evidence[${i}]: not an object`)
    return false
  }
  let ok = true
  if (typeof r.id !== 'string' || !r.id) {
    errors.push(`evidence[${i}].id: must be a non-empty string`)
    ok = false
  }
  if (typeof r.resourceId !== 'string') {
    errors.push(`evidence[${i}].resourceId: must be a string`)
    ok = false
  }
  if (typeof r.status !== 'string' || !(r.status in STATUS_RANK)) {
    errors.push(`evidence[${i}].status: unknown status ${String(r.status)}`)
    ok = false
  }
  if (typeof r.origin !== 'string' || !ORIGINS.includes(r.origin as EvidenceOrigin)) {
    errors.push(`evidence[${i}].origin: unknown origin ${String(r.origin)}`)
    ok = false
  }
  if (!isFiniteNum(r.createdAt)) {
    errors.push(`evidence[${i}].createdAt: must be a number`)
    ok = false
  }
  return ok
}

/**
 * Validate a full save envelope. Never throws, never mutates.
 */
export function validateSave(input: unknown): ValidationResult {
  const errors: string[] = []

  if (!isRecord(input)) return { ok: false, errors: ['save is not a JSON object'] }
  if (input.kind !== SAVE_KIND)
    return { ok: false, errors: [`not a simulation save (kind: ${String(input.kind)})`] }
  if (input.app !== undefined && input.app !== SAVE_APP)
    errors.push(`unexpected app "${String(input.app)}"`)

  const version = input.version
  if (!isInt(version)) {
    return { ok: false, errors: ['save has no numeric schema version'] }
  }
  if (version > SAVE_SCHEMA_VERSION)
    return {
      ok: false,
      errors: [
        `save was written by a newer version of the simulation (schema ${version}; this build reads up to ${SAVE_SCHEMA_VERSION})`,
      ],
    }
  if (version < MIN_SUPPORTED_SAVE_VERSION)
    return {
      ok: false,
      errors: [
        `save schema ${version} is no longer supported (this build reads ${MIN_SUPPORTED_SAVE_VERSION} and newer)`,
      ],
    }

  if (!isRecord(input.state)) return { ok: false, errors: ['save has no state object'] }
  const s = input.state

  // ── scenario identity ────────────────────────────────────────────────────
  if (typeof s.size !== 'string' || !SIZES.includes(s.size))
    errors.push(`size: expected one of ${SIZES.join(', ')}`)
  if (typeof s.country !== 'string' || !s.country) errors.push('country: expected a country code')
  if (typeof s.sector !== 'string' || !s.sector) errors.push('sector: expected a sector id')
  if (typeof s.seat !== 'string' || !s.seat) errors.push('seat: expected a seat id')
  if (typeof s.sel !== 'string' || !PHASE_ORDER.includes(s.sel as (typeof PHASE_ORDER)[number]))
    errors.push(`sel: unknown phase id ${String(s.sel)}`)

  // ── run clock ────────────────────────────────────────────────────────────
  if (!isInt(s.year) || s.year < YEAR_MIN || s.year > YEAR_MAX)
    errors.push(`year: expected an integer between ${YEAR_MIN} and ${YEAR_MAX}`)
  if (!isInt(s.q) || s.q < 1 || s.q > 4) errors.push('q: expected a quarter between 1 and 4')
  if (!isFiniteNum(s.crqcShift)) errors.push('crqcShift: expected a finite number')

  // ── determinism + difficulty ─────────────────────────────────────────────
  if (!isInt(s.seed) || s.seed < 0) errors.push('seed: expected a non-negative integer')
  if (typeof s.difficulty !== 'string' || !DIFFICULTIES.includes(s.difficulty as DifficultyId))
    errors.push(`difficulty: expected one of ${DIFFICULTIES.join(', ')}`)

  // ── budget + attempts ────────────────────────────────────────────────────
  if (!isFiniteNum(s.securedBudgetM) || s.securedBudgetM < 0)
    errors.push('securedBudgetM: expected a non-negative number')
  if (!isFiniteNum(s.spentBudgetM) || s.spentBudgetM < 0)
    errors.push('spentBudgetM: expected a non-negative number')
  if (!isInt(s.trapsThisRun) || s.trapsThisRun < 0)
    errors.push('trapsThisRun: expected a non-negative integer')

  // ── collections ──────────────────────────────────────────────────────────
  for (const key of [
    'visitedRefs',
    'visitedWorkshops',
    'visitedScenarios',
    'picks',
    'catalogCompleted',
    'auto',
  ] as const) {
    if (!isStringArray(s[key])) errors.push(`${key}: expected an array of strings`)
  }
  if (typeof s.runCompleteSeen !== 'boolean') errors.push('runCompleteSeen: expected a boolean')
  if (s.openStepRef !== undefined && s.openStepRef !== null && !isOpenStep(s.openStepRef))
    errors.push('openStepRef: expected a step object with kind and to, or null')
  if (s.activeTab !== undefined && !PHASE_TABS.includes(s.activeTab as string))
    errors.push(`activeTab: expected one of ${PHASE_TABS.join(', ')}`)

  if (!isRecord(s.edgeDecisions)) {
    errors.push('edgeDecisions: expected an object')
  } else {
    for (const [k, v] of Object.entries(s.edgeDecisions))
      if (typeof v !== 'string' || !EDGE_CHOICES.includes(v))
        errors.push(`edgeDecisions.${k}: expected hybrid or pure`)
  }

  if (!Array.isArray(s.events)) {
    errors.push('events: expected an array')
  } else {
    s.events.forEach((e, i) => {
      if (!isRecord(e) || typeof e.txt !== 'string' || typeof e.t !== 'string')
        errors.push(`events[${i}]: expected { sev, t, txt }`)
      else if (typeof e.sev !== 'string' || !EVENT_SEVERITIES.includes(e.sev))
        errors.push(`events[${i}].sev: unknown severity ${String(e.sev)}`)
    })
  }

  // ── evidence + objective timing (v18) ────────────────────────────────────
  if (s.evidence !== undefined) {
    if (!Array.isArray(s.evidence)) errors.push('evidence: expected an array')
    else s.evidence.forEach((r, i) => validateEvidenceRecord(r, i, errors))
  }
  if (s.attempts !== undefined) {
    if (!isRecord(s.attempts)) {
      errors.push('attempts: expected an object')
    } else {
      for (const [k, v] of Object.entries(s.attempts)) {
        if (!isRecord(v) || !isInt(v.index) || v.index < 0 || typeof v.correct !== 'boolean')
          errors.push(`attempts.${k}: expected { index, correct, at }`)
      }
    }
  }
  if (s.objectiveAchievedYears !== undefined) {
    if (!isRecord(s.objectiveAchievedYears)) {
      errors.push('objectiveAchievedYears: expected an object')
    } else {
      for (const [k, v] of Object.entries(s.objectiveAchievedYears))
        if (!isInt(v) || v < YEAR_MIN || v > YEAR_MAX)
          errors.push(`objectiveAchievedYears.${k}: expected a plausible year`)
    }
  }

  if (errors.length) return { ok: false, errors }

  return {
    ok: true,
    version,
    data: {
      size: s.size as string,
      country: s.country as string,
      sector: s.sector as string,
      seat: s.seat as string,
      sel: s.sel as string,
      edgeDecisions: s.edgeDecisions as Record<string, 'hybrid' | 'pure'>,
      year: s.year as number,
      q: s.q as number,
      crqcShift: s.crqcShift as number,
      events: s.events as unknown[],
      visitedRefs: s.visitedRefs as string[],
      visitedWorkshops: s.visitedWorkshops as string[],
      visitedScenarios: s.visitedScenarios as string[],
      runCompleteSeen: s.runCompleteSeen as boolean,
      picks: s.picks as string[],
      catalogCompleted: s.catalogCompleted as string[],
      auto: s.auto as string[],
      seed: s.seed as number,
      difficulty: s.difficulty as string,
      securedBudgetM: s.securedBudgetM as number,
      spentBudgetM: s.spentBudgetM as number,
      trapsThisRun: s.trapsThisRun as number,
      evidence: (s.evidence as SimEvidenceRecord[]) ?? [],
      attempts: (s.attempts as Record<string, unknown>) ?? {},
      insuranceAssumed: s.insuranceAssumed === true,
      activeTab: typeof s.activeTab === 'string' ? s.activeTab : 'decide',
      openStepRef: isOpenStep(s.openStepRef) ? s.openStepRef : null,
      objectiveAchievedYears: (s.objectiveAchievedYears as Record<string, number>) ?? {},
    },
  }
}

/** What an import WOULD restore, for a preview shown before applying it. */
export interface SavePreview {
  scenario: string
  difficulty: string
  at: string
  evidenceCount: number
  /** Evidence whose origin is not the learner's own work. */
  demonstrationCount: number
  /** Resources referenced by evidence that this build cannot resolve. */
  missingDependencies: string[]
}

export function previewSave(data: SimulationData, resolves: (id: string) => boolean): SavePreview {
  const evidence = (data.evidence ?? []) as SimEvidenceRecord[]
  const missing = [
    ...new Set(evidence.filter((r) => !resolves(r.resourceId)).map((r) => r.resourceId)),
  ]
  return {
    scenario: `${data.size} · ${data.sector} · ${data.country}`,
    difficulty: data.difficulty,
    at: `Q${data.q} ${data.year}`,
    evidenceCount: evidence.length,
    demonstrationCount: evidence.filter((r) => r.origin !== 'learner').length,
    missingDependencies: missing,
  }
}
