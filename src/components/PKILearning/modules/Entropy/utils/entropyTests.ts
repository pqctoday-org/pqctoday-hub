// SPDX-License-Identifier: GPL-3.0-only
/**
 * Simplified educational checks for the Entropy module.
 *
 * Results belong to one of four groups that must never be merged into a single
 * "entropy tests passed" verdict (Entropy remediation plan P0.4, 2026-09-24):
 *
 *   1. 'visualization' — SP 800-22-style output statistics (monobit/frequency,
 *      runs, chi-squared). They describe a buffer; they cannot show that its
 *      source is unpredictable. A seeded LCG passes them.
 *   2. 'health' — the two approved SP 800-90B §4.4 continuous health tests
 *      (Repetition Count §4.4.1, Adaptive Proportion §4.4.2). They are defined
 *      on raw noise-source samples, before conditioning (§4.3 item 6).
 *   3. 'estimator' — SP 800-90B entropy estimators. NOT run here: one
 *      re-implemented estimator on a small buffer is not an SP 800-90B
 *      assessment. The module's evidence workshop runs the NIST tool.
 *   4. 'kat' — algorithm known-answer tests (e.g. the HMAC_DRBG vectors in
 *      hmacDrbg.test.ts, the SHA-256/HMAC self-checks). They show an algorithm
 *      is computed correctly and say nothing about entropy.
 *
 * Every result carries `sampleLimit`: what that result cannot show at the
 * sample size it was computed on.
 */

export type TestGroup = 'visualization' | 'health' | 'estimator' | 'kat'

export const TEST_GROUP_LABELS: Record<TestGroup, string> = {
  visualization: 'Visual checks (SP 800-22-style output statistics)',
  health: 'SP 800-90B health tests (§4.4)',
  estimator: 'SP 800-90B entropy estimators',
  kat: 'Algorithm known-answer tests',
}

/**
 * Wording for a result's state, per group. A group-1 "pass" is only "within
 * range" (not a security verdict); a group-2 failure is a health-test signal.
 */
export const TEST_GROUP_STATUS: Record<TestGroup, { ok: string; bad: string }> = {
  visualization: { ok: 'Within range', bad: 'Outside range' },
  health: { ok: 'No failure signalled', bad: 'Failure signalled' },
  estimator: { ok: 'Estimate made', bad: 'Not run' },
  kat: { ok: 'Matched', bad: 'Mismatch' },
}

export interface TestResultGroup {
  group: TestGroup
  label: string
  results: TestResult[]
}

/**
 * Split results into their groups (in TestGroup order, empty groups dropped)
 * so a component renders each group on its own — never one combined count.
 */
export function groupResults(results: TestResult[]): TestResultGroup[] {
  const order: TestGroup[] = ['visualization', 'health', 'estimator', 'kat']
  return order
    .map((group) => ({
      group,
      label: TEST_GROUP_LABELS[group],
      results: results.filter((r) => r.group === group),
    }))
    .filter((g) => g.results.length > 0)
}

export interface TestResult {
  name: string
  value: number
  /** Within the check's cutoff. For group 'visualization' this is NOT a security verdict. */
  passed: boolean
  threshold: number
  description: string
  detail: string
  group: TestGroup
  /** What this result cannot show at this sample size — shown next to the result. */
  sampleLimit: string
}

/** Minimum consecutive samples for SP 800-90B startup health testing (§4.3 item 4). */
export const SP800_90B_STARTUP_SAMPLES = 1024

/** Minimum sequential dataset for SP 800-90B entropy estimation (§3.1.1 item 1). */
export const SP800_90B_MIN_SEQUENTIAL_SAMPLES = 1_000_000

/** Default false-positive probability used in SP 800-90B §4.4's worked values. */
export const SP800_90B_DEFAULT_ALPHA = 2 ** -20

function visualizationLimit(nBits: number): string {
  return (
    `Computed on ${nBits} bits. An output-statistics check only: passing does not show ` +
    'unpredictability (a seeded LCG or Math.random() output usually passes), and failing on ' +
    'a sample this small can be chance. Not an SP 800-90B test.'
  )
}

function healthLimit(n: number, H: number): string {
  const startup =
    n < SP800_90B_STARTUP_SAMPLES
      ? ` This buffer has ${n} samples, fewer than the ${SP800_90B_STARTUP_SAMPLES} consecutive samples SP 800-90B §4.3 item 4 requires for startup testing.`
      : ` This buffer has ${n} samples.`
  return (
    `Treats each byte as one raw noise-source sample with an assumed min-entropy of H = ${H} ` +
    'bits/sample (a declared assumption, not a measurement). SP 800-90B health tests run on raw ' +
    'noise-source samples before conditioning (§4.3 item 6); on DRBG or conditioned output this ' +
    'is a demonstration only. A pass is not an entropy estimate.' +
    startup
  )
}

/**
 * Frequency / Monobit check (group 1, SP 800-22-style).
 * Counts the proportion of 1-bits in the data; for uniform data it is near 0.5.
 */
export function frequencyTest(data: Uint8Array): TestResult {
  let ones = 0
  let total = 0
  for (const byte of data) {
    for (let bit = 0; bit < 8; bit++) {
      if ((byte >> bit) & 1) ones++
      total++
    }
  }
  const proportion = total > 0 ? ones / total : 0
  const deviation = Math.abs(proportion - 0.5)
  const threshold = 0.05
  return {
    name: 'Frequency (Monobit)',
    value: proportion,
    passed: total > 0 && deviation <= threshold,
    threshold,
    description: 'Proportion of 1-bits should be close to 0.5',
    detail: `${ones} ones out of ${total} bits (${(proportion * 100).toFixed(1)}%). Deviation: ${(deviation * 100).toFixed(2)}%`,
    group: 'visualization',
    sampleLimit: visualizationLimit(total),
  }
}

/**
 * Runs check (group 1, SP 800-22-style).
 * Counts runs of consecutive identical bits. Too few runs suggests the bits are
 * clumped; too many suggests alternation.
 */
export function runsTest(data: Uint8Array): TestResult {
  const bits: number[] = []
  for (const byte of data) {
    for (let bit = 7; bit >= 0; bit--) {
      bits.push((byte >> bit) & 1)
    }
  }
  const n = bits.length
  if (n < 2) {
    return {
      name: 'Runs Test',
      value: 0,
      passed: false,
      threshold: 0,
      description: 'Need at least 2 bits',
      detail: 'Insufficient data',
      group: 'visualization',
      sampleLimit: visualizationLimit(n),
    }
  }

  let runs = 1
  for (let i = 1; i < n; i++) {
    if (bits[i] !== bits[i - 1]) runs++
  }

  const ones = bits.reduce((s, b) => s + b, 0)
  const pi = ones / n
  // Expected runs for random data
  const expectedRuns = 1 + 2 * n * pi * (1 - pi)
  const stddev = Math.sqrt(2 * n * pi * (1 - pi))
  const zScore = stddev > 0 ? Math.abs(runs - expectedRuns) / stddev : Infinity
  const threshold = 2.576 // 99% confidence
  return {
    name: 'Runs Test',
    value: zScore,
    passed: zScore <= threshold,
    threshold,
    description: 'Number of runs should match expected for random data',
    detail: `${runs} runs observed (expected ~${expectedRuns.toFixed(0)}). Z-score: ${zScore.toFixed(2)}`,
    group: 'visualization',
    sampleLimit: visualizationLimit(n),
  }
}

/**
 * Chi-squared check (group 1, byte-level).
 * Tests whether byte values are spread evenly across 0-255.
 * For small samples (< 128 bytes), groups into 16 bins instead of 256.
 */
export function chiSquaredTest(data: Uint8Array): TestResult {
  const n = data.length
  if (n < 16) {
    return {
      name: 'Chi-Squared',
      value: 0,
      passed: false,
      threshold: 0,
      description: 'Need at least 16 bytes',
      detail: 'Insufficient data',
      group: 'visualization',
      sampleLimit: visualizationLimit(n * 8),
    }
  }

  // Use 16 bins for small samples, 256 for large
  const useBins = n < 128 ? 16 : 256
  const counts = new Array(useBins).fill(0)

  if (useBins === 16) {
    // Group into 16 bins (each bin covers 16 byte values)
    for (const byte of data) {
      counts[byte >> 4]++
    }
  } else {
    for (const byte of data) {
      counts[byte]++
    }
  }

  const expected = n / useBins
  let chiSq = 0
  for (const count of counts) {
    chiSq += (count - expected) ** 2 / expected
  }

  // Degrees of freedom = bins - 1
  const df = useBins - 1
  // Approximate critical value at p=0.01 using Wilson-Hilferty approximation
  const z = 2.326 // z for p=0.01
  const criticalValue = df * (1 - 2 / (9 * df) + z * Math.sqrt(2 / (9 * df))) ** 3

  return {
    name: 'Chi-Squared',
    value: chiSq,
    passed: chiSq <= criticalValue,
    threshold: criticalValue,
    description: `Byte distribution should be uniform across ${useBins} bins`,
    detail: `χ² = ${chiSq.toFixed(2)} (critical value: ${criticalValue.toFixed(2)}, df = ${df}, ${useBins} bins)`,
    group: 'visualization',
    sampleLimit: visualizationLimit(n * 8),
  }
}

/**
 * Repetition Count Test cutoff — SP 800-90B §4.4.1:
 *   C = 1 + ceil(-log2(alpha) / H)
 * "the smallest integer satisfying the inequality alpha >= 2^(-H(C-1))".
 */
export function rctCutoff(assumedMinEntropy: number, alpha = SP800_90B_DEFAULT_ALPHA): number {
  return 1 + Math.ceil(-Math.log2(alpha) / assumedMinEntropy)
}

/**
 * Repetition Count Test — SP 800-90B §4.4.1 (group 2).
 * Signals a failure when a sample value is repeated C or more times in a row.
 */
export function repetitionCountTest(
  data: Uint8Array,
  assumedMinEntropy = 8,
  alpha = SP800_90B_DEFAULT_ALPHA
): TestResult {
  const n = data.length
  const H = Math.max(0.01, Math.min(8, assumedMinEntropy))
  if (n < 2) {
    return {
      name: 'Repetition Count',
      value: 0,
      passed: false,
      threshold: 0,
      description: 'Need at least 2 bytes',
      detail: 'Insufficient data',
      group: 'health',
      sampleLimit: healthLimit(n, H),
    }
  }

  // §4.4.1 steps 1-5: B counts consecutive identical samples; fail when B >= C.
  let maxRun = 1
  let currentRun = 1
  let maxByte = data[0]

  for (let i = 1; i < n; i++) {
    if (data[i] === data[i - 1]) {
      currentRun++
      if (currentRun > maxRun) {
        maxRun = currentRun
        maxByte = data[i]
      }
    } else {
      currentRun = 1
    }
  }

  const threshold = rctCutoff(H, alpha)
  const log2Alpha = -Math.log2(alpha)
  return {
    name: 'Repetition Count',
    value: maxRun,
    passed: maxRun < threshold,
    threshold,
    description:
      'SP 800-90B §4.4.1 health test: fails when a sample repeats C or more times in a row, ' +
      `C = 1 + ceil(-log2(alpha)/H) = ${threshold} (alpha=2^-${log2Alpha}, H=${H} bits/sample).`,
    detail: `Longest run: ${maxRun} (byte 0x${maxByte.toString(16).padStart(2, '0')}). C threshold: ${threshold}`,
    group: 'health',
    sampleLimit: healthLimit(n, H),
  }
}

/**
 * Smallest C such that Pr[Binomial(w, p) >= C] <= alpha.
 *
 * SP 800-90B §4.4.2 defines the APT cutoff as 1 + CRITBINOM(W, 2^-H, 1 - alpha).
 * Computed here by summing the binomial PMF in log space: at W = 1024 the
 * direct factorial form overflows a double long before the tail gets small,
 * so the terms are built with log-gamma and exponentiated one at a time.
 */
function binomialCutoff(w: number, p: number, alpha: number): number {
  // lgamma via Lanczos — accurate to ~15 significant digits over this range,
  // which is far more than a cutoff rounded to an integer needs.
  const lgamma = (x: number): number => {
    const g = [
      676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059,
      12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
    ]
    if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lgamma(1 - x)
    const z = x - 1
    let a = 0.99999999999980993
    const t = z + 7.5
    for (let i = 0; i < g.length; i++) a += g[i] / (z + i + 1)
    return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(a)
  }
  const logChoose = (n: number, k: number) => lgamma(n + 1) - lgamma(k + 1) - lgamma(n - k + 1)

  const lp = Math.log(p)
  const lq = Math.log1p(-p)
  // Walk down from the top so the accumulated tail is monotonically increasing
  // and we can stop at the first C whose tail exceeds alpha.
  let tail = 0
  for (let k = w; k >= 0; k--) {
    tail += Math.exp(logChoose(w, k) + k * lp + (w - k) * lq)
    if (tail > alpha) return Math.min(w, k + 1)
  }
  return 1
}

/** APT window size — SP 800-90B §4.4.2: 1024 for a binary noise source, 512 otherwise. */
export function aptWindowSize(binary: boolean): number {
  return binary ? 1024 : 512
}

/** Adaptive Proportion Test cutoff — SP 800-90B §4.4.2 (Pr(B >= C) <= alpha). */
export function aptCutoff(
  windowSize: number,
  assumedMinEntropy: number,
  alpha = SP800_90B_DEFAULT_ALPHA
): number {
  return binomialCutoff(windowSize, 2 ** -assumedMinEntropy, alpha)
}

/**
 * Adaptive Proportion Test — SP 800-90B §4.4.2 (group 2).
 *
 * Where Repetition Count catches a source that gets *stuck* on one value, this
 * catches one that merely becomes *biased* toward a value without repeating it
 * consecutively. It counts, within a window, how often the window's first
 * sample recurs, and fails if that count reaches the cutoff.
 *
 * Byte samples are non-binary, so W = 512 (§4.4.2). Until 2026-09-24 this used
 * W = 1024, the binary-source window.
 */
export function adaptiveProportionTest(
  data: Uint8Array,
  assumedMinEntropy = 8,
  alpha = SP800_90B_DEFAULT_ALPHA,
  binary = false
): TestResult {
  const W = aptWindowSize(binary)
  const n = data.length
  const H = Math.max(0.1, Math.min(binary ? 1 : 8, assumedMinEntropy))
  const window = Math.min(W, n)

  if (n < 2) {
    return {
      name: 'Adaptive Proportion',
      value: 0,
      passed: false,
      threshold: 0,
      description: 'Need at least 2 bytes',
      detail: 'Insufficient data',
      group: 'health',
      sampleLimit: healthLimit(n, H),
    }
  }

  const cutoff = aptCutoff(window, H, alpha)

  // Non-overlapping windows, each re-anchored on its own first sample (§4.4.2).
  let worstCount = 0
  let worstValue = data[0]
  let windows = 0
  for (let start = 0; start + window <= n; start += window) {
    const a = data[start]
    let count = 0
    for (let i = start; i < start + window; i++) if (data[i] === a) count++
    windows++
    if (count > worstCount) {
      worstCount = count
      worstValue = a
    }
  }
  if (windows === 0) {
    // Shorter than one full window — score the partial window rather than
    // silently reporting a pass on data we never examined.
    const a = data[0]
    let count = 0
    for (let i = 0; i < n; i++) if (data[i] === a) count++
    worstCount = count
    worstValue = a
    windows = 1
  }

  const shortSample =
    n < W
      ? ` (partial window — ${n} of ${W} samples; cutoff recomputed for ${n}, so this is not the §4.4.2 test as specified)`
      : ''
  const log2Alpha = -Math.log2(alpha)
  return {
    name: 'Adaptive Proportion',
    value: worstCount,
    passed: worstCount < cutoff,
    threshold: cutoff,
    description:
      `SP 800-90B §4.4.2 health test: within a ${window}-sample window (W = ${W} for a ` +
      `${binary ? 'binary' : 'non-binary'} source), the first sample must recur fewer than C ` +
      `times, C = 1 + CRITBINOM(W, 2^-H, 1-alpha) (H=${H} bits, alpha=2^-${log2Alpha}).`,
    detail:
      `Worst window: byte 0x${worstValue.toString(16).padStart(2, '0')} seen ` +
      `${worstCount}/${window} times across ${windows} window${windows === 1 ? '' : 's'}. ` +
      `C threshold: ${cutoff}${shortSample}`,
    group: 'health',
    sampleLimit: healthLimit(n, H),
  }
}

/** Group 1 — SP 800-22-style output statistics. */
export function runVisualizationChecks(data: Uint8Array): TestResult[] {
  return [frequencyTest(data), runsTest(data), chiSquaredTest(data)]
}

/** Group 2 — the two approved SP 800-90B §4.4 continuous health tests. */
export function runHealthTests(
  samples: Uint8Array,
  assumedMinEntropy = 8,
  alpha = SP800_90B_DEFAULT_ALPHA
): TestResult[] {
  return [
    repetitionCountTest(samples, assumedMinEntropy, alpha),
    adaptiveProportionTest(samples, assumedMinEntropy, alpha),
  ]
}

/** True when any §4.4 health test in the list signalled a failure. */
export function healthTestsFailed(results: TestResult[]): boolean {
  return results.some((r) => r.group === 'health' && !r.passed)
}

/**
 * Groups 1 and 2 on one buffer, each result tagged with its group.
 *
 * Kept for the components that show every check in one table; they must not
 * total the results into one verdict. Group 3 (SP 800-90B estimators) is not
 * computed anywhere in this file, on purpose, and group 4 (KATs) lives with
 * the algorithms it checks.
 */
export function runAllTests(data: Uint8Array): TestResult[] {
  return [...runVisualizationChecks(data), ...runHealthTests(data)]
}
