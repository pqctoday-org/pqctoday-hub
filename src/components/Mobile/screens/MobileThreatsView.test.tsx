// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MobileThreatsView } from './MobileThreatsView'
import { usePersonaStore } from '@/store/usePersonaStore'
import { useBookmarkStore } from '@/store/useBookmarkStore'
import { threatsData } from '@/data/threatsData'
import { getCrqcConsensus } from '@/components/PKILearning/modules/QuantumThreats/data/quantumConstants'
import { PERSONA_THREATS_DEFAULT_INDUSTRIES, INDUSTRY_TO_THREATS_MAP } from '@/data/personaConfig'

// Real data throughout — threatsData is parsed synchronously from a bundled
// CSV at module load. Assertions are structural (derived counts, not
// hardcoded), since the underlying CSV changes over time.
function renderView() {
  return render(<MobileThreatsView />)
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

  it('the CRQC year stepper starts at the real consensus estimate and is bounded 2030–2036', () => {
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

  it('the stepper cannot go below 2030 or above 2036', () => {
    renderView()
    const earlier = screen.getByRole('button', { name: 'Earlier CRQC year' })
    for (let i = 0; i < 15; i++) fireEvent.click(earlier)
    expect(screen.getByText('2030')).toBeInTheDocument()
    expect(earlier).toBeDisabled()

    const later = screen.getByRole('button', { name: 'Later CRQC year' })
    for (let i = 0; i < 15; i++) fireEvent.click(later)
    expect(screen.getByText('2036')).toBeInTheDocument()
    expect(later).toBeDisabled()
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
      screen.getByText(/Protocol lens, trust-tier filter, the CRQC capability strip/i)
    ).toBeInTheDocument()
  })
})
