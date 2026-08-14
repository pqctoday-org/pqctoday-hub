// SPDX-License-Identifier: GPL-3.0-only
//
// `?req=` — the requires_pqc narrowing the Industry Landscape tile links with.
// Parsing is tested here; that the register actually renders fewer instruments
// is a browser check, not a unit one (see the plan's step 7).

import { describe, expect, it } from 'vitest'
import { renderHook } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import type { ReactNode } from 'react'
import { useComplianceUrlState } from './useComplianceUrlState'

function at(url: string) {
  return renderHook(() => useComplianceUrlState(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <MemoryRouter initialEntries={[url]}>{children}</MemoryRouter>
    ),
  })
}

describe('?req= (requires_pqc narrowing)', () => {
  it('parses a comma list into values', () => {
    const { result } = at('/compliance?tab=standards&req=yes,expected,partial')
    expect(result.current.reqFilter).toEqual(['yes', 'expected', 'partial'])
  })

  it('is empty when absent — no narrowing, the whole register', () => {
    const { result } = at('/compliance?tab=standards')
    expect(result.current.reqFilter).toEqual([])
  })

  it('tolerates whitespace and trailing commas', () => {
    const { result } = at('/compliance?req=yes,%20expected,')
    expect(result.current.reqFilter).toEqual(['yes', 'expected'])
  })

  it('does not collide with ?pqc=, which filters product-record algorithms', () => {
    // Same page, different corpus: `pqc` is an algorithm multi-select on
    // Product Records. Reusing it for requires_pqc would have cross-wired the
    // two tabs' filters.
    const { result } = at('/compliance?req=yes&pqc=ML-KEM-768')
    expect(result.current.reqFilter).toEqual(['yes'])
    expect(result.current.recPqc).toEqual(['ML-KEM-768'])
  })
})
