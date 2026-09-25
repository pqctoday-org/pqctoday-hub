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
import type { CombinationMode, ConditioningMode } from './sourceCombiningCrypto'

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
  /**
   * True for the source the learner says an adversary may control (Source A
   * in this workshop). Its credit is zeroed when the stated adversary control
   * is 'choose' or 'observe' — see creditedEntropyBits().
   */
  mayBeAdversaryControlled?: boolean
}

export interface CreditOptions {
  /** The learner's statement about the adversary's control over the flagged source. */
  adversaryControl?: AdversaryControl
  /** How the sources' samples are assembled into one bitstring (default: concatenation). */
  assembly?: CombinationMode
}

/**
 * Entropy one source contributes to this request, after the two exclusions:
 *  - a failed source counts 0 (SP 800-90C §3.1 item 4.a.1: entropy collected
 *    by a failed entropy source "shall not be used");
 *  - a source the adversary can choose or observe counts 0 against that
 *    adversary. Bits the adversary picked or has seen are not unpredictable
 *    to it, so they carry no min-entropy for secrecy purposes.
 */
export function sourceCreditBits(
  c: SourceContribution,
  H = DECLARED_MIN_ENTROPY_PER_SAMPLE,
  adversaryControl: AdversaryControl = 'none'
): number {
  if (c.failed) return 0
  if (c.mayBeAdversaryControlled && isAdversaryControlled(adversaryControl)) return 0
  return c.samplesUsed * H
}

/** 'choose' or 'observe' — either one removes the source's entropy against that adversary. */
export function isAdversaryControlled(a: AdversaryControl): boolean {
  return a === 'choose' || a === 'observe'
}

/**
 * Entropy credited to the assembled bitstring for one request, SP 800-90C §2.3
 * Method 1 style. Per-source credit comes from sourceCreditBits(). SP 800-90C
 * §2.6 item 8 sums entropy only for CONCATENATED output of independent
 * sources; for any other assembly (XOR, hash, HMAC) the sum is not justified,
 * so only the largest single source is credited. Independence itself is the
 * learner's to state in assessConstruction().
 */
export function creditedEntropyBits(
  contributions: SourceContribution[],
  H = DECLARED_MIN_ENTROPY_PER_SAMPLE,
  opts: CreditOptions = {}
): number {
  const credits = contributions.map((c) => sourceCreditBits(c, H, opts.adversaryControl))
  const assembly = opts.assembly ?? 'concat'
  if (assembly === 'concat') return credits.reduce((sum, b) => sum + b, 0)
  return credits.reduce((max, b) => Math.max(max, b), 0)
}

// ── Conditioner bounds (plan P0.5 "the conditioner's input and output bounds") ──

/**
 * SP 800-90B §3.1.5.1.1 Table 1: narrowest internal width (nw) and output
 * length (nout) of a vetted conditioning function, instantiated with SHA-256
 * and AES as this workshop does. For CMAC the workshop's 32-byte output is two
 * CMAC calls (a demo construction); only ONE vetted CMAC call — 128 bits — is
 * credited.
 */
export interface ConditionerBound {
  label: string
  outputBits: number
  narrowestWidthBits: number
}

export const VETTED_CONDITIONER_BOUNDS: Record<ConditioningMode, ConditionerBound> = {
  'hash-df': { label: 'Hash_df (SHA-256)', outputBits: 256, narrowestWidthBits: 256 },
  hash: { label: 'SHA-256', outputBits: 256, narrowestWidthBits: 256 },
  hmac: { label: 'HMAC-SHA-256', outputBits: 256, narrowestWidthBits: 256 },
  'aes-cmac': { label: 'AES-CMAC (one call)', outputBits: 128, narrowestWidthBits: 128 },
}

/** log2(2^a + 2^b) without overflow. */
function log2Sum(a: number, b: number): number {
  const hi = Math.max(a, b)
  const lo = Math.min(a, b)
  return hi + Math.log2(1 + Math.pow(2, lo - hi))
}

/** log2(1 − 2^−x) for x > 0. */
function log2OneMinusPow2Neg(x: number): number {
  return Math.log1p(-Math.pow(2, -x)) / Math.LN2
}

/**
 * SP 800-90B §3.1.5.1.2 Output_Entropy(nin, nout, nw, hin), evaluated in log2
 * space so 2^nin never overflows:
 *   1. P_high = 2^−hin, P_low = (1 − P_high) / (2^nin − 1)
 *   2. n = min(nout, nw)
 *   3. ψ = 2^(nin−n)·P_low + P_high
 *   4. U = 2^(nin−n) + sqrt(2n·2^(nin−n)·ln 2)
 *   5. ω = U·P_low
 *   6. return −log2(max(ψ, ω))
 */
export function outputEntropy(nIn: number, nOut: number, nW: number, hIn: number): number {
  const h = Math.min(hIn, nIn)
  if (h <= 0) return 0
  const n = Math.min(nOut, nW)
  const log2PHigh = -h
  const log2PLow = log2OneMinusPow2Neg(h) - (nIn + log2OneMinusPow2Neg(nIn))
  const log2Psi = log2Sum(nIn - n + log2PLow, log2PHigh)
  const log2U = log2Sum(nIn - n, 0.5 * Math.log2(2 * n * Math.LN2) + (nIn - n) / 2)
  const log2Omega = log2U + log2PLow
  return -Math.max(log2Psi, log2Omega)
}

/**
 * Min-entropy credited to ONE conditioned output block. It never exceeds the
 * input entropy (SP 800-90B §3.1.5: "the entropy of the output is at most
 * hin"), the output length, or the vetted-function estimate Output_Entropy
 * (§3.1.5.1.2). Rounded down — the workshop never rounds a credit up.
 */
export function conditionedBlockEntropyBits(
  inputEntropyBits: number,
  inputBits: number,
  bound: ConditionerBound
): number {
  if (inputEntropyBits <= 0) return 0
  const vetted = outputEntropy(
    inputBits,
    bound.outputBits,
    bound.narrowestWidthBits,
    inputEntropyBits
  )
  // 1e-9 absorbs floating-point noise so an exact 256 is not shown as 255.
  return Math.floor(Math.min(inputEntropyBits, bound.outputBits, vetted) + 1e-9)
}

/** What the design delivers to the DRBG as seed material for one instantiation. */
export type SeedMaterial =
  | {
      /** The assembled bitstring itself (SP 800-90C §3.1 Get_entropy_bitstring). */
      kind: 'unconditioned'
      bitstringBits: number
    }
  | {
      /** One conditioned output block from the Step 4 conditioner. */
      kind: 'conditioned-block'
      /** nin: length of the assembled bitstring fed to the conditioner. */
      inputBits: number
      bound: ConditionerBound
    }

export interface EntropyAccount {
  /** Credited to the assembled bitstring (after failure and adversary exclusions). */
  inputEntropyBits: number
  /** Credited to what actually reaches the DRBG. */
  seedEntropyBits: number
}

/** The whole entropy chain for one request: sources → bitstring → seed material. */
export function accountEntropy(
  contributions: SourceContribution[],
  seed: SeedMaterial,
  opts: CreditOptions = {},
  H = DECLARED_MIN_ENTROPY_PER_SAMPLE
): EntropyAccount {
  const inputEntropyBits = creditedEntropyBits(contributions, H, opts)
  const seedEntropyBits =
    seed.kind === 'unconditioned'
      ? Math.min(inputEntropyBits, seed.bitstringBits)
      : conditionedBlockEntropyBits(inputEntropyBits, seed.inputBits, seed.bound)
  return { inputEntropyBits, seedEntropyBits }
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
  /** Adversary's control over the source that may be compromised (Source A). */
  adversaryControl: AdversaryControl
  failureHandling: FailureHandling
  sourceValidation: SourceValidation
  inputFreshness: InputFreshness
  rbgClass: RbgClass
  /**
   * The sources feeding this request. Credit is computed here, not passed in,
   * so the verdict cannot disagree with the stated adversary control.
   */
  sources: SourceContribution[]
  /** How the sources are assembled (SP 800-90C §2.6 item 8 sums only concatenation). */
  assembly: CombinationMode
  /** What reaches the DRBG, with the conditioner's input/output bounds. */
  seed: SeedMaterial
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
  const notes: string[] = []
  const need = instantiateEntropyRequirement(securityStrength)
  const isRbg3 = a.rbgClass === 'RBG3(XOR)' || a.rbgClass === 'RBG3(RS)'
  const { inputEntropyBits, seedEntropyBits } = accountEntropy(a.sources, a.seed, {
    adversaryControl: a.adversaryControl,
    assembly: a.assembly,
  })
  const controlled = a.sources.filter(
    (c) => c.mayBeAdversaryControlled && !c.failed && isAdversaryControlled(a.adversaryControl)
  )

  if (controlled.length > 0) {
    const verb = a.adversaryControl === 'choose' ? 'chooses' : 'can observe'
    const names = controlled.map((c) => c.name).join(' and ')
    notes.push(
      `The adversary ${verb} the output of ${names}, so ${names} is credited 0 bits: output the adversary picked or has seen is not unpredictable to it. Only the other sources count — ${inputEntropyBits} bits.`
    )
  }
  if (a.assembly !== 'concat' && a.sources.filter((c) => !c.failed).length > 1) {
    notes.push(
      'The sources are not concatenated, so their entropy is not summed: SP 800-90C §2.6 item 8 sums entropy only for the concatenated output of independent sources. Only the largest single source is credited.'
    )
  }
  if (a.seed.kind === 'conditioned-block') {
    notes.push(
      `The DRBG receives one conditioned block: ${a.seed.bound.label}, ${a.seed.bound.outputBits}-bit output, from a ${a.seed.inputBits}-bit input carrying ${inputEntropyBits} bits. Conditioning cannot add entropy (SP 800-90B §3.1.5: the output entropy "is at most hin"), and the vetted-function estimate is capped by the output length (§3.1.5.1.2, Table 1), so the block is credited ${seedEntropyBits} bits.`
    )
  }

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
  if (isRbg3 && seedEntropyBits < need) {
    unsafe.push(
      `The design is claimed as ${a.rbgClass}, which must provide full-entropy output, but only ${seedEntropyBits} bits of entropy reach the DRBG — less than the ${need} bits (3s/2, s = ${securityStrength}) SP 800-90C §2.6 item 11 requires just to instantiate it.`
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
  if (!isRbg3 && seedEntropyBits < need) {
    missing.push(
      a.seed.kind === 'conditioned-block'
        ? `Only ${seedEntropyBits} bits of entropy reach the DRBG in one ${a.seed.bound.outputBits}-bit conditioned block; instantiating a DRBG at security strength ${securityStrength} from an entropy source needs at least ${need} bits (3s/2, SP 800-90C §2.6 item 11). One block cannot carry that: SP 800-90C §3.2.2.1 Get_conditioned_input produces as many output blocks as are "required to hold the requested amount of entropy", each from its own entropy request.`
        : `Only ${seedEntropyBits} bits of entropy reach the DRBG; instantiating a DRBG at security strength ${securityStrength} from an entropy source needs at least ${need} bits (3s/2, SP 800-90C §2.6 item 11).`
    )
  }

  if (unsafe.length > 0) return { verdict: 'unsafe', reasons: [...unsafe, ...missing, ...notes] }
  if (missing.length > 0) return { verdict: 'not-enough-evidence', reasons: [...missing, ...notes] }
  return {
    verdict: 'consistent-with-assumptions',
    reasons: [
      ...notes,
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
  assumptions: Omit<
    ConstructionAssumptions,
    'sources' | 'assembly' | 'seed' | 'failedSourceOutputUsed'
  >
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
