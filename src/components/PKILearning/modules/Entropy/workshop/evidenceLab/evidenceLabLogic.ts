// SPDX-License-Identifier: GPL-3.0-only
/**
 * Pure logic for the Entropy Evidence Lab (SP 800-90B) workshop step.
 *
 * Nothing here runs the estimators; it reads the NIST tool's own JSON output
 * (via the W3 result record) and turns it into the numbers a learner needs:
 *
 * - every estimator's value (literal and bit-string);
 * - the most conservative one, which SP 800-90B §6.2 takes as the assessment
 *   ("the minimum of all the estimates is taken as the entropy assessment");
 * - the restart-test outcome (§3.1.4.2);
 * - the RCT / APT cutoffs that estimate implies (§4.4.1 / §4.4.2), computed by
 *   the module's existing entropyTests.ts maths — never a second copy;
 * - the strongest conclusion the evidence allows. The conclusion can always
 *   end in "insufficient evidence", and conditioned/DRBG output never yields a
 *   noise-source claim.
 *
 * Wording rule (plan §1 items 5 and 9): an estimate is "estimator output for
 * this dataset under the recorded conditions" — never validated, certified or
 * compliant, and the tool's JSON is never called an ESV format.
 */
import type { NistToolJson } from '@/wasm/entropy90b/resultRecord'
import {
  aptCutoff,
  aptWindowSize,
  rctCutoff,
  SP800_90B_DEFAULT_ALPHA,
} from '../../utils/entropyTests'

export type Track = 'non-iid' | 'iid'
export type Flat = Record<string, number | boolean | string>

/**
 * The tool JSON flattened to "<testCaseDesc> / <field>" keys, exactly as
 * scripts/entropy-90b/parity.ts `testCaseValues()` does, so a live run and the
 * pinned native reference compare key by key.
 */
export function flattenToolJson(json: NistToolJson | null): Flat {
  const out: Flat = {}
  if (!json) return out
  if (json.errorLevel !== 0) out.error = String(json.errorMessage ?? json.errorLevel)
  for (const tc of json.testCases ?? []) {
    for (const [k, v] of Object.entries(tc)) {
      if (k === 'testCaseDesc' || typeof v === 'object') continue
      out[`${tc.testCaseDesc} / ${k}`] = v as number | boolean | string
    }
  }
  return out
}

// ── Estimators ───────────────────────────────────────────────────────────────

/** Field that carries an estimator's per-sample (literal) result. */
const LITERAL_FIELDS = ['hOriginal', 'tTupleRes', 'lrsRes'] as const
/** Field that carries its per-bit (bit-string) result; × bits per sample. */
const BITSTRING_FIELDS = ['hBitstring', 'binTTupleRes', 'binLrsRes'] as const

export interface EstimatorRow {
  estimator: string
  /** Per-sample estimate on the original symbols (H_original), or null. */
  literal: number | null
  /** Per-bit estimate on the bit string (H_bitstring), or null. */
  bitstring: number | null
  /** bitstring × bits per sample, i.e. the per-sample figure it implies. */
  bitstringPerSample: number | null
}

function num(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

/**
 * One row per estimator in tool order. The "Overall" row and bookkeeping fields
 * (mode, p-hat, dataWordSize, …) are excluded.
 */
export function estimatorRows(flat: Flat, bitsPerSymbol: number): EstimatorRow[] {
  const order: string[] = []
  const rows = new Map<string, EstimatorRow>()
  for (const [key, value] of Object.entries(flat)) {
    const i = key.lastIndexOf(' / ')
    if (i < 0) continue
    const desc = key.slice(0, i)
    const field = key.slice(i + 3)
    if (desc === 'Overall') continue
    const isLit = (LITERAL_FIELDS as readonly string[]).includes(field)
    const isBit = (BITSTRING_FIELDS as readonly string[]).includes(field)
    if (!isLit && !isBit) continue
    const name = desc === '' ? 'Most Common Value (IID track)' : desc
    if (!rows.has(name)) {
      order.push(name)
      rows.set(name, { estimator: name, literal: null, bitstring: null, bitstringPerSample: null })
    }
    const row = rows.get(name)!
    const n = num(value)
    if (isLit) row.literal = n
    else {
      row.bitstring = n
      row.bitstringPerSample = n === null ? null : n * bitsPerSymbol
    }
  }
  return order.map((k) => rows.get(k)!)
}

export interface MinSelection {
  /** min over every literal estimate and every bit-string estimate × n. */
  h: number
  bindingEstimator: string
  bindingKind: 'literal' | 'bitstring'
  /** hAssessed as the tool itself reported it (Overall / hAssessed), if any. */
  toolH: number | null
  /** true when our minimum and the tool's hAssessed agree. */
  agreesWithTool: boolean
}

/**
 * SP 800-90B §3.1.3 / §6.2: H_I = min(H_original, n × H_bitstring) with the
 * minimum taken over every estimator. Recomputed here from the rows so the
 * learner sees WHICH estimator binds, then cross-checked against the tool.
 */
export function selectMinimum(rows: EstimatorRow[], toolH: number | null): MinSelection | null {
  let best: MinSelection | null = null
  const consider = (h: number | null, est: string, kind: 'literal' | 'bitstring') => {
    if (h === null) return
    if (!best || h < best.h)
      best = {
        h,
        bindingEstimator: est,
        bindingKind: kind,
        toolH,
        agreesWithTool: false,
      }
  }
  for (const r of rows) {
    consider(r.literal, r.estimator, 'literal')
    consider(r.bitstringPerSample, r.estimator, 'bitstring')
  }
  if (!best) return null
  const sel = best as MinSelection
  sel.agreesWithTool =
    toolH !== null && Math.abs(sel.h - toolH) <= 1e-12 * Math.max(1, Math.abs(toolH))
  return sel
}

/** The tool's own overall figure from a flattened non-IID or IID result. */
export function toolAssessed(flat: Flat): number | null {
  return num(flat['Overall / hAssessed']) ?? num(flat[' / hAssessed'])
}

/** IID track: did the tool's IID tests (chi-square, LRS, permutation) all pass? */
export function iidTestsPassed(flat: Flat): boolean | null {
  const keys = [
    'passedChiSquareTests',
    'passedLongestRepeatedSubstringTest',
    'passedIidPermutationTests',
  ]
  const vals = keys.map((k) => flat[` / ${k}`])
  if (vals.every((v) => v === undefined)) return null
  return vals.every((v) => v === true)
}

// ── Native reference comparison ──────────────────────────────────────────────

export interface ReferenceComparison {
  compared: number
  identical: number
  diffs: Array<{ field: string; live: unknown; reference: unknown }>
  /** Every compared field is bit-identical. */
  matches: boolean
}

/**
 * Compare a live flattened result against the pinned native reference, field
 * by field with Object.is (bit-exact for doubles). Only the reference's keys
 * are compared: for the IID track the reference holds the deterministic fields
 * only, because the permutation test is randomised by the tool.
 */
export function compareWithReference(live: Flat, reference: Flat): ReferenceComparison {
  const diffs: ReferenceComparison['diffs'] = []
  let compared = 0
  for (const [field, ref] of Object.entries(reference)) {
    compared++
    const v = live[field]
    if (!Object.is(v, ref)) diffs.push({ field, live: v, reference: ref })
  }
  return {
    compared,
    identical: compared - diffs.length,
    diffs,
    matches: compared > 0 && !diffs.length,
  }
}

// ── Restart test (§3.1.4) ────────────────────────────────────────────────────

export interface RestartEvaluation {
  status: 'passed' | 'sanity-check-failed' | 'validation-failed' | 'error'
  hI: number
  hR: number | null
  hC: number | null
  /** min(H_r, H_c, H_I) when the restart tests pass; otherwise null. */
  h: number | null
  message: string
}

/**
 * SP 800-90B §3.1.4.2: the sanity check (§3.1.4.3) must pass; then
 * "If the minimum of Hr and Hc is less than half of HI, the validation fails,
 * and no entropy estimate is awarded. Otherwise, the entropy assessment of the
 * noise source is taken as the minimum of the row, the column and the initial
 * estimates, i.e., min(Hr, Hc, HI)."
 */
export function evaluateRestart(json: NistToolJson | null, hI: number): RestartEvaluation {
  if (!json)
    return {
      status: 'error',
      hI,
      hR: null,
      hC: null,
      h: null,
      message: 'The tool wrote no result.',
    }
  if (json.errorLevel !== 0) {
    const msg = json.errorMessage ?? `error level ${json.errorLevel}`
    return {
      status: /sanity/i.test(msg) ? 'sanity-check-failed' : 'error',
      hI,
      hR: null,
      hC: null,
      h: null,
      message: msg,
    }
  }
  const flat = flattenToolJson(json)
  const hR = num(flat['Overall / h_r'])
  const hC = num(flat['Overall / h_c'])
  if (hR === null || hC === null)
    return { status: 'error', hI, hR, hC, h: null, message: 'The tool reported no H_r / H_c.' }
  if (Math.min(hR, hC) < hI / 2)
    return {
      status: 'validation-failed',
      hI,
      hR,
      hC,
      h: null,
      message: `min(H_r, H_c) = ${fmt(Math.min(hR, hC))} is less than H_I / 2 = ${fmt(hI / 2)}.`,
    }
  const h = Math.min(hR, hC, hI)
  return {
    status: 'passed',
    hI,
    hR,
    hC,
    h,
    message: `Sanity check and validation test passed; min(H_r, H_c, H_I) = ${fmt(h)}.`,
  }
}

// ── Health-test cutoffs (§4.4) ───────────────────────────────────────────────

export interface HealthCutoffs {
  h: number
  alpha: number
  /** Repetition Count Test cutoff C (§4.4.1). */
  rct: number
  /** Adaptive Proportion Test window W (§4.4.2): 1024 binary, 512 otherwise. */
  aptWindow: number
  /** Adaptive Proportion Test cutoff C (§4.4.2). */
  apt: number
}

/**
 * The cutoffs an estimate implies, from utils/entropyTests.ts (the module's
 * single implementation of the §4.4 maths). Returns null when no entropy was
 * awarded: a cutoff for H = 0 is meaningless.
 */
export function healthCutoffs(
  h: number | null,
  bitsPerSymbol: number,
  alpha = SP800_90B_DEFAULT_ALPHA
): HealthCutoffs | null {
  if (h === null || !(h > 0)) return null
  const W = aptWindowSize(bitsPerSymbol === 1)
  return { h, alpha, rct: rctCutoff(h, alpha), aptWindow: W, apt: aptCutoff(W, h, alpha) }
}

// ── Conclusion ───────────────────────────────────────────────────────────────

export type Verdict =
  | 'estimate-for-dataset'
  | 'insufficient-evidence'
  | 'no-entropy-awarded'
  | 'not-noise-source-evidence'

export const VERDICT_LABELS: Record<Verdict, string> = {
  'estimate-for-dataset': 'Estimator output supports an estimate for this dataset',
  'insufficient-evidence': 'Insufficient evidence',
  'no-entropy-awarded': 'No entropy awarded — a required test failed',
  'not-noise-source-evidence': 'Not evidence about a noise source',
}

export type CaseProvenance = 'device-raw-noise' | 'conditioned-output-contrast' | 'synthetic'

export interface SequentialOutcome {
  status: 'not-run' | 'ok' | 'error'
  /** Minimum of the estimators (or the IID-track MCV result). */
  h: number | null
  errorMessage?: string
  /** The tool's own sha256 of the input equals the dataset hash. */
  hashConfirmed: boolean
  /** IID track only: chi-square, LRS and permutation tests all passed. */
  iidTestsPassed?: boolean | null
}

export interface ConclusionInput {
  provenance: CaseProvenance
  /** Synthetic cases only: SHA-256-conditioned output (hides a failed source). */
  syntheticConditioned?: boolean
  track: Track
  sequential: SequentialOutcome
  /** The lab has a restart matrix for this case. */
  restartAvailable: boolean
  /** null = restart test not run (yet). */
  restart: RestartEvaluation | null
}

export interface Conclusion {
  verdict: Verdict
  /** The per-sample estimate the verdict rests on, when it rests on one. */
  h: number | null
  reasons: string[]
  limits: string[]
}

const DEVICE_LIMITS = [
  'One dataset, one device, one recorded condition. Other temperatures, loads, voltages, clock settings, kernels or boards are different operating conditions and need their own data.',
  "The 8 least-significant bits of each time delta were kept (mask FF, upstream's default). A different mask is a different analysis, and at most 8 bits per sample can ever be credited.",
  'No submitter estimate (H_submitter) from a design analysis or stochastic model of the noise source is part of this lab, so H_I here is min(H_original, n × H_bitstring) only.',
  "jitterentropy's restart procedure re-allocates the collector inside one process; it is not a reboot or power cycle.",
  'Health tests were not implemented or observed on the device; the cutoffs shown are what this estimate would imply.',
  'This is estimator output for a teaching dataset. It is not an ESV submission, a lab analysis, a CMVP review or any certificate.',
]

/**
 * The strongest conclusion the evidence in the lab supports. It returns
 * 'estimate-for-dataset' only for raw device noise on the non-IID track with a
 * sequential estimate AND a passed restart test; every other path ends in a
 * weaker verdict, including "insufficient evidence".
 */
export function concludeEvidence(input: ConclusionInput): Conclusion {
  const { provenance, sequential: seq, restart } = input
  const reasons: string[] = []

  if (provenance === 'conditioned-output-contrast') {
    reasons.push(
      'This is conditioned/DRBG output. SP 800-90B assesses raw noise-source samples; an estimate on generator output says nothing about the noise source behind it, however high it is.'
    )
    if (seq.status === 'ok' && seq.h !== null)
      reasons.push(
        `The estimators reported ${fmt(seq.h)} bits per sample — output that "passes" is still not evidence about a noise source.`
      )
    return { verdict: 'not-noise-source-evidence', h: null, reasons, limits: [] }
  }

  if (provenance === 'synthetic') {
    const failed =
      seq.status === 'error' ||
      restart?.status === 'sanity-check-failed' ||
      restart?.status === 'validation-failed'
    if (input.syntheticConditioned) {
      reasons.push(
        'SHA-256 over a stuck (zero-entropy) input plus a counter. Conditioning hides a failed source: the output looks random while carrying no entropy at all.'
      )
      return { verdict: 'not-noise-source-evidence', h: null, reasons, limits: [] }
    }
    if (failed) {
      reasons.push(
        seq.status === 'error'
          ? `The tool awarded no entropy: ${seq.errorMessage ?? 'error'}`
          : `The restart test failed: ${restart?.message ?? ''}`
      )
      return { verdict: 'no-entropy-awarded', h: null, reasons, limits: [] }
    }
    reasons.push(
      'Synthetic data from a deterministic generator. Any estimate describes this generated file, not an entropy source: whoever knows the seed predicts every sample.'
    )
    return { verdict: 'not-noise-source-evidence', h: null, reasons, limits: [] }
  }

  // Raw device noise.
  const limits = [...DEVICE_LIMITS]
  if (seq.status === 'not-run') {
    reasons.push('No estimator has been run on this dataset yet.')
    return { verdict: 'insufficient-evidence', h: null, reasons, limits }
  }
  if (seq.status === 'error') {
    reasons.push(`The tool awarded no entropy: ${seq.errorMessage ?? 'error'}`)
    return { verdict: 'no-entropy-awarded', h: null, reasons, limits }
  }
  if (!seq.hashConfirmed) {
    reasons.push(
      "The tool's own SHA-256 of the input does not match the dataset hash, so the result cannot be tied to this dataset."
    )
    return { verdict: 'insufficient-evidence', h: null, reasons, limits }
  }
  if (input.track === 'iid') {
    if (seq.iidTestsPassed === false)
      reasons.push(
        'The IID tests rejected the IID assumption, so the IID track does not apply (SP 800-90B §3.1.2). Re-run on the non-IID track.'
      )
    else
      reasons.push(
        'The IID track also needs the submitter’s IID claim with a design rationale (SP 800-90B §3.1.2 item 1) and IID tests on the restart row and column datasets. No such rationale exists for these jitter samples, so the lab cannot accept an IID-track estimate.'
      )
    return { verdict: 'insufficient-evidence', h: null, reasons, limits }
  }
  if (!input.restartAvailable) {
    reasons.push(
      'No restart matrix for this dataset is in the lab, and SP 800-90B §3.1.4 requires the restart tests before any estimate stands. The sequential result is an initial estimate (H_I) only.'
    )
    return { verdict: 'insufficient-evidence', h: null, reasons, limits }
  }
  if (!restart) {
    reasons.push(
      'The restart test (SP 800-90B §3.1.4) has not been run. Without it the sequential result is an initial estimate (H_I) only.'
    )
    return { verdict: 'insufficient-evidence', h: null, reasons, limits }
  }
  if (restart.status === 'sanity-check-failed' || restart.status === 'validation-failed') {
    reasons.push(
      `Restart test failed: ${restart.message} No entropy estimate is awarded (§3.1.4.2).`
    )
    return { verdict: 'no-entropy-awarded', h: null, reasons, limits }
  }
  if (restart.status !== 'passed' || restart.h === null) {
    reasons.push(`The restart run did not complete: ${restart.message}`)
    return { verdict: 'insufficient-evidence', h: null, reasons, limits }
  }
  reasons.push(
    `Non-IID estimators on the sequential dataset gave H_I = ${fmt(restart.hI)}; the restart tests passed with H_r = ${fmt(restart.hR!)} and H_c = ${fmt(restart.hC!)}.`,
    `Estimator output for this dataset under the recorded conditions: min(H_r, H_c, H_I) = ${fmt(restart.h)} bits per 8-bit sample.`
  )
  return { verdict: 'estimate-for-dataset', h: restart.h, reasons, limits }
}

export interface VerdictCheck {
  ok: boolean
  message: string
}

/** Check the learner's chosen verdict against the one the evidence allows. */
export function checkLearnerVerdict(chosen: Verdict, allowed: Verdict): VerdictCheck {
  if (chosen === allowed)
    return { ok: true, message: 'Your conclusion matches what the evidence supports.' }
  if (allowed === 'estimate-for-dataset' && chosen === 'insufficient-evidence')
    return {
      ok: true,
      message:
        'Acceptable and conservative: the evidence would support an estimate for this dataset, but claiming less is never wrong.',
    }
  if (chosen === 'estimate-for-dataset')
    return {
      ok: false,
      message: `That claims more than the evidence supports. The evidence supports: "${VERDICT_LABELS[allowed]}".`,
    }
  return {
    ok: false,
    message: `The evidence supports a different conclusion: "${VERDICT_LABELS[allowed]}".`,
  }
}

export function fmt(h: number, digits = 4): string {
  return h.toFixed(digits)
}
