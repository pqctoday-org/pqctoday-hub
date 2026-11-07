// SPDX-License-Identifier: AGPL-3.0-only
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { NGFWCipherAnalyzer } from './NGFWCipherAnalyzer'

describe('modelled offload status is not measured acceleration', () => {
  it('keeps sample throughput on all tiers without claiming actual ASIC execution', () => {
    render(
      <MemoryRouter>
        <NGFWCipherAnalyzer />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Hybrid' }))
    const select = (name: string) => {
      fireEvent.click(screen.getByRole('button', { name: /Platform:/ }))
      fireEvent.click(screen.getByRole('option', { name }))
    }
    // Both unsupported tiers reach the original no-missing-offload-warning branch.
    for (const tier of ['Entry-Level (Branch/SMB)', 'Mid-Range (Campus/DC Edge)']) {
      select(tier)
      expect(screen.getByText(/this case does not trigger/).textContent).toContain('is No')
      expect(screen.getByText(/this case does not trigger/).textContent).toContain(
        'Acceleration of this selected PQC operation: Not established'
      )
      expect(screen.queryByText('Hardware offload available')).toBeNull()
      expect(screen.queryByText(/PQC operations accelerated by dedicated crypto ASIC/)).toBeNull()
    }
    select('High-End (Enterprise Core)')
    expect(screen.getByText(/this case does not trigger/).textContent).toContain('is Yes')
    // Existing 500000 × 0.6 assumption is retained, not silently changed to 0.9.
    expect(screen.getAllByText(/300,000/).length).toBeGreaterThan(0)
    select('Entry-Level (Branch/SMB)')
    fireEvent.click(screen.getByRole('button', { name: 'Pure PQC' }))
    expect(
      screen.getByText(/Modelled missing-offload warning/).parentElement?.textContent
    ).toContain('this is not a measured appliance result')
  })
})
