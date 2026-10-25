// SPDX-License-Identifier: AGPL-3.0-only
//
// The seeding sentence on the DRBG page follows NIST SP 800-90C section 2.2 and Table 1: an RBG2
// or RBG3 seeds its DRBG from validated entropy sources, but an RBG1 has no entropy source and is
// seeded once by another RBG (an RBG2(P), an RBG3 or a root RBGC). The old sentence said every
// DRBG's seed material comes from entropy sources validated against SP 800-90B.
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'

vi.mock('@/hooks/useHSM', () => ({
  useHSM: () => ({
    phase: 'idle',
    error: null,
    moduleRef: { current: null },
    hSessionRef: { current: 0 },
    initialize: () => undefined,
  }),
}))

import { DrbgArchitectureDemo } from './DrbgArchitectureDemo'

describe('DrbgArchitectureDemo: SP 800-90C seeding sentence', () => {
  it('separates RBG2/RBG3 (entropy sources) from RBG1 (seeded once by another RBG)', () => {
    render(
      <MemoryRouter>
        <DrbgArchitectureDemo />
      </MemoryRouter>
    )
    const text = (document.body.textContent ?? '').replace(/\s+/g, ' ')
    expect(text).toContain(
      'In SP 800-90C (section 2.2, Table 1) an RBG2 or RBG3 seeds its DRBG from entropy sources validated under SP 800-90B; an RBG1 is seeded once by another RBG (an RBG2(P), an RBG3 or a root RBGC).'
    )
    expect(screen.queryByText(/expects seed material for a DRBG/)).not.toBeInTheDocument()
    expect(text).not.toContain('expects seed material')
  })
})
