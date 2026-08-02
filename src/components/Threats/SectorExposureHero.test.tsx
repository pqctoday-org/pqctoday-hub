// SPDX-License-Identifier: GPL-3.0-only
/**
 * Grade-A remediation Phase 2 (PLAN-08-THREATS.md): the "your migration
 * deadline" card computes `deadline = z - dataLife - MIGRATION_YEARS`, which
 * is mathematically correct but for long-lived-data sectors lands in the
 * past. That's the honest Mosca-inequality conclusion, not a bug — the bug
 * was presentational: a bare past year rendered under a "Your migration
 * deadline" label with only a small badge to distinguish it from an
 * upcoming date. These tests lock in the explicit "window already closed"
 * framing for the `rem < 0` (OVERDUE) case, and confirm the ordinary
 * future-deadline framing is unchanged when `rem >= 0`.
 *
 * `getCrqcConsensus()` is mocked with fixed values (rather than asserting
 * against whatever CRQC_ESTIMATES currently resolves to) so these tests
 * don't drift when the live estimates are refreshed by update-crqc-watch.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { SectorExposureHero } from './SectorExposureHero'
import type { ThreatData } from '@/data/threatsData'

type QuantumConstantsModule =
  typeof import('@/components/PKILearning/modules/QuantumThreats/data/quantumConstants')

const { mockGetCrqcConsensus } = vi.hoisted(() => ({
  mockGetCrqcConsensus: vi.fn(),
}))

vi.mock('@/components/PKILearning/modules/QuantumThreats/data/quantumConstants', async () => {
  const actual = await vi.importActual<QuantumConstantsModule>(
    '@/components/PKILearning/modules/QuantumThreats/data/quantumConstants'
  )
  return {
    ...actual,
    getCrqcConsensus: mockGetCrqcConsensus,
  }
})

const NOW_YEAR = new Date().getFullYear()
const noThreats: ThreatData[] = []

describe('SectorExposureHero — Mosca migration-deadline card', () => {
  it('OVERDUE (rem < 0): frames the window as already closed, not a bare past date', () => {
    // Z arrives in 5y; a 25y-data-lifetime sector (Government/Defense) plus a
    // 5y migration runway pushes the safe-start line 25 years into the past —
    // the same shape as the reported Government/Defense ~2003 example.
    mockGetCrqcConsensus.mockReturnValue({
      earliest: NOW_YEAR + 3,
      latest: NOW_YEAR + 10,
      zEstimate: NOW_YEAR + 5,
      qdayLow: NOW_YEAR + 3,
      qdayHigh: NOW_YEAR + 8,
    })
    const expectedDeadline = NOW_YEAR + 5 - 25 - 5 // = NOW_YEAR - 25

    render(
      <SectorExposureHero
        applicable={noThreats}
        scopedIndustries={['Government/Defense']}
        variant="horizon"
      />
    )

    // The real computed year is never hidden — it still renders at full size.
    expect(screen.getByText(String(expectedDeadline))).toBeInTheDocument()

    // The "already passed" framing is explicit in the headline itself...
    expect(screen.getByText('Closed in')).toBeInTheDocument()
    expect(screen.getByText(/25 years past the safe-start line/)).toBeInTheDocument()
    // ...not just implied by a bare year + badge. The eyebrow itself no longer
    // calls a 25-year-past date a "deadline" (which implies a scheduling target).
    expect(screen.getByText('Your Mosca migration window')).toBeInTheDocument()
    expect(screen.queryByText('Your migration deadline')).not.toBeInTheDocument()

    // Badge still reads OVERDUE, and the fine print does not soften the
    // urgency (no "consider migrating soon" language).
    expect(screen.getByText('OVERDUE')).toBeInTheDocument()
    expect(screen.getByText(/already passed/)).toBeInTheDocument()
    expect(screen.getByText(/may already be exposed/)).toBeInTheDocument()

    // The old "latest safe start for" future-tense caption must not appear
    // next to a 25-year-past date.
    expect(screen.queryByText(/latest safe start for/)).not.toBeInTheDocument()
  })

  it('rem >= 0 (PLANNING): keeps the ordinary future-deadline framing, unchanged', () => {
    // Z arrives in 40y; a short-lived-data sector (Cloud/SaaS, 7y) plus 5y
    // migration leaves a genuinely future safe-start year.
    mockGetCrqcConsensus.mockReturnValue({
      earliest: NOW_YEAR + 35,
      latest: NOW_YEAR + 45,
      zEstimate: NOW_YEAR + 40,
      qdayLow: NOW_YEAR + 35,
      qdayHigh: NOW_YEAR + 42,
    })
    const expectedDeadline = NOW_YEAR + 40 - 7 - 5 // = NOW_YEAR + 28

    render(
      <SectorExposureHero
        applicable={noThreats}
        scopedIndustries={['Cloud/SaaS']}
        variant="horizon"
      />
    )

    expect(screen.getByText(String(expectedDeadline))).toBeInTheDocument()
    expect(screen.getByText('Your migration deadline')).toBeInTheDocument()
    expect(screen.getByText(/latest safe start for/)).toBeInTheDocument()
    expect(screen.getByText('PLANNING')).toBeInTheDocument()

    // The OVERDUE-only framing must not leak into the future-deadline case.
    expect(screen.queryByText('Closed in')).not.toBeInTheDocument()
    expect(screen.queryByText('Your Mosca migration window')).not.toBeInTheDocument()
  })
})
