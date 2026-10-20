// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  USE_CASES,
  ALGO_LABELS,
  SIZE_PRESETS,
  ORG_PARAM_DEFAULTS,
  deriveUseCaseTps,
  type DeploymentSize,
} from './hsmCapacityDefaults'

describe('HSM capacity defaults — estimation narrative drift guard', () => {
  it.each(USE_CASES.map((uc) => [uc.id, uc] as const))(
    '%s: narrative exposes each operation in the underlying recipes',
    (_id, uc) => {
      for (const recipe of [uc.classicalOps, uc.pqcOps]) {
        for (const [algo, count] of Object.entries(recipe)) {
          expect(uc.estimation.math).toContain(
            `${count} × ${ALGO_LABELS[algo as keyof typeof ALGO_LABELS]}`
          )
        }
      }
      expect(uc.estimation.rationale).toContain('Fictional per-site workload')
      expect(uc.estimation.math).toContain('per-site TPS')
    }
  )

  it.each(USE_CASES.map((uc) => [uc.id, uc] as const))(
    '%s: defaultTps.medium matches deriveUseCaseTps(ORG_PARAM_DEFAULTS.medium)',
    (_id, uc) => {
      expect(deriveUseCaseTps(uc.id, ORG_PARAM_DEFAULTS.medium)).toBe(uc.defaultTps.medium)
    }
  )

  it.each((['small', 'medium', 'large'] as DeploymentSize[]).map((s) => [s] as const))(
    'SIZE_PRESETS.aggregateTps (%s) matches the sum of derived default TPS',
    (size) => {
      const sum = USE_CASES.reduce(
        (s, uc) => s + deriveUseCaseTps(uc.id, ORG_PARAM_DEFAULTS[size]),
        0
      )
      const preset = SIZE_PRESETS.find((p) => p.id === size)!
      expect(preset.aggregateTps).toBe(sum)
    }
  )
})
