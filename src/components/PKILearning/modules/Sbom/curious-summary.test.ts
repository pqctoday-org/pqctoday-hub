// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import curiousSummary from './curious-summary.md?raw'
import curiousSummaryVariant from './curious-summary-curious.md?raw'

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

  it('does not claim SBOM completeness or make it a mandatory/complete CBOM input', () => {
    expect(flat).toContain('coverage depends on how the SBOM is generated')
    expect(flat).toContain('one useful input to a Cryptography Bill of Materials')
    expect(flat).toContain('not a mandatory prerequisite')
    expect(flat).not.toMatch(/every package and library a product depends on/i)
    expect(flat).not.toMatch(/a required input to a Cryptography Bill of Materials/i)
    expect(flat).not.toMatch(/with one, it's a search/i)
  })

  it('does not present VEX as proof of exploitability or non-exploitability', () => {
    expect(flat).toContain(
      'neither an SBOM nor VEX alone proves exploitability or non-exploitability'
    )
    expect(flat).not.toMatch(/so a listed vulnerability doesn't trigger a false alarm/i)
  })
})

describe('SBOM curious summary scope', () => {
  const variant = curiousSummaryVariant.replace(/\s+/g, ' ')

  it('does not promise a complete package list or immediate impact determination', () => {
    expect(variant).toContain("within the inventory's stated scope")
    expect(variant).toContain('can help teams search where it may be present')
    expect(variant).not.toMatch(/every component a product is built from/i)
    expect(variant).not.toMatch(/in minutes instead of weeks/i)
  })

  it('does not state that SBOM or VEX alone proves exploitability', () => {
    expect(variant).toContain('neither one alone proves exploitability')
    expect(variant).toContain('not a complete inventory by itself')
  })
})
