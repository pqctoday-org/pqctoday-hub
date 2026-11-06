// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import curiousSummary from './curious-summary.md?raw'

const flat = curiousSummary.replace(/\s+/g, ' ')

describe('SBOM topic summary: the 2026 minimum elements', () => {
  it('says the update is not a strict superset of the 2021 baseline', () => {
    expect(flat).toMatch(/It is not a strict superset/)
  })

  it('separates new, renamed or redefined, and removed elements', () => {
    // new
    expect(flat).toMatch(/Ten elements are new: SBOM Author Signature/)
    expect(flat).toMatch(/Component Hash Algorithm and Component License/)
    // renamed or redefined
    expect(flat).toMatch(/Supplier Name became Component Producer/)
    expect(flat).toMatch(/Author of SBOM Data became SBOM Author/)
    expect(flat).toMatch(/Other Unique Identifiers became Component Identifiers/)
    expect(flat).toMatch(/Version of the Component became Component Version/)
    expect(flat).toMatch(/Depth became Coverage/)
    // removed
    expect(flat).toMatch(/Access Control, whose considerations move into Distribution and Delivery/)
    expect(flat).toMatch(/SWID tags dropped/)
  })

  it('does not claim that the update removes nothing', () => {
    expect(flat).not.toMatch(/removes nothing/i)
    expect(flat).not.toMatch(/nothing is removed/i)
  })
})
