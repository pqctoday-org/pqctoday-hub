// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Pharma IP sample model, shared by the Pharma IP Calculator and its guided exercise.
 *
 * One fictional record is encrypted with AES-256-GCM. What differs between the three cases is
 * how that record's content key is protected:
 *   - RSA-2048 key wrapping,
 *   - a pre-shared AES-256 key that both sides already hold,
 *   - an X25519 + ML-KEM-768 hybrid key establishment.
 *
 * The model answers two separate questions and never mixes them:
 *   1. How much fictional commercial value does the record carry (nominal, always shown)?
 *   2. How much of that value is tied to a protection path that an expressly assumed future
 *      recorded-ciphertext decryption scenario would expose?
 * It assigns no probability and predicts no financial loss. Patent and exclusivity dates are
 * shown beside the confidentiality period and never change it. R&D time is the sum of visible,
 * editable fictional steps, never a ratio of a phase index.
 */

export type KeyProtectionPath =
  'rsa-2048' | 'preshared-aes-256' | 'hybrid-x25519-mlkem768' | 'not-specified'

export interface KeyProtectionOption {
  id: KeyProtectionPath
  label: string
  /**
   * True when the assumed scenario (a recorded ciphertext decrypted later) exposes the key.
   * Null when the path is not specified, which is different from "not exposed".
   */
  exposedByRecordedCiphertextScenario: boolean | null
  explanation: string
}

export const KEY_PROTECTION_OPTIONS: readonly KeyProtectionOption[] = [
  {
    id: 'rsa-2048',
    label: 'RSA-2048 wraps the record key',
    exposedByRecordedCiphertextScenario: true,
    explanation:
      'The AES-256-GCM record key travels wrapped under an RSA-2048 public key. In the assumed scenario a future quantum computer recovers the RSA private key from the recorded exchange, which exposes the record key.',
  },
  {
    id: 'preshared-aes-256',
    label: 'Pre-shared AES-256 key protects the record key',
    exposedByRecordedCiphertextScenario: false,
    explanation:
      'Both sides already hold a uniformly random AES-256 key, so no public-key wrapper is part of this boundary. Distributing and storing that key is outside this sample and is not assessed here.',
  },
  {
    id: 'hybrid-x25519-mlkem768',
    label: 'X25519 + ML-KEM-768 protects the record key',
    exposedByRecordedCiphertextScenario: false,
    explanation:
      'The record key is established with the hybrid X25519 + ML-KEM-768 construction. Breaking only the classical X25519 component does not by itself expose the key.',
  },
  {
    id: 'not-specified',
    label: 'Key protection not specified',
    exposedByRecordedCiphertextScenario: null,
    explanation:
      'The sample is not told how the record key is protected, so it cannot say whether that path is exposed. Find out before relying on any figure.',
  },
]

export interface RdStep {
  id: string
  name: string
  /** Fictional duration in years. */
  years: number
  /** True when, in this fictional scenario, the disclosed record would let an adversary omit it. */
  disclosedRecordAllowsSkip: boolean
}

export interface PharmaCompoundInput {
  id: string
  compoundName: string
  /** Fictional nominal commercial value, $ million. */
  commercialValueM: number
  keyProtection: KeyProtectionPath
  /** Years of confidentiality the sample assumes remain, counted from the scenario base year. */
  confidentialityYearsRemaining: number
  /** Patent expiry year. Shown separately; never sets the confidentiality period. */
  patentExpiryYear: number
  /** Optional regulatory exclusivity end year. Shown separately as well. */
  exclusivityEndYear: number | null
  steps: RdStep[]
}

export interface PharmaScenario {
  /** Visible, editable fictional base year. Never the wall clock. */
  baseYear: number
  /** Planning year assumed for the future decryption capability. */
  crqcYear: number
}

export type PharmaPathStatus =
  /** Confidentiality outlasts the assumed year and the path is exposed in the scenario. */
  | 'exposed-in-scenario'
  /** Confidentiality outlasts the assumed year but the declared path is not exposed. */
  | 'path-not-exposed'
  /** Confidentiality ends on or before the assumed year, so there is nothing left to expose. */
  | 'confidentiality-ended'
  /** The key protection is not specified, so exposure cannot be determined. */
  | 'path-unknown'
  /** Nothing is tied to the path because the nominal value is zero. */
  | 'no-value'

export interface PharmaCompoundResult {
  /** Total fictional nominal value, always shown. */
  totalValueM: number
  /**
   * Value belonging to the vulnerable path in the scenario. 0 when nothing is tied to it; null
   * when the key protection is not specified (unknown, not zero).
   */
  valueOnVulnerablePathM: number | null
  status: PharmaPathStatus
  confidentialityEndYear: number
  /** True when confidentiality lasts beyond the assumed capability year. */
  confidentialityOutlastsCapabilityYear: boolean
  developmentYearsTotal: number
  /** Sum of the visible steps flagged as omittable. */
  rdYearsSaved: number
  /** Sum of the visible steps that stay necessary. */
  rdYearsRetained: number
  patentExpiryYear: number
  exclusivityEndYear: number | null
}

const MAX_YEARS = 100
const MAX_VALUE_M = 99999

/** Clamp to a finite, non-negative number and remove float noise from sums. */
function cleanNumber(n: number, max: number): number {
  if (!Number.isFinite(n) || n < 0) return 0
  return Math.min(n, max)
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export function getKeyProtectionOption(id: KeyProtectionPath): KeyProtectionOption {
  const found = KEY_PROTECTION_OPTIONS.find((o) => o.id === id)
  if (!found) throw new Error(`Unknown key protection path: ${id}`)
  return found
}

/**
 * The one calculation used by the calculator and by the guided exercise. Pure: the same inputs
 * always give the same outputs, and nothing reads the clock.
 */
export function computePharmaCompound(
  compound: PharmaCompoundInput,
  scenario: PharmaScenario
): PharmaCompoundResult {
  const totalValueM = round2(cleanNumber(compound.commercialValueM, MAX_VALUE_M))
  const confidentialityYears = cleanNumber(compound.confidentialityYearsRemaining, MAX_YEARS)
  const confidentialityEndYear = scenario.baseYear + confidentialityYears
  const outlasts = confidentialityEndYear > scenario.crqcYear
  const exposedPath = getKeyProtectionOption(
    compound.keyProtection
  ).exposedByRecordedCiphertextScenario

  let status: PharmaPathStatus
  if (totalValueM === 0) status = 'no-value'
  else if (!outlasts) status = 'confidentiality-ended'
  else if (exposedPath === null) status = 'path-unknown'
  else if (exposedPath) status = 'exposed-in-scenario'
  else status = 'path-not-exposed'

  let saved = 0
  let retained = 0
  for (const step of compound.steps) {
    const years = cleanNumber(step.years, MAX_YEARS)
    if (step.disclosedRecordAllowsSkip) saved += years
    else retained += years
  }

  return {
    totalValueM,
    valueOnVulnerablePathM:
      status === 'exposed-in-scenario' ? totalValueM : status === 'path-unknown' ? null : 0,
    status,
    confidentialityEndYear,
    confidentialityOutlastsCapabilityYear: outlasts,
    developmentYearsTotal: round2(saved + retained),
    rdYearsSaved: round2(saved),
    rdYearsRetained: round2(retained),
    patentExpiryYear: compound.patentExpiryYear,
    exclusivityEndYear: compound.exclusivityEndYear,
  }
}

export interface PharmaPortfolioResult {
  totalValueM: number
  /** Sum over compounds whose path is specified. */
  valueOnVulnerablePathM: number
  compoundsOnVulnerablePath: number
  /** Compounds whose exposure cannot be determined; their value is not in the sum above. */
  compoundsPathUnknown: number
  rdYearsSaved: number
}

export function computePharmaPortfolio(
  compounds: PharmaCompoundInput[],
  scenario: PharmaScenario
): PharmaPortfolioResult {
  let totalValueM = 0
  let valueOnVulnerablePathM = 0
  let compoundsOnVulnerablePath = 0
  let compoundsPathUnknown = 0
  let rdYearsSaved = 0
  for (const compound of compounds) {
    const r = computePharmaCompound(compound, scenario)
    totalValueM += r.totalValueM
    valueOnVulnerablePathM += r.valueOnVulnerablePathM ?? 0
    if (r.status === 'exposed-in-scenario') compoundsOnVulnerablePath += 1
    if (r.status === 'path-unknown') compoundsPathUnknown += 1
    rdYearsSaved += r.rdYearsSaved
  }
  return {
    totalValueM: round2(totalValueM),
    valueOnVulnerablePathM: round2(valueOnVulnerablePathM),
    compoundsOnVulnerablePath,
    compoundsPathUnknown,
    rdYearsSaved: round2(rdYearsSaved),
  }
}

// ── Fictional samples ────────────────────────────────────────────────────

/** Visible, editable fictional base year for the sample. */
export const PHARMA_SAMPLE_BASE_YEAR = 2026
/** CRQC planning year the guided exercise asks the learner to set. */
export const PHARMA_EXERCISE_CRQC_YEAR = 2033

export const PHARMA_SAMPLE_SCENARIO: PharmaScenario = {
  baseYear: PHARMA_SAMPLE_BASE_YEAR,
  crqcYear: PHARMA_EXERCISE_CRQC_YEAR,
}

/**
 * The first sample compound, also the case the guided exercise walks through: $800M, 20 years of
 * confidentiality, and the worked 2 + 3 + 7 year step example (12 years in all, 2 omittable).
 */
export const PHARMA_EXERCISE_COMPOUND: PharmaCompoundInput = {
  id: 'compound-1',
  compoundName: 'PQC-7291',
  commercialValueM: 800,
  keyProtection: 'rsa-2048',
  confidentialityYearsRemaining: 20,
  patentExpiryYear: 2046,
  exclusivityEndYear: null,
  steps: [
    {
      id: 'c1-s1',
      name: 'Fictional target-screening work',
      years: 2,
      disclosedRecordAllowsSkip: true,
    },
    { id: 'c1-s2', name: 'Fictional preclinical work', years: 3, disclosedRecordAllowsSkip: false },
    { id: 'c1-s3', name: 'Fictional trials', years: 7, disclosedRecordAllowsSkip: false },
  ],
}

export const DEFAULT_PHARMA_PIPELINE: PharmaCompoundInput[] = [
  PHARMA_EXERCISE_COMPOUND,
  {
    id: 'compound-2',
    compoundName: 'ABX-4415',
    commercialValueM: 3200,
    keyProtection: 'preshared-aes-256',
    confidentialityYearsRemaining: 12,
    patentExpiryYear: 2038,
    exclusivityEndYear: 2043,
    steps: [
      {
        id: 'c2-s1',
        name: 'Fictional formulation work',
        years: 1.5,
        disclosedRecordAllowsSkip: true,
      },
      { id: 'c2-s2', name: 'Fictional trials', years: 5, disclosedRecordAllowsSkip: false },
    ],
  },
  {
    id: 'compound-3',
    compoundName: 'NRO-1182',
    commercialValueM: 5500,
    keyProtection: 'hybrid-x25519-mlkem768',
    confidentialityYearsRemaining: 8,
    patentExpiryYear: 2034,
    exclusivityEndYear: null,
    steps: [
      {
        id: 'c3-s1',
        name: 'Fictional manufacturing scale-up',
        years: 1,
        disclosedRecordAllowsSkip: true,
      },
      {
        id: 'c3-s2',
        name: 'Fictional regulatory review',
        years: 2,
        disclosedRecordAllowsSkip: false,
      },
    ],
  },
]

/**
 * Figures for the guided exercise, produced by the same function the calculator uses, so the
 * exercise text can never disagree with what the calculator shows for the same inputs.
 */
export function computePharmaExerciseFigures(): {
  rsa: PharmaCompoundResult
  preshared: PharmaCompoundResult
  hybrid: PharmaCompoundResult
} {
  const run = (keyProtection: KeyProtectionPath) =>
    computePharmaCompound({ ...PHARMA_EXERCISE_COMPOUND, keyProtection }, PHARMA_SAMPLE_SCENARIO)
  return {
    rsa: run('rsa-2048'),
    preshared: run('preshared-aes-256'),
    hybrid: run('hybrid-x25519-mlkem768'),
  }
}
