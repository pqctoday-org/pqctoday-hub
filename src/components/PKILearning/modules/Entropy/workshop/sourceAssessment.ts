// SPDX-License-Identifier: GPL-3.0-only
/**
 * Pure logic behind the Combining Sources workshop (Entropy remediation plan
 * P0.3 and P0.5, 2026-09-24).
 *
 * P0.3 — health tests belong at the raw-source boundary. SP 800-90B §4.3 item 6:
 * "Health tests shall be performed on the noise source samples before any
 * conditioning is done." A stuck or biased source must be caught HERE, because
 * after a hash or HMAC its output looks random (see sourceAssessment.test.ts).
 *
 * P0.5 — no "remains secure" conclusion. assessConstruction() turns the
 * learner's stated assumptions into one of three outcomes, and the best one is
 * only "consistent with the stated assumptions" — never "secure" or "valid".
 */
import {
  healthTestsFailed,
  runHealthTests,
  SP800_90B_STARTUP_SAMPLES,
  type TestResult,
} from '../utils/entropyTests'

// ── Simulated raw noise sources ─────────────────────────────────────────────

export type RawSourceCondition = 'healthy' | 'stuck' | 'biased'

/**
 * Declared min-entropy per 8-bit raw sample for both simulated sources. It is
 * an assumption the learner is told about, not a measurement; it sets the
 * health-test cutoffs (SP 800-90B §4.4: RCT C = 6, APT W = 512 → C = 62).
 */
export const DECLARED_MIN_ENTROPY_PER_SAMPLE = 4

/** Samples drawn from each source for one entropy request. */
export const SAMPLES_PER_REQUEST = 64

/** DRBG security strength the workshop seeds for (bits). */
export const TARGET_SECURITY_STRENGTH = 256

/**
 * SP 800-90C §2.6 item 11: instantiating a DRBG with security strength s from an
 * entropy source "requires at least 3s/2 bits of min-entropy".
 */
export function instantiateEntropyRequirement(securityStrength: number): number {
  return (3 * securityStrength) / 2
}

/**
 * SP 800-90C §3.2.2.2: each use of the conditioning function that yields
 * output_len full-entropy bits needs output_len + 64 bits of entropy.
 */
export function fullEntropyConditioningRequirement(outputLenBits: number): number {
  return outputLenBits + 64
}

export const BIASED_VALUE = 0x5a

/**
 * Produce `n` simulated raw 8-bit samples. `randomBytes` supplies the stand-in
 * noise (the browser CSPRNG in the UI, a fixed generator in tests).
 *   healthy — the stand-in bytes as they are;
 *   stuck   — every sample 0x00 (a stuck-at failure);
 *   biased  — every 4th sample is 0x5A and no two neighbours are equal, so the
 *             Repetition Count Test sees nothing and only the Adaptive
 *             Proportion Test can catch it.
 */
export function simulateRawSamples(
  condition: RawSourceCondition,
  n: number,
  randomBytes: (n: number) => Uint8Array
): Uint8Array {
  if (condition === 'stuck') return new Uint8Array(n)
  const r = randomBytes(n)
  if (condition === 'healthy') return r
  const out = new Uint8Array(n)
  for (let i = 0; i < n; i++) {
    let v = i % 4 === 0 ? BIASED_VALUE : r[i]
    if (i % 4 !== 0 && v === BIASED_VALUE) v = BIASED_VALUE + 1
    if (i > 0 && v === out[i - 1]) v = (v + 2) & 0xff
    out[i] = v
  }
  return out
}

export interface RawSourceHealth {
  /** Startup test over the first 1,024 samples (SP 800-90B §4.3 item 4). */
  startup: TestResult[]
  /** Continuous tests over every sample produced so far (startup + request). */
  continuous: TestResult[]
  failed: boolean
}

/** Run SP 800-90B §4.4 health tests on a source's RAW samples, before conditioning. */
export function assessRawSource(
  allSamples: Uint8Array,
  H = DECLARED_MIN_ENTROPY_PER_SAMPLE
): RawSourceHealth {
  const startup = runHealthTests(allSamples.slice(0, SP800_90B_STARTUP_SAMPLES), H)
  const continuous = runHealthTests(allSamples, H)
  return {
    startup,
    continuous,
    failed: healthTestsFailed(startup) || healthTestsFailed(continuous),
  }
}

export interface SourceContribution {
  name: string
  failed: boolean
  samplesUsed: number
}

/**
 * Entropy credited to one request, SP 800-90C §2.3 Method 1 style: only sources
 * that have not reported a failure are counted (§3.1 item 4.a.1 — entropy
 * collected by a failed source "shall not be used"). Summing across sources
 * is valid only for independent sources (§2.6 item 8); that assumption is the
 * learner's to state in assessConstruction().
 */
export function creditedEntropyBits(
  contributions: SourceContribution[],
  H = DECLARED_MIN_ENTROPY_PER_SAMPLE
): number {
  return contributions.filter((c) => !c.failed).reduce((sum, c) => sum + c.samplesUsed * H, 0)
}

// ── Assumption-driven assessment (P0.5) ─────────────────────────────────────

export type Independence = 'independent' | 'correlated' | 'unknown'
export type AdversaryControl = 'none' | 'observe' | 'choose' | 'unknown'
export type FailureHandling = 'detected-excluded' | 'undetected' | 'unknown'
export type SourceValidation = 'validated' | 'not-validated' | 'unknown'
export type InputFreshness = 'fresh' | 'repeated' | 'stale-remote'
export type RbgClass = 'RBG1' | 'RBG2(P)' | 'RBG2(NP)' | 'RBG3(XOR)' | 'RBG3(RS)' | 'RBGC' | 'none'

/** SP 800-90C (September 2025) construction classes, Table 1. */
export const SP800_90C_CLASSES: RbgClass[] = [
  'RBG1',
  'RBG2(P)',
  'RBG2(NP)',
  'RBG3(XOR)',
  'RBG3(RS)',
  'RBGC',
]

export interface ConstructionAssumptions {
  independence: Independence
  /** Adversary's control over the source that may be compromised. */
  adversaryControl: AdversaryControl
  failureHandling: FailureHandling
  sourceValidation: SourceValidation
  inputFreshness: InputFreshness
  rbgClass: RbgClass
  /** Min-entropy credited to the conditioner input (from the pipeline). */
  creditedEntropyBits: number
  /** Did output from a source that failed its health tests feed the conditioner? */
  failedSourceOutputUsed: boolean
}

export type Verdict = 'unsafe' | 'not-enough-evidence' | 'consistent-with-assumptions'

export interface Assessment {
  verdict: Verdict
  reasons: string[]
}

export const VERDICT_LABELS: Record<Verdict, string> = {
  unsafe: 'Construction is unsafe',
  'not-enough-evidence': 'Not enough evidence',
  'consistent-with-assumptions': 'Consistent with the stated assumptions — not a validation',
}

/**
 * Judge a combined-source construction from its stated assumptions. The worst
 * finding wins: any 'unsafe' reason makes the verdict unsafe; otherwise any
 * missing evidence makes it 'not-enough-evidence'.
 */
export function assessConstruction(
  a: ConstructionAssumptions,
  securityStrength = TARGET_SECURITY_STRENGTH
): Assessment {
  const unsafe: string[] = []
  const missing: string[] = []
  const need = instantiateEntropyRequirement(securityStrength)
  const isRbg3 = a.rbgClass === 'RBG3(XOR)' || a.rbgClass === 'RBG3(RS)'

  if (a.failedSourceOutputUsed) {
    unsafe.push(
      'Output from a source that failed its health tests was conditioned and used. SP 800-90C §3.1 (item 4.a.1): entropy collected by a failed entropy source shall not be used. Its conditioned output looks random anyway — that is why the tests sit before conditioning.'
    )
  }
  if (a.failureHandling === 'undetected') {
    unsafe.push(
      'A source failure would not be detected, so a dead source would keep feeding the RBG as if healthy. SP 800-90B §4.3 requires health tests on the raw samples and a reported error when they fail.'
    )
  }
  if (a.inputFreshness === 'repeated') {
    unsafe.push(
      'The same input is reused (for example, a fixed seed at every boot). Identical seed material gives an identical DRBG state and identical output; there is no fresh entropy to credit.'
    )
  }
  if (a.adversaryControl === 'choose' && a.independence !== 'independent') {
    unsafe.push(
      'Malicious cancellation: an adversary who chooses one source’s output while seeing the other can cancel it — with XOR, choosing A = B makes A ⊕ B all zeros. The surviving source’s entropy is not preserved against this adversary.'
    )
  }
  if (isRbg3 && a.creditedEntropyBits < need) {
    unsafe.push(
      `The design is claimed as ${a.rbgClass}, which must provide full-entropy output, but only ${a.creditedEntropyBits} bits of entropy are credited — less than the ${need} bits (3s/2, s = ${securityStrength}) SP 800-90C §2.6 item 11 requires just to instantiate the DRBG.`
    )
  }

  if (a.independence === 'correlated') {
    missing.push(
      'The sources are correlated, so their entropy cannot be added. SP 800-90C §2.6 item 8 sums entropy only for independent sources, and item 1 defines independence as non-overlapping security boundaries.'
    )
  } else if (a.independence === 'unknown') {
    missing.push(
      'Independence of the sources is not established, so the entropy of the two inputs cannot be summed (SP 800-90C §2.6 item 8).'
    )
  }
  if (a.adversaryControl === 'unknown') {
    missing.push('The adversary’s control over the compromised source is not stated.')
  }
  if (a.failureHandling === 'unknown') {
    missing.push('How a source failure is detected and handled is not stated.')
  }
  if (a.sourceValidation !== 'validated') {
    missing.push(
      'The entropy sources are not validated. SP 800-90C §2.6 item 2: validated SP 800-90B entropy sources provide seed material; output of non-validated entropy sources is only used in a personalization string or as additional input.'
    )
  }
  if (a.inputFreshness === 'stale-remote') {
    missing.push(
      'The input includes stale data fetched from a remote service. It may have been observed or replayed in transit, and a non-validated remote source cannot be credited as entropy (SP 800-90C §2.6 item 2).'
    )
  }
  if (a.rbgClass === 'none') {
    missing.push(
      'No SP 800-90C construction class is named (RBG1, RBG2(P), RBG2(NP), RBG3(XOR), RBG3(RS) or RBGC), so there is no set of requirements to check the design against.'
    )
  } else if (a.rbgClass === 'RBG1') {
    missing.push(
      'RBG1 has no internal entropy source and no reseeding (SP 800-90C Table 1); it is seeded once from another RBG. A design that combines live entropy sources is not an RBG1.'
    )
  }
  if (!isRbg3 && a.creditedEntropyBits < need) {
    missing.push(
      `Only ${a.creditedEntropyBits} bits of entropy are credited; instantiating a DRBG at security strength ${securityStrength} from an entropy source needs at least ${need} bits (3s/2, SP 800-90C §2.6 item 11).`
    )
  }

  if (unsafe.length > 0) return { verdict: 'unsafe', reasons: [...unsafe, ...missing] }
  if (missing.length > 0) return { verdict: 'not-enough-evidence', reasons: missing }
  return {
    verdict: 'consistent-with-assumptions',
    reasons: [
      'Nothing in the stated assumptions contradicts the design. Each assumption still needs evidence: an Entropy Validation Certificate for each source, algorithm validation for the DRBG, and — for the SP 800-90C construction — a Random Bit Generator Validation Certificate (FIPS 140-3 IG D.T). This workshop provides none of them.',
    ],
  }
}

// ── Counterexamples ─────────────────────────────────────────────────────────

export type CounterexampleId =
  | 'stuck-detected'
  | 'failed-source-conditioned'
  | 'correlated'
  | 'malicious-cancellation'
  | 'repeated-input'
  | 'stale-remote'

export interface Counterexample {
  id: CounterexampleId
  label: string
  story: string
  /** Condition of simulated Source A for this scenario. */
  sourceA: RawSourceCondition
  /** Whether Source A's samples are used even if its health tests fail. */
  useFailedSource: boolean
  assumptions: Omit<ConstructionAssumptions, 'creditedEntropyBits' | 'failedSourceOutputUsed'>
}

const BASE: Counterexample['assumptions'] = {
  independence: 'independent',
  adversaryControl: 'none',
  failureHandling: 'detected-excluded',
  sourceValidation: 'not-validated',
  inputFreshness: 'fresh',
  rbgClass: 'RBG2(P)',
}

export const COUNTEREXAMPLES: Counterexample[] = [
  {
    id: 'stuck-detected',
    label: 'Stuck source, detected',
    story:
      'Source A sticks at 0x00. The raw-sample health tests catch it and its samples are excluded. Only Source B is credited.',
    sourceA: 'stuck',
    useFailedSource: false,
    assumptions: { ...BASE },
  },
  {
    id: 'failed-source-conditioned',
    label: 'Conditioned output from a failed source',
    story:
      'Source A is biased, but the design ignores the failed health test and conditions A’s samples anyway. The conditioned output passes the visual checks.',
    sourceA: 'biased',
    useFailedSource: true,
    assumptions: { ...BASE, failureHandling: 'undetected' },
  },
  {
    id: 'correlated',
    label: 'Correlated sources',
    story:
      'Both "sources" are fed from the same underlying generator inside one boundary, so they are not independent.',
    sourceA: 'healthy',
    useFailedSource: false,
    assumptions: { ...BASE, independence: 'correlated' },
  },
  {
    id: 'malicious-cancellation',
    label: 'Malicious cancellation',
    story:
      'An attacker controls Source A and can see Source B. With XOR combining, choosing A = B cancels everything.',
    sourceA: 'healthy',
    useFailedSource: false,
    assumptions: { ...BASE, independence: 'correlated', adversaryControl: 'choose' },
  },
  {
    id: 'repeated-input',
    label: 'Repeated fixed input',
    story: 'A device image ships with the same "entropy" bytes, reused at every boot.',
    sourceA: 'healthy',
    useFailedSource: false,
    assumptions: { ...BASE, inputFreshness: 'repeated' },
  },
  {
    id: 'stale-remote',
    label: 'Stale remote data',
    story:
      'Source B is a cached response from a remote randomness API, fetched hours ago over the network.',
    sourceA: 'healthy',
    useFailedSource: false,
    assumptions: { ...BASE, inputFreshness: 'stale-remote' },
  },
]
