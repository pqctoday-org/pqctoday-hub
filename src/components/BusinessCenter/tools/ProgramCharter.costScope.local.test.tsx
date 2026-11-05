// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { ProgramCharter } from './ProgramCharter'

describe('charter costing guidance stays within a scoped teaching example', () => {
  it('retains cost categories and editable budget inputs without unsupported observed-spending claims', () => {
    const { container } = render(
      <MemoryRouter>
        <ProgramCharter />
      </MemoryRouter>
    )
    const text = container.textContent!
    expect(text).toContain('discovery & inventory tooling')
    expect(text).toContain('HSM/hardware refresh')
    expect(text).toContain(
      'system counts, supplier pricing, staffing, delivery schedule and stated assumptions'
    )
    expect(text).toContain('not observed programme spending or a supplier quote')
    expect(text).not.toMatch(
      /firmware upgrades alone|typically runs|has run on the order|300M|500K|50 FTEs/
    )
    expect(screen.getByLabelText('Year 1 budget')).toBeEnabled()
    expect(screen.getByLabelText('Multi-year commitment')).toBeEnabled()
    expect(screen.getByLabelText('Horizon (years)')).toHaveValue(3)
  })
})
