// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PqcReadinessVerdict, computeScenarios } from './HsmCapacityCalculator'
import {
  USE_CASES,
  CLASSICAL_HSM_DEFAULT,
  PQC_HSM_DEFAULT,
  ORG_PARAM_DEFAULTS,
  deriveUseCaseTps,
} from '@/data/hsmCapacityDefaults'

function stateForMedium() {
  const org = ORG_PARAM_DEFAULTS.medium
  const out: Record<string, { enabled: boolean; tps: number }> = {}
  for (const uc of USE_CASES) {
    out[uc.id] = { enabled: uc.defaultEnabled, tps: deriveUseCaseTps(uc.id, org) }
  }
  return out
}

describe('PqcReadinessVerdict', () => {
  it('reports insufficient today + multiplier when the deployed fleet is undersized', () => {
    const scenarios = computeScenarios({
      useCases: USE_CASES,
      state: stateForMedium(),
      classical: CLASSICAL_HSM_DEFAULT,
      pqc: PQC_HSM_DEFAULT,
      redundancy: 'n+1',
      hsmsPerLocation: { today: 1, tomorrow: 1, upgraded: 1 },
      numLocations: 1,
    })
    render(<PqcReadinessVerdict scenarios={scenarios} numLocations={1} />)
    expect(screen.getByText('insufficient')).toBeInTheDocument()
    expect(screen.getByText(String(scenarios[1].requiredWithRedundancy))).toBeInTheDocument()
    expect(screen.getByText(String(scenarios[2].requiredWithRedundancy))).toBeInTheDocument()
  })

  it('reports sufficient today when deployed meets the requirement', () => {
    const scenarios = computeScenarios({
      useCases: USE_CASES,
      state: stateForMedium(),
      classical: CLASSICAL_HSM_DEFAULT,
      pqc: PQC_HSM_DEFAULT,
      redundancy: 'n+1',
      hsmsPerLocation: { today: 10, tomorrow: 1, upgraded: 1 },
      numLocations: 1,
    })
    render(<PqcReadinessVerdict scenarios={scenarios} numLocations={1} />)
    expect(screen.getByText('sufficient')).toBeInTheDocument()
  })
})
