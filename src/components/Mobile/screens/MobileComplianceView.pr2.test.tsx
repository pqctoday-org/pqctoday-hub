// SPDX-License-Identifier: GPL-3.0-only
//
// Deep-link PR 2 (2026-09-29): the phone view honours `?reqfw=` and `?step=`
// (and lets `cswpview` / legacy `tab` values pick a section) like desktop.
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router'
import '@testing-library/jest-dom'
import { MobileComplianceView } from './MobileComplianceView'
import { usePersonaStore } from '@/store/usePersonaStore'
import { useAssessmentStore } from '@/store/useAssessmentStore'
import { complianceFrameworks } from '@/data/complianceData'
import { CSWP39_STEPS } from '@/components/Compliance/cswp39Data'
import { buildObligations } from '@/components/Compliance/obligations/obligationsModel'

function LocationProbe() {
  return <output data-testid="location-search">{useLocation().search}</output>
}
const urlParams = () => new URLSearchParams(screen.getByTestId('location-search').textContent ?? '')

function renderAt(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <MobileComplianceView />
      <LocationProbe />
    </MemoryRouter>
  )
}
const pressed = (name: string) =>
  expect(screen.getByRole('button', { name })).toHaveAttribute('aria-pressed', 'true')

describe('MobileComplianceView — deep-link PR 2', () => {
  beforeEach(() => {
    usePersonaStore.setState({
      selectedPersona: null,
      selectedIndustries: [],
      selectedRegion: null,
    })
    useAssessmentStore.setState({ country: 'United States', industry: 'Finance & Banking' })
  })

  it('?reqfw= alone opens Requirements on that framework', () => {
    const fw = complianceFrameworks[3]
    renderAt(`/compliance?reqfw=${encodeURIComponent(fw.id)}`)
    pressed('Requirements')
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(fw.label)
  })

  it('writes ?reqfw= (with the tab) when a framework is picked', () => {
    const rows = buildObligations({
      country: 'United States',
      industry: 'Finance & Banking',
      region: null,
    })
    const target = rows[1].framework
    renderAt('/compliance?tab=requirements')
    fireEvent.click(screen.getByRole('button', { name: target.label }))
    expect(urlParams().get('reqfw')).toBe(target.id)
    expect(urlParams().get('tab')).toBe('requirements')
    pressed(target.label)
  })

  it('says not-found for an unknown ?reqfw=, and dismissing clears it', () => {
    renderAt('/compliance?tab=requirements&reqfw=NOPE')
    expect(screen.getByTestId('deeplink-notice-not-found')).toHaveTextContent('NOPE')
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss notice' }))
    expect(urlParams().get('reqfw')).toBeNull()
  })

  it('?step= opens that CSWP.39 step; tapping writes and clears it', () => {
    const step = CSWP39_STEPS[1]
    renderAt(`/compliance?step=${step.id}`)
    pressed('CSWP.39')
    const btn = screen.getByRole('button', { name: (n) => n.includes(step.title) })
    expect(btn).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(btn)
    expect(urlParams().get('step')).toBeNull()
    const other = CSWP39_STEPS[2]
    fireEvent.click(screen.getByRole('button', { name: (n) => n.includes(other.title) }))
    expect(urlParams().get('step')).toBe(other.id)
    expect(urlParams().get('tab')).toBe('cswp39')
  })

  it('?cswpview= alone lands on CSWP.39', () => {
    renderAt('/compliance?cswpview=maturity')
    pressed('CSWP.39')
  })

  it.each(['landscape', 'frameworks'])('legacy tab=%s lands on Landscape', (tab) => {
    renderAt(`/compliance?tab=${tab}`)
    pressed('Landscape')
  })
})
