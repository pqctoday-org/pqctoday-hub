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

  // For 8-bit samples with min-entropy H, threshold ≈ 1 + ceil(-log2(alpha) / H)
  // Using H=8 (ideal) and alpha=2^-20 (SP 800-90B default): threshold = 1 + ceil(20/8) = 4
  const threshold = Math.max(4, Math.ceil(Math.log2(n)))
  return {
    name: 'Repetition Count',
    value: maxRun,
    passed: maxRun < threshold,
    threshold,
    description: 'Longest repeated byte run should be short',
    detail: `Longest run: ${maxRun} (byte 0x${maxByte.toString(16).padStart(2, '0')}). Threshold: ${threshold}`,
  }
}

/**
 * Min-Entropy Estimate
 * Estimates the minimum entropy per byte based on the most frequent byte value.
 * This is the Most Common Value estimate from SP 800-90B Section 6.3.1.
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
  // Min-entropy = -log2(p_max)
  const minEntropy = pMax > 0 ? -Math.log2(pMax) : 8
  // For good randomness, min-entropy should be close to 8 bits/byte
  const threshold = 6.0 // Minimum acceptable: 6 bits per byte
  return {
    name: 'Min-Entropy',
    value: minEntropy,
    passed: minEntropy >= threshold,
    threshold,
    description:
      'Min-entropy should be close to 8.0 bits per byte. Note: SP 800-90B also utilizes Markov estimates to detect inter-byte dependencies.',
    detail: `Estimated: ${minEntropy.toFixed(2)} bits/byte. Most common byte appeared ${maxCount}/${n} times (p=${pMax.toFixed(4)})`,
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
