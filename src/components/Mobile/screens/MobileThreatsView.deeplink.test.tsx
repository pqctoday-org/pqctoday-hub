// SPDX-License-Identifier: GPL-3.0-only
/** Deep-link remediation PR 1 — ?id= on a phone: not-found, widening, push. */
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router'
import '@testing-library/jest-dom'
import { draftThreatIndustries, threatsData } from '@/data/threatsData'
import { usePersonaStore } from '@/store/usePersonaStore'
import { PERSONA_THREATS_DEFAULT_INDUSTRIES, INDUSTRY_TO_THREATS_MAP } from '@/data/personaConfig'
import { MobileThreatsView } from './MobileThreatsView'

function LocationProbe() {
  return <output data-testid="location-search">{useLocation().search}</output>
}
const renderView = (url: string) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <MobileThreatsView />
      <LocationProbe />
    </MemoryRouter>
  )
const param = (k: string) =>
  new URLSearchParams(screen.getByTestId('location-search').textContent ?? '').get(k)

describe('MobileThreatsView ?id= deep links', () => {
  afterEach(() => usePersonaStore.getState().setPersona(null))

  it('a draft id says it is unpublished instead of opening nothing', () => {
    const draftId = [...draftThreatIndustries.keys()][0]
    renderView(`/threats?id=${encodeURIComponent(draftId)}`)
    expect(screen.getByTestId('deeplink-notice-not-found')).toHaveTextContent(/isn't published yet/)
    expect(screen.queryByTestId('threat-detail-sheet')).not.toBeInTheDocument()
  })

  it("widens the persona scope to include the linked threat's industry", () => {
    usePersonaStore.getState().setPersona('executive')
    usePersonaStore.setState({ selectedIndustries: [] })
    const scope = (PERSONA_THREATS_DEFAULT_INDUSTRIES.executive ?? []).flatMap(
      (k) => INDUSTRY_TO_THREATS_MAP[k] ?? []
    )
    const outside = threatsData.find((t) => !scope.includes(t.industry))!
    renderView(`/threats?id=${outside.threatId}`)
    expect(screen.getByTestId('deeplink-notice-widened')).toHaveTextContent(outside.threatId)
    expect(screen.getByTestId('threat-detail-sheet')).toBeInTheDocument()
  })

  it('clears a link filter that hides the threat; Undo restores it and closes', async () => {
    const t = threatsData[0]
    renderView(`/threats?id=${t.threatId}&q=zzzzzz`)
    await waitFor(() => expect(param('q')).toBeNull())
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }))
    await waitFor(() => expect(param('q')).toBe('zzzzzz'))
    expect(param('id')).toBeNull()
  })
})
