// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { SettlementExposureModeller } from './SettlementExposureModeller'

vi.mock('@/data/regulatoryTimelines', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/data/regulatoryTimelines')>()
  return {
    ...actual,
    CRQC_ESTIMATES: {
      ...actual.CRQC_ESTIMATES,
      lowerBound: 2033,
      moderate: 2034,
      upperBound: 2040,
    },
  }
})
const openSample = () =>
  render(
    <MemoryRouter>
      <SettlementExposureModeller />
    </MemoryRouter>
  )

describe('settlement capture-year boundary', () => {
  it('places the fixed sample capture before the boundary for a shorter confidentiality lifetime', () => {
    openSample()
    // Fictional T2034 and R7: boundary2027; sample2026 expires2033, before2034.
    expect(screen.getByText('Not exposed under this assumption')).toBeInTheDocument()
    expect(screen.getByText(/sample year 2026/)).toBeInTheDocument()
    expect(screen.getByText('2033', { selector: 'strong' })).toBeInTheDocument()
    expect(screen.getByText('2027', { selector: 'strong' })).toBeInTheDocument()
    expect(
      screen.getByText(/traffic captured after this boundary and before the/)
    ).toBeInTheDocument()
    expect(screen.queryByText(/captured up to/)).not.toBeInTheDocument()
    expect(
      screen.queryByText(/already in adversary|still worth harvesting|no residual value/)
    ).not.toBeInTheDocument()
  })
  it('keeps equality outside overlap under the existing strict predicate', () => {
    openSample()
    fireEvent.click(screen.getByRole('button', { name: 'CRQC arrival assumption:' }))
    fireEvent.click(screen.getByRole('option', { name: 'Early (2033)' }))
    // Same sample2026 and R7: expiry2033 equals T2033, not a positive overlap.
    expect(screen.getByText('Not exposed under this assumption')).toBeInTheDocument()
    expect(screen.getByText('2026', { selector: 'strong' })).toBeInTheDocument()
    expect(screen.getByText(/Capture at the boundary ends its lifetime/)).toBeInTheDocument()
    expect(screen.queryByText('Exposed by 0 years')).not.toBeInTheDocument()
  })
  it('places the same capture after the boundary when its selected lifetime is longer', () => {
    openSample()
    fireEvent.click(screen.getByRole('button', { name: '10 year confidentiality lifetime' }))
    // T2034 and R10: boundary2024; sample2026 expires2036, a2year overlap.
    expect(screen.getByText('Exposed by 2 years')).toBeInTheDocument()
    expect(screen.getByText('2024', { selector: 'strong' })).toBeInTheDocument()
    expect(screen.getByText('2036', { selector: 'strong' })).toBeInTheDocument()
    expect(screen.getByText(/potential exposure in this illustrative model/)).toBeInTheDocument()
    expect(
      screen.getByText(/do not establish attacker holdings or a migration deadline/)
    ).toBeInTheDocument()
  })
})
