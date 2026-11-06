// SPDX-License-Identifier: AGPL-3.0-only
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SensitivityConflictResolver } from './SensitivityConflictResolver'

describe('conflict resolver presents the tiers as sample policy', () => {
  it('does not present the four tiers as prescribed by the listed laws', () => {
    render(<SensitivityConflictResolver assets={[]} />)
    expect(screen.queryAllByText('Prescribed Tier')).toHaveLength(0)
    expect(screen.getAllByText('Sample-Policy Tier').length).toBeGreaterThan(0)
    const intro = screen.getByText(/Challenge:/).closest('p')!.textContent!
    expect(intro).toMatch(/sample organizational policy/)
    expect(intro).toMatch(/none of these laws or\s+standards defines them/)
    expect(intro).toMatch(/scope\s+facts/)
    expect(intro).not.toMatch(/prescribe different sensitivity tiers/)
  })

  it('states that location alone does not make a law apply', () => {
    render(<SensitivityConflictResolver assets={[]} />)
    expect(screen.getByText(/Location alone is not enough/)).toBeInTheDocument()
    expect(screen.queryByText(/jurisdiction where each data subject resides/)).toBeNull()
  })
})
