// SPDX-License-Identifier: GPL-3.0-only
//
// Shared flow model for the Assess wizard — consumed by BOTH the legacy
// AssessWizard (validators only) and the redesign (orders, domains, copy,
// validators). Keeping the validators here is the single source of truth so the
// two wizards can never drift on what counts as a valid answer.
//
// Index contract: `store.currentStep`, the `?step=` deep link, and analytics
// step numbers are all interpreted in LEGACY_ORDER (the original ALL_STEPS
// sequence). The redesign renders RENDER_ORDER_* (which moves `migration` into
// the readiness block for a contiguous rail) but always maps render-position ↔
// key ↔ legacy index, so both wizards agree on what "step N" means.

import type { AssessDomain } from './tones'

/**
 * Slot props for embedding a legacy step component inside the redesign question
 * pane. The pane supplies the heading/subtitle and the single consolidated
 * assist strip, so the step suppresses its own duplicates — but KEEPS its option
 * grid, escape hatch(es), import-sync toggles and data-workshop-target hooks.
 */
export interface EmbeddedStepProps {
  /** Hide the step's own <h3> question + <p> description (the pane shows them). */
  hideHeading?: boolean
  /** Hide the step's own PersonaHint + WhyWeAskHint (the pane's assist strip shows "Why we ask"). */
  hideHints?: boolean
}

export type AssessStepKey =
  | 'industry'
  | 'country'
  | 'crypto'
  | 'sensitivity'
  | 'compliance'
  | 'migration'
  | 'use-cases'
  | 'retention'
  | 'credential-lifetime'
  | 'scale'
  | 'agility'
  | 'infra'
  | 'timeline'

/** Canonical index space — the original ALL_STEPS order. NEVER reorder this. */
export const LEGACY_ORDER: readonly AssessStepKey[] = [
  'industry',
  'country',
  'crypto',
  'sensitivity',
  'compliance',
  'migration',
  'use-cases',
  'retention',
  'credential-lifetime',
  'scale',
  'agility',
  'infra',
  'timeline',
]

/** Full-track render order — `migration` moved after `credential-lifetime` so
 *  the three domains (profile → exposure → readiness) are contiguous in the rail. */
export const RENDER_ORDER_FULL: readonly AssessStepKey[] = [
  'industry',
  'country',
  'crypto',
  'sensitivity',
  'compliance',
  'use-cases',
  'retention',
  'credential-lifetime',
  'migration',
  'scale',
  'agility',
  'infra',
  'timeline',
]

/** Fast-track render order (6). Deliberately excludes `infra` and `timeline`:
 *  those are extended inputs that flip `hasExtendedInput` true (orchestrator),
 *  which would produce full category scores and defeat the quick/full tiering —
 *  the quick report is meant to leave the per-domain breakdown + progress
 *  tracking locked. Keep this set free of every `hasExtendedInput` field. */
export const RENDER_ORDER_QUICK: readonly AssessStepKey[] = [
  'industry',
  'country',
  'crypto',
  'sensitivity',
  'compliance',
  'migration',
]

export interface AssessStepMeta {
  key: AssessStepKey
  /** Short rail label. */
  label: string
  domain: AssessDomain
  /** Question heading shown in the pane + review. */
  question: string
  subtitle: string
  /** "Why we ask" disclosure copy (consolidates the legacy PersonaHint/WhyWeAsk). */
  why: string
  /** True only for steps whose validator passes with no answer (Skip is shown). */
  freelyOptional: boolean
}

export const STEP_META: Record<AssessStepKey, AssessStepMeta> = {
  industry: {
    key: 'industry',
    label: 'Industry',
    domain: 'profile',
    question: 'What industry are you in?',
    subtitle:
      'Quantum risk varies sharply by sector — this calibrates every downstream recommendation.',
    why: 'Your sector sets the baseline threat model: which data is most targeted, which regulators apply, and how aggressive your peers already are.',
    freelyOptional: false,
  },
  country: {
    key: 'country',
    label: 'Jurisdiction',
    domain: 'profile',
    question: 'Which jurisdiction applies to your organization?',
    subtitle: "Your country's regulatory timeline aligns your migration deadline recommendations.",
    why: 'Regulators set hard PQC dates (CNSA 2.0, BSI, ANSSI…). The jurisdiction decides which deadline drives your roadmap.',
    freelyOptional: false,
  },
  crypto: {
    key: 'crypto',
    label: 'Crypto in use',
    domain: 'exposure',
    question: 'What kinds of cryptography do you use?',
    subtitle:
      'Select all that apply — these map to the quantum-vulnerable algorithms in your estate.',
    why: "Public-key crypto (key exchange & signatures) is broken by Shor's algorithm; symmetric and hashing only need larger parameters. Knowing your mix sizes the migration.",
    freelyOptional: false,
  },
  sensitivity: {
    key: 'sensitivity',
    label: 'Data sensitivity',
    domain: 'exposure',
    question: 'How sensitive is your data?',
    subtitle: 'Select all that apply — your risk is assessed against the highest level present.',
    why: 'Harvest-now-decrypt-later means data captured today is broken once a quantum computer exists. The longer your data must stay secret, the more urgent the migration.',
    freelyOptional: false,
  },
  compliance: {
    key: 'compliance',
    label: 'Compliance',
    domain: 'exposure',
    question: 'Which compliance frameworks apply to you?',
    subtitle:
      'Select any regulatory or compliance frameworks you must adhere to. Skip if unsure — it won’t change your score much.',
    why: 'Frameworks set the hard dates and mandatory algorithms. We surface PQC obligations and deadlines specific to your selections.',
    freelyOptional: true,
  },
  'use-cases': {
    key: 'use-cases',
    label: 'Use cases',
    domain: 'exposure',
    question: 'Where do you use cryptography?',
    subtitle:
      'Select all cryptographic use cases in your organization to prioritize which migrations are most urgent.',
    why: 'Each use case has its own migration path and priority — TLS and VPN move first, niche use cases later. This shapes the ordering in your roadmap.',
    freelyOptional: true,
  },
  retention: {
    key: 'retention',
    label: 'Data retention',
    domain: 'exposure',
    question: 'How long must your data stay confidential?',
    subtitle: 'Select all that apply — HNDL risk is assessed against the longest period.',
    why: 'If encrypted data must stay confidential past the first quantum computer (~2030), adversaries may be harvesting it today for later decryption.',
    freelyOptional: false,
  },
  'credential-lifetime': {
    key: 'credential-lifetime',
    label: 'Credential lifetime',
    domain: 'exposure',
    question: 'How long must your certificates stay trusted?',
    subtitle: 'Select all that apply — HNFL risk is assessed against the longest period.',
    why: 'Root CA certificates issued today with long validity must be trusted past the quantum threat horizon — a primary signature-forgery target.',
    freelyOptional: false,
  },
  migration: {
    key: 'migration',
    label: 'Migration status',
    domain: 'readiness',
    question: 'What is your PQC migration status?',
    subtitle: 'Tells us where to start your plan — discovery, piloting, or scaling.',
    why: 'Your starting point sets the first phase of the roadmap and how much of the plan is foundational vs. execution.',
    freelyOptional: false,
  },
  scale: {
    key: 'scale',
    label: 'Organizational scale',
    domain: 'readiness',
    question: 'What is your organizational scale?',
    subtitle: 'Migration scope and team capacity directly affect timelines and effort.',
    why: 'The ratio of systems to engineers calibrates how aggressive a timeline is realistic and where to invest in automation.',
    freelyOptional: false,
  },
  agility: {
    key: 'agility',
    label: 'Crypto agility',
    domain: 'readiness',
    question: 'How easily can you swap cryptographic algorithms?',
    subtitle:
      'Crypto agility is a major factor in migration complexity. Abstracted implementations migrate far more easily.',
    why: 'Hardcoded algorithms must be found and rewritten everywhere; abstracted ones swap via config. This is the single biggest driver of migration effort.',
    freelyOptional: false,
  },
  infra: {
    key: 'infra',
    label: 'Infrastructure',
    domain: 'readiness',
    question: 'What infrastructure handles your cryptography?',
    subtitle:
      'Select the layers that handle cryptography. HSMs and on-prem are typically the hardest to migrate.',
    why: 'Each layer has a different migration path and difficulty. HSMs and embedded devices often gate the timeline because they replace slowly.',
    freelyOptional: true,
  },
  timeline: {
    key: 'timeline',
    label: 'Timeline pressure',
    domain: 'readiness',
    question: 'Do you have a migration deadline?',
    subtitle: 'Timeline pressure affects how aggressively migration must be prioritized.',
    why: 'A regulatory deadline forces a fixed plan; an internal target gives more latitude. This sets the pace of every roadmap phase.',
    freelyOptional: false,
  },
}

/** Minimal store shape the validators read (the real store satisfies it structurally). */
export interface AssessValidatorState {
  industry: string
  country: string
  currentCryptoCategories: string[]
  cryptoUnknown: boolean
  dataSensitivity: string[]
  sensitivityUnknown: boolean
  migrationStatus: string
  migrationUnknown: boolean
  dataRetention: string[]
  retentionUnknown: boolean
  credentialLifetime: string[]
  credentialLifetimeUnknown: boolean
  systemCount: string
  teamSize: string
  scaleUnknown: boolean
  cryptoAgility: string
  agilityUnknown: boolean
  timelinePressure: string
  timelineUnknown: boolean
}

/**
 * Single source of truth for step validity — extracted verbatim from the legacy
 * AssessWizard ALL_STEPS canProceed predicates. Imported by both wizards.
 */
export const STEP_VALIDATORS: Record<AssessStepKey, (s: AssessValidatorState) => boolean> = {
  industry: (s) => !!s.industry,
  country: (s) => !!s.country,
  crypto: (s) => s.currentCryptoCategories.length > 0 || s.cryptoUnknown,
  sensitivity: (s) => s.dataSensitivity.length > 0 || s.sensitivityUnknown,
  compliance: () => true,
  migration: (s) => !!s.migrationStatus || s.migrationUnknown,
  'use-cases': () => true,
  retention: (s) => s.dataRetention.length > 0 || s.retentionUnknown,
  'credential-lifetime': (s) => s.credentialLifetime.length > 0 || s.credentialLifetimeUnknown,
  scale: (s) => (!!s.systemCount && !!s.teamSize) || s.scaleUnknown,
  agility: (s) => !!s.cryptoAgility || s.agilityUnknown,
  infra: () => true,
  timeline: (s) => !!s.timelinePressure || s.timelineUnknown,
}

/**
 * Steps that support persona/proficiency auto-suggestion of "I'm not sure",
 * categorized by technical depth. Shared by the legacy wizard and the redesign
 * so the auto-prefill behaviour stays identical.
 * - 'technical': auto-suggested for 'curious' AND 'basics' proficiency
 * - 'general': auto-suggested only for 'curious' proficiency
 */
export const PROFICIENCY_SUGGEST_MAP: Record<string, 'technical' | 'general'> = {
  crypto: 'technical',
  scale: 'technical',
  agility: 'technical',
  infra: 'technical',
  sensitivity: 'general',
  compliance: 'general',
  migration: 'general',
  'use-cases': 'general',
  retention: 'general',
  'credential-lifetime': 'general',
  timeline: 'general',
}

export type AssessTrack = 'quick' | 'comprehensive'

/** Render order for a given track (mode). */
export function renderOrderFor(mode: AssessTrack): readonly AssessStepKey[] {
  return mode === 'quick' ? RENDER_ORDER_QUICK : RENDER_ORDER_FULL
}

/** Legacy (canonical) index for a step key — the meaning of `store.currentStep`. */
export function legacyIndexOf(key: AssessStepKey): number {
  return LEGACY_ORDER.indexOf(key)
}

/** Step key at a legacy index (clamped/guarded). */
export function keyAtLegacyIndex(i: number): AssessStepKey | undefined {
  // eslint-disable-next-line security/detect-object-injection
  return LEGACY_ORDER[i]
}

// The meaning of `store.currentStep` is TRACK-RELATIVE, matching the legacy
// wizard: in quick mode it indexes the 8-item quick array (which equals
// RENDER_ORDER_QUICK), in comprehensive mode it indexes the full 13 in
// LEGACY_ORDER (the original ALL_STEPS order). The redesign renders
// RENDER_ORDER_* but reads/writes currentStep through these helpers so the two
// wizards interpret currentStep identically.
function storeOrderFor(mode: AssessTrack): readonly AssessStepKey[] {
  return mode === 'quick' ? RENDER_ORDER_QUICK : LEGACY_ORDER
}

/** The `store.currentStep` value that denotes `key` in the given track. */
export function storeIndexOf(mode: AssessTrack, key: AssessStepKey): number {
  return storeOrderFor(mode).indexOf(key)
}

/** The step key denoted by a `store.currentStep` value in the given track. */
export function keyAtStoreIndex(mode: AssessTrack, idx: number): AssessStepKey | undefined {
  // eslint-disable-next-line security/detect-object-injection
  return storeOrderFor(mode)[idx]
}

/** Per-track question count + time estimate, for chooser + control-deck copy. */
export const TRACK_INFO: Record<AssessTrack, { count: number; minutes: number; label: string }> = {
  quick: { count: RENDER_ORDER_QUICK.length, minutes: 3, label: 'Fast track' },
  comprehensive: { count: RENDER_ORDER_FULL.length, minutes: 5, label: 'Full track' },
}
