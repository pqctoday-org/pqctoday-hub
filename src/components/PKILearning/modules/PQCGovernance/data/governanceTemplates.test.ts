// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { COMPENSATING_CONTROLS } from './governanceTemplates'

describe('compensating control: shorter key lifetime', () => {
  const control = COMPENSATING_CONTROLS.find((c) => c.id === 'key-rotation')

  it('is a risk-based cryptoperiod choice, not a fixed monthly rule', () => {
    expect(control).toBeDefined()
    expect(control?.description).not.toMatch(/Rotate monthly instead of annually/)
    expect(control?.description).toMatch(/Choose the period from risk/)
    expect(control?.description).toMatch(/SP 800-57 Part 1 Rev\. 5, Sec\. 5\.3\.1/)
  })

  it('does not claim to remove the exposure of data already recorded under a vulnerable key exchange', () => {
    expect(control?.description).not.toMatch(/minimize HNDL exposure window/)
    expect(control?.description).toMatch(/already recorded under a quantum-vulnerable key exchange/)
    expect(control?.description).toMatch(/complements PQC or hybrid protection/)
  })
})
