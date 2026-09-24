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
 * `getCrqcForecast()` is mocked with fixed values (rather than asserting
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

const { mockGetCrqcForecast } = vi.hoisted(() => ({
  mockGetCrqcForecast: vi.fn(),
}))

vi.mock('@/components/PKILearning/modules/QuantumThreats/data/quantumConstants', async () => {
  const actual = await vi.importActual<QuantumConstantsModule>(
    '@/components/PKILearning/modules/QuantumThreats/data/quantumConstants'
  )
  return {
    ...actual,
    getCrqcForecast: mockGetCrqcForecast,
  }
})

const NOW_YEAR = new Date().getFullYear()
const noThreats: ThreatData[] = []

const forecast = (low: number, high: number, planningYear: number) => ({
  low,
  high,
  planningYear,
  sources: [],
  sourceCountLabel: 'one expert survey',
  label: `CRQC expert forecast: ${low}–${high} (one expert survey)`,
})

describe('SectorExposureHero — Mosca migration-deadline card', () => {
  it('OVERDUE (rem < 0): frames the window as already closed, not a bare past date', () => {
    // Z arrives in 5y; a 25y-data-lifetime sector (Government/Defense) plus a
    // 5y migration runway pushes the safe-start line 25 years into the past —
    // the same shape as the reported Government/Defense ~2003 example.
    mockGetCrqcForecast.mockReturnValue(forecast(NOW_YEAR + 3, NOW_YEAR + 10, NOW_YEAR + 5))
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
    mockGetCrqcForecast.mockReturnValue(forecast(NOW_YEAR + 35, NOW_YEAR + 45, NOW_YEAR + 40))
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

describe('SectorExposureHero — one CRQC window (ruling R5)', () => {
  it('states the forecast window with its one wording, and uses its planning year as Z', () => {
    mockGetCrqcForecast.mockReturnValue(forecast(2030, 2041, 2035))
    render(<SectorExposureHero applicable={noThreats} scopedIndustries={[]} variant="horizon" />)
    expect(
      screen.getByText('CRQC expert forecast: 2030–2041 (one expert survey)')
    ).toBeInTheDocument()
    expect(screen.getByText(/Z 2035 −/)).toBeInTheDocument()
    expect(screen.queryByText(/consensus|sources/i)).not.toBeInTheDocument()
  })
})
