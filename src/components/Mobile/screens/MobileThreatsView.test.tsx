// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router'
import { MobileThreatsView } from './MobileThreatsView'
import { usePersonaStore } from '@/store/usePersonaStore'
import { useBookmarkStore } from '@/store/useBookmarkStore'
import { retiredThreats, threatsData } from '@/data/threatsData'
import { getThreatClass, threatMatchesClass } from '@/components/Threats/threatClassification'
import {
  getCrqcConsensus,
  CRQC_ESTIMATES,
} from '@/components/PKILearning/modules/QuantumThreats/data/quantumConstants'
import { PERSONA_THREATS_DEFAULT_INDUSTRIES, INDUSTRY_TO_THREATS_MAP } from '@/data/personaConfig'

// Claim-ledger fixture keyed to a real row id, so the sheet can be tested
// whether or not public/threats/claim-status.json is on this branch.
const CAVEAT_ROW = vi.hoisted(() => ({ id: '' }))
vi.mock('@/data/threatClaimStatus', async () => {
  const actual = await vi.importActual<typeof import('@/data/threatClaimStatus')>(
    '@/data/threatClaimStatus'
  )
  return {
    ...actual,
    getSourceCaveat: (id: string) =>
      actual.sourceCaveatFor(id, {
        rows: {
          [CAVEAT_ROW.id]: {
            claims: { threat_description: { verdict: 'contradicted', decidedAt: '2026-09-16' } },
          },
        },
      }),
  }
})

// Real data throughout — threatsData is parsed synchronously from a bundled
// CSV at module load. Assertions are structural (derived counts, not
// hardcoded), since the underlying CSV changes over time.
// Renders the router's current query string so a test can read the URL.
function LocationProbe() {
  return <output data-testid="location-search">{useLocation().search}</output>
}

function renderView(url = '/threats') {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <MobileThreatsView />
      <LocationProbe />
    </MemoryRouter>
  )
}

describe('MobileThreatsView', () => {
  afterEach(() => {
    usePersonaStore.getState().setPersona(null)
    useBookmarkStore.getState().clearMyThreats()
  })

  it('shows the real total threat count, and no persona-scoped line when no persona is set', () => {
    renderView()
    expect(screen.getByText(`${threatsData.length} tracked`, { exact: false })).toBeInTheDocument()
    expect(screen.queryByText(/in your focus areas/i)).not.toBeInTheDocument()
  })

  it('scopes the count to the real persona-default industries, matching the same resolver desktop uses', () => {
    usePersonaStore.getState().setPersona('executive')
    renderView()
    const keys = PERSONA_THREATS_DEFAULT_INDUSTRIES.executive
    const industries = keys
      .flatMap((k) => INDUSTRY_TO_THREATS_MAP[k] ?? [])
      .filter((ind) => threatsData.some((d) => d.industry === ind))
    const expectedCount = threatsData.filter((t) => industries.includes(t.industry)).length
    expect(
      screen.getByText(`${expectedCount} in your focus areas`, { exact: false })
    ).toBeInTheDocument()
  })

  it('the CRQC year stepper starts at the real consensus estimate and shows the real consensus window', () => {
    renderView()
    const consensus = getCrqcConsensus()
    expect(screen.getByText(String(consensus.zEstimate))).toBeInTheDocument()
    expect(
      screen.getByText(`consensus ${consensus.qdayLow}–${consensus.qdayHigh}`, { exact: false })
    ).toBeInTheDocument()
  })

  it('stepping the CRQC year up and down live-recomputes the urgency band', () => {
    renderView()
    const before = screen.getByText(/Migration should have|years remaining/i).textContent
    fireEvent.click(screen.getByRole('button', { name: 'Later CRQC year' }))
    const after = screen.getByText(/Migration should have|years remaining/i).textContent
    expect(after).not.toBe(before)
  })

  // 2026-08-24 audit R3.1: bounds derive from the live getCrqcConsensus()
  // window, not a hand-typed 2030/2036 — a hardcoded pair here would keep
  // passing after a CSV update shifted the real consensus, silently
  // certifying stale bounds as correct.
  it('the stepper cannot go below or above the live consensus window', () => {
    renderView()
    const { qdayLow, qdayHigh } = getCrqcConsensus()
    const earlier = screen.getByRole('button', { name: 'Earlier CRQC year' })
    for (let i = 0; i < 15; i++) fireEvent.click(earlier)
    expect(screen.getByText(String(qdayLow))).toBeInTheDocument()
    expect(earlier).toBeDisabled()

    const later = screen.getByRole('button', { name: 'Later CRQC year' })
    for (let i = 0; i < 15; i++) fireEvent.click(later)
    expect(screen.getByText(String(qdayHigh))).toBeInTheDocument()
    expect(later).toBeDisabled()
  })

  it('"median of N tracked sources" derives from the real CRQC_ESTIMATES length', () => {
    renderView()
    expect(
      screen.getByText(`median of ${CRQC_ESTIMATES.length} tracked sources`, { exact: false })
    ).toBeInTheDocument()
  })

  it('a criticality filter chip narrows the list to exactly that criticality', () => {
    renderView()
    fireEvent.click(screen.getByRole('button', { name: 'Critical' }))
    const expected = threatsData.filter((t) => t.criticality === 'Critical')
    for (const t of expected.slice(0, 3)) {
      expect(screen.getByText(t.threatId)).toBeInTheDocument()
    }
    const nonMatch = threatsData.find((t) => t.criticality !== 'Critical')
    if (nonMatch) expect(screen.queryByText(nonMatch.threatId)).not.toBeInTheDocument()
  })

  // 2026-08-24 audit R4.7: criticality was filterable (2 chip rows) but
  // never shown on the row or the sheet — a reader who filtered to
  // "Critical" couldn't see any row's level without opening it.
  it("shows each threat's real criticality level on its card row", () => {
    renderView()
    const first = threatsData[0]
    const card = screen.getByText(first.threatId).closest('article')!
    expect(within(card).getByText(first.criticality)).toBeInTheDocument()
  })

  it('shows the real criticality level in the detail sheet', () => {
    renderView()
    const first = threatsData[0]
    fireEvent.click(screen.getAllByText(first.description)[0].closest('button')!)
    const sheet = screen.getByTestId('threat-detail-sheet')
    expect(within(sheet).getByText(first.criticality)).toBeInTheDocument()
  })

  it('tapping an active filter chip again clears it', () => {
    renderView()
    const chip = screen.getByRole('button', { name: 'Critical' })
    fireEvent.click(chip)
    expect(chip).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(chip)
    expect(chip).toHaveAttribute('aria-pressed', 'false')
  })

  it('rendered cards show their real Shor-tier blurb verbatim from SHOR_TIER_DEFS — no tier filter exists to hide a PQC-safe row', () => {
    renderView()
    expect(
      screen.getAllByText(/Shor-breakable|NIST PQC parameter set|No recognised algorithm/i).length
    ).toBeGreaterThan(0)
  })

  it('toggles a threat bookmark via the real useBookmarkStore', () => {
    renderView()
    const first = threatsData[0]
    const btn = screen.getAllByRole('button', { name: 'Add to My Threats' })[0]
    fireEvent.click(btn)
    expect(useBookmarkStore.getState().myThreats).toContain(first.threatId)
  })

  it('states what was cut rather than silently dropping it', () => {
    renderView()
    expect(
      screen.getByText(/Protocol lens, trust-tier filter, and the CRQC capability strip/i)
    ).toBeInTheDocument()
  })

  it('tapping a threat card opens the real detail sheet with its related modules, and Close dismisses it', () => {
    renderView()
    const first = threatsData[0]
    fireEvent.click(screen.getAllByText(first.description)[0].closest('button')!)
    expect(screen.getByTestId('threat-detail-sheet')).toBeInTheDocument()
    if (first.relatedModules.length > 0) {
      expect(screen.getByText(first.relatedModules.join(', '))).toBeInTheDocument()
    }
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByTestId('threat-detail-sheet')).not.toBeInTheDocument()
  })

  // UX-9: phones used to ignore every URL parameter, so a shared link opened
  // the unfiltered list. Same parsing as desktop (threatsUrlParams).
  describe('deep links', () => {
    it('?id= opens that threat’s detail sheet', () => {
      const t = threatsData[3]
      renderView(`/threats?id=${encodeURIComponent(t.threatId)}`)
      const sheet = screen.getByTestId('threat-detail-sheet')
      expect(within(sheet).getAllByText(t.description)[0]).toBeInTheDocument()
    })

    it('the legacy ?threat= alias opens it too, and closing drops both from the URL', () => {
      const t = threatsData[1]
      renderView(`/threats?threat=${encodeURIComponent(t.threatId)}`)
      expect(screen.getByTestId('threat-detail-sheet')).toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: 'Close' }))
      expect(screen.queryByTestId('threat-detail-sheet')).not.toBeInTheDocument()
      expect(screen.getByTestId('location-search').textContent).not.toMatch(/id=|threat=/)
    })

    it('?industry= scopes the list to that industry and says so', () => {
      const industry = threatsData[0].industry
      renderView(`/threats?industry=${encodeURIComponent(industry)}`)
      expect(screen.getByText('From your link:')).toBeInTheDocument()
      const other = threatsData.find((t) => t.industry !== industry)!
      expect(screen.queryByText(other.threatId)).not.toBeInTheDocument()
      for (const t of threatsData.filter((x) => x.industry === industry).slice(0, 3)) {
        expect(screen.getByText(t.threatId)).toBeInTheDocument()
      }
      fireEvent.click(screen.getByRole('button', { name: 'Show all' }))
      expect(screen.getByText(other.threatId)).toBeInTheDocument()
    })

    it('?q= filters with the desktop search', () => {
      const t = threatsData[0]
      renderView(`/threats?q=${encodeURIComponent(t.threatId)}`)
      expect(screen.getByText(t.threatId)).toBeInTheDocument()
      expect(screen.queryByText(threatsData[1].threatId)).not.toBeInTheDocument()
    })

    it('?class= preselects the class chip and filters to it', () => {
      renderView('/threats?class=hnfl')
      const group = screen.getByRole('group', { name: 'Filter by threat class' })
      const chip = within(group).getByRole('button', { name: /HNFL \/ TNFL/ })
      expect(chip).toHaveAttribute('aria-pressed', 'true')
      const hndlOnly = threatsData.find((t) => getThreatClass(t) === 'hndl')
      if (hndlOnly) expect(screen.queryByText(hndlOnly.threatId)).not.toBeInTheDocument()
    })

    it('HNFL shows hnfl + both rows — the same meaning as desktop (UX-15)', () => {
      renderView('/threats?class=hnfl')
      const both = threatsData.find((t) => getThreatClass(t) === 'both')!
      expect(screen.getByText(both.threatId)).toBeInTheDocument()
      const shown = threatsData.filter((t) => threatMatchesClass(t, 'hnfl'))
      expect(shown.every((t) => getThreatClass(t) !== 'hndl')).toBe(true)
      // Only the two class chips desktop offers, plus "All classes".
      const group = screen.getByRole('group', { name: 'Filter by threat class' })
      expect(within(group).getAllByRole('button')).toHaveLength(3)
    })

    it('a link to a retired threat says it was retired', () => {
      const [id, retired] = [...retiredThreats][0]
      renderView(`/threats?id=${encodeURIComponent(id)}`)
      expect(screen.getByText(/This entry was retired/)).toBeInTheDocument()
      if (retired.deprecatedAt)
        expect(screen.getByText(new RegExp(retired.deprecatedAt))).toBeInTheDocument()
      expect(screen.queryByTestId('threat-detail-sheet')).not.toBeInTheDocument()
    })
  })

  it('the detail sheet shows the source caveat for a ledger-flagged row, and not for others', () => {
    CAVEAT_ROW.id = threatsData[2].threatId
    renderView(`/threats?id=${encodeURIComponent(threatsData[2].threatId)}`)
    const sheet = screen.getByTestId('threat-detail-sheet')
    expect(
      within(sheet).getByText(/those are our analysis\. \(checked 2026-09-16\)/)
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    fireEvent.click(screen.getAllByText(threatsData[3].description)[0].closest('button')!)
    expect(
      within(screen.getByTestId('threat-detail-sheet')).queryByText(/those are our analysis/)
    ).not.toBeInTheDocument()
  })
})
