// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  USE_CASES,
  SIZE_PRESETS,
  ORG_PARAM_DEFAULTS,
  deriveUseCaseTps,
  type DeploymentSize,
} from './hsmCapacityDefaults'

describe('HSM capacity defaults — estimation narrative drift guard', () => {
  it.each(USE_CASES.map((uc) => [uc.id, uc] as const))(
    '%s: "math" narrative TPS matches defaultTps.medium',
    (_id, uc) => {
      const match = uc.estimation.math.match(/At medium \(([\d,]+) TPS\)/)
      expect(match, `${uc.id}: math string must start "At medium (N TPS)"`).not.toBeNull()
      const narrativeTps = Number(match![1].replace(/,/g, ''))
      expect(narrativeTps).toBe(uc.defaultTps.medium)
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
