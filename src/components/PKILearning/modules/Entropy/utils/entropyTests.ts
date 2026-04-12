// SPDX-License-Identifier: GPL-3.0-only
/**
 * Simplified educational implementations of entropy tests.
 * These are NOT full NIST SP 800-90B implementations — production entropy
 * validation requires the NIST EntropyAssessment tool with > 1M samples.
 */

export interface TestResult {
  name: string
  value: number
  passed: boolean
  threshold: number
  description: string
  detail: string
}

/**
 * Frequency / Monobit Test
 * Counts the proportion of 1-bits in the data.
 * For truly random data, should be close to 50%.
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
  const proportion = ones / total
  const deviation = Math.abs(proportion - 0.5)
  const threshold = 0.05
  return {
    name: 'Frequency (Monobit)',
    value: proportion,
    passed: deviation <= threshold,
    threshold,
    description: 'Proportion of 1-bits should be close to 0.5',
    detail: `${ones} ones out of ${total} bits (${(proportion * 100).toFixed(1)}%). Deviation: ${(deviation * 100).toFixed(2)}%`,
  }
}

/**
 * Runs Test
 * Counts runs of consecutive identical bits. Too few runs suggests
 * the bits are clumped; too many suggests alternation.
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
  }
}

/**
 * Chi-Squared Test (byte-level)
 * Tests whether byte values are uniformly distributed across 0-255.
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
  }
}

/**
 * Repetition Count Test (SP 800-90B health test)
 * Finds the longest run of the same byte value.
 * Long repetitions suggest a stuck-at failure.
 */
export function repetitionCountTest(data: Uint8Array): TestResult {
  const n = data.length
  if (n < 2) {
    return {
      name: 'Repetition Count',
      value: 0,
      passed: false,
      threshold: 0,
      description: 'Need at least 2 bytes',
      detail: 'Insufficient data',
    }
  }

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

  // SP 800-90B §4.4.1: C = ceil(-log2(alpha) / H_min) + 1
  // Using H_min=8 (ideal 8-bit source) and alpha=2^-20 (false-positive rate):
  // C = ceil(20 / 8) + 1 = ceil(2.5) + 1 = 3 + 1 = 4 (fixed; not sample-size-dependent)
  const threshold = 4
  return {
    name: 'Repetition Count',
    value: maxRun,
    passed: maxRun < threshold,
    threshold,
    description:
      'SP 800-90B §4.4.1 health test: longest repeated-byte run must be < C, ' +
      'where C = ceil(-log2(alpha)/H_min) + 1 = 4 (alpha=2^-20, H_min=8 bits).',
    detail: `Longest run: ${maxRun} (byte 0x${maxByte.toString(16).padStart(2, '0')}). C threshold: ${threshold}`,
  }
}

/**
 * Min-Entropy Estimate
 * Estimates a lower bound on min-entropy using the Most Common Value (MCV) estimator
 * from SP 800-90B Section 6.3.1, with the required upper confidence bound on p_max.
 *
 * Formula (§6.3.1): p_hat = min(1, p_max + 2.576 * sqrt(p_max*(1-p_max)/n))
 * Then H_min = -log2(p_hat)
 *
 * Note: SP 800-90B requires ≥ 1,000,000 samples for a statistically valid production
 * estimate. Small samples (< 1,000 bytes) will yield low H_min values even for
 * truly random data due to the confidence correction on p_max.
 */
export function minEntropyEstimate(data: Uint8Array): TestResult {
  const n = data.length
  if (n < 1) {
    return {
      name: 'Min-Entropy',
      value: 0,
      passed: false,
      threshold: 0,
      description: 'Need at least 1 byte',
      detail: 'Insufficient data',
    }
  }

  const counts = new Array(256).fill(0)
  for (const byte of data) {
    counts[byte]++
  }

  const maxCount = Math.max(...counts)
  const pMax = maxCount / n
  // Raw MCV estimate
  const rawEntropy = pMax > 0 ? -Math.log2(pMax) : 8
  // SP 800-90B §6.3.1 upper confidence bound on p_max (z = 2.576 → 99.5% one-tail)
  const pHat = Math.min(1, pMax + 2.576 * Math.sqrt((pMax * (1 - pMax)) / n))
  const minEntropy = pHat < 1 ? -Math.log2(pHat) : 0
  // Production threshold: 6 bits/byte (meaningful only for large sample sets)
  const threshold = 6.0
  const smallSampleWarning =
    n < 1000 ? ' (small sample — estimate unreliable below 1,000 bytes)' : ''
  return {
    name: 'Min-Entropy',
    value: minEntropy,
    passed: minEntropy >= threshold,
    threshold,
    description:
      'SP 800-90B §6.3.1 MCV estimator with upper confidence bound (z=2.576). ' +
      'Target ≥ 6 bits/byte; production assessment requires ≥ 1M samples.',
    detail:
      `Raw: ${rawEntropy.toFixed(2)} bits/byte → bounded: ${minEntropy.toFixed(2)} bits/byte. ` +
      `Most common byte: ${maxCount}/${n} (p_max=${pMax.toFixed(4)}, p_hat=${pHat.toFixed(4)})` +
      smallSampleWarning,
  }
}

/** Run all tests on a data sample */
export function runAllTests(data: Uint8Array): TestResult[] {
  return [
    frequencyTest(data),
    runsTest(data),
    chiSquaredTest(data),
    repetitionCountTest(data),
    minEntropyEstimate(data),
  ]
}
