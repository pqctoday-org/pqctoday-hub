// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Synthetic in-page mathematical wave generator for Workshop Step 3
 * (Synthetic Trace Learning Lab).
 *
 * Generates purely synthetic toy curves inside the browser to illustrate how
 * trace count, clock jitter, and masking order affect classical fixed-window
 * template separation versus a toy shift-tolerant classifier indicator.
 *
 * SAFETY: Contains NO real-device trace data, NO STM32/ChipWhisperer parameters,
 * and NO trained ML model or weights artefact.
 */

export interface SyntheticTraceComparison {
  readonly sampleWaveA: readonly number[]
  readonly sampleWaveB: readonly number[]
  readonly templateScore: number
  readonly learnedScore: number
  readonly interpretation: string
}

/** Deterministic PRNG for reproducible synthetic in-page waveforms */
function pseudoNoise(seed: number, idx: number): number {
  const x = Math.sin(seed * 12.9898 + idx * 78.233) * 43758.5453
  return (x - Math.floor(x)) * 2 - 1
}

export function generateSyntheticTraceComparison(params: {
  jitter: number // 0..8 synthetic samples
  maskingOrder: 1 | 2 | 3
  traceCount: number // 50..1000
}): SyntheticTraceComparison {
  const { jitter, maskingOrder, traceCount } = params
  const points = 24
  const shiftA = Math.round(jitter * 0.4)
  const shiftB = -Math.round(jitter * 0.5)

  const sampleWaveA: number[] = []
  const sampleWaveB: number[] = []
  for (let i = 0; i < points; i++) {
    const posA = i - shiftA
    const posB = i - shiftB
    const signalA = Math.exp(-Math.pow((posA - 10) / 3, 2)) * (1.2 / maskingOrder)
    const signalB = Math.exp(-Math.pow((posB - 10) / 3, 2)) * (0.4 / maskingOrder)
    sampleWaveA.push(Number((signalA + 0.12 * pseudoNoise(1, i)).toFixed(3)))
    sampleWaveB.push(Number((signalB + 0.12 * pseudoNoise(2, i)).toFixed(3)))
  }

  // Toy analytical scores illustrating sensitivity to misalignment & masking order
  const traceFactor = Math.min(1, Math.log10(Math.max(50, traceCount)) / 3)
  const maskingPenalty = maskingOrder === 1 ? 1 : maskingOrder === 2 ? 0.62 : 0.38
  const jitterPenaltyTemplate = Math.max(0.08, 1 - jitter * 0.12)
  const jitterPenaltyLearned = Math.max(0.32, 1 - jitter * 0.045)

  const templateScore = Math.round(
    Math.min(99, Math.max(5, 92 * traceFactor * maskingPenalty * jitterPenaltyTemplate))
  )
  const learnedScore = Math.round(
    Math.min(99, Math.max(8, 95 * traceFactor * maskingPenalty * jitterPenaltyLearned))
  )

  let interpretation =
    'With zero jitter and 1st-order masking, both the fixed-window template indicator and the shift-tolerant classifier indicator separate the synthetic waves easily.'
  if (jitter >= 4 && maskingOrder === 1) {
    interpretation =
      'Clock jitter smears fixed time-window alignment, dropping the naive template score while a shift-tolerant feature remains more resilient—illustrating the intuition behind Cagli et al. (AI-4.1).'
  } else if (maskingOrder >= 2) {
    interpretation =
      'Higher masking order lowers single-point signal amplitude exponentially, requiring substantially more traces and multivariate feature combination before either toy indicator rises—consistent with Wang et al. (AI-4.2) and PROACT 2025 (AI-4.4).'
  }

  return {
    sampleWaveA,
    sampleWaveB,
    templateScore,
    learnedScore,
    interpretation,
  }
}
