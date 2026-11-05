// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { DatabaseMigrationReadiness } from './DatabaseMigrationReadiness'
vi.mock('@/components/PKILearning/common/VendorCoverageNotice', () => ({
  VendorCoverageNotice: () => null,
}))
// A labelled unit fixture exercises the low-complexity branch even though the
// current five displayed catalogue rows are high/medium. This is not a product claim.
vi.mock('../data/databaseConstants', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../data/databaseConstants')>()
  return {
    ...actual,
    DATABASE_PROFILES: actual.DATABASE_PROFILES.map((profile) =>
      profile.id === 'mysql' ? { ...profile, migrationComplexity: 'low' as const } : profile
    ),
  }
})

describe('database checklist participation does not establish technical readiness', () => {
  it('labels blank and partial review counts without making a capability claim', () => {
    render(<DatabaseMigrationReadiness />)
    expect(screen.getByText('Sample Checklist Coverage')).toBeInTheDocument()
    expect(screen.getByText('0 of 10 items reviewed')).toBeInTheDocument()
    expect(screen.getByText(/does not test database or provider compatibility/)).toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button')[0])
    expect(screen.getByText('1 of 10 items reviewed')).toBeInTheDocument()
    expect(screen.getByText('10%')).toBeInTheDocument()
    expect(screen.queryByText('Ready for PQC migration')).not.toBeInTheDocument()
  })
  it('keeps the same 100-percent checkbox calculation while qualifying the outcome', () => {
    render(<DatabaseMigrationReadiness />)
    const items = screen.getAllByRole('button')
    expect(items).toHaveLength(10)
    items.forEach((item) => fireEvent.click(item))
    expect(screen.getByText('100%')).toBeInTheDocument()
    expect(screen.getByText('10 of 10 items reviewed')).toBeInTheDocument()
    expect(
      screen.getByText('Sample checklist reviewed — technical readiness not assessed')
    ).toBeInTheDocument()
    expect(screen.queryByText('Ready for PQC migration')).not.toBeInTheDocument()
    fireEvent.click(items[0])
    expect(screen.getByText('90%')).toBeInTheDocument()
    expect(
      screen.queryByText('Sample checklist reviewed — technical readiness not assessed')
    ).not.toBeInTheDocument()
  })
  it('does not turn low complexity into low risk or the sample horizon into a deadline', () => {
    render(<DatabaseMigrationReadiness />)
    expect(
      screen.getByText(/Complexity alone does not determine security risk or migration priority/)
    ).toBeInTheDocument()
    expect(
      screen.getAllByText(/Lower implementation complexity — risk and priority not assessed/).length
    ).toBeGreaterThan(0)
    expect(
      screen.getAllByText('Illustrative 18-month planning example — not a deadline').length
    ).toBeGreaterThan(0)
    expect(screen.queryByText(/Low risk — address after critical systems/)).not.toBeInTheDocument()
  })
})
