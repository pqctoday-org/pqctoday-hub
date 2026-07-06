// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TpsToHsmExplainer, computeScenarios } from './HsmCapacityCalculator'
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

describe('TpsToHsmExplainer — per-site figures must match the scenario cards', () => {
  it.each([1, 5])('at numLocations=%d, R/N+1/2N/total agree with computeScenarios', (L) => {
    const scenarios = computeScenarios({
      useCases: USE_CASES,
      state: stateForMedium(),
      classical: CLASSICAL_HSM_DEFAULT,
      pqc: PQC_HSM_DEFAULT,
      redundancy: 'n+1',
      hsmsPerLocation: { today: 1, tomorrow: 1, upgraded: 1 },
      numLocations: L,
    })
    const worst = scenarios.reduce((m, s) => (s.requiredRaw > m.requiredRaw ? s : m), scenarios[0])

    render(<TpsToHsmExplainer scenarios={scenarios} redundancy="n+1" numLocations={L} />)

    // Step 3 ("Replicate per location") must state R = worst.perLocationRaw, not a
    // location-divided figure — this is the regression guard for the A2 bug where the
    // explainer divided requiredRaw by numLocations, disagreeing with the scenario cards.
    expect(screen.getAllByText(`R = ${worst.perLocationRaw}`).length).toBeGreaterThan(0)

    const nPlus1 = worst.perLocationRaw + 1

    // Total fleet for the N+1 box must equal L × (perLocationRaw + 1).
    expect(
      screen.getByText(`Total fleet = ${L} × ${nPlus1} = ${L * nPlus1} HSMs`)
    ).toBeInTheDocument()

    // Cross-check against the actual scenario result used elsewhere in the UI.
    expect(L * nPlus1).toBe(worst.requiredWithRedundancy)
  })
})
