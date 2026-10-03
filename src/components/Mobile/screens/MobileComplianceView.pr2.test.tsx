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
import { maturityByRefId } from '@/data/maturityGovernanceData'

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

  // Browser-verified gap (2026-10-02): with no country/sector set, the phone
  // showed "Nothing in scope yet" and no framework for a ?reqfw= link.
  it('?reqfw= shows the linked framework even with an empty profile', () => {
    useAssessmentStore.setState({ country: '', industry: '' })
    usePersonaStore.setState({ selectedRegion: null })
    const fw = complianceFrameworks.find((f) => f.id === 'CNSA-2') ?? complianceFrameworks[0]
    renderAt(`/compliance?reqfw=${encodeURIComponent(fw.id)}`)
    pressed('Requirements')
    expect(screen.queryByText('Nothing in scope yet')).toBeNull()
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(fw.label)
    expect(screen.getByTestId('deeplink-notice-widened')).toHaveTextContent(
      'shown because the link named it'
    )
  })

  it('an empty profile without ?reqfw= still says nothing is in scope', () => {
    useAssessmentStore.setState({ country: '', industry: '' })
    renderAt('/compliance?tab=requirements')
    expect(screen.getByText('Nothing in scope yet')).toBeInTheDocument()
  })

  it('?evref= lists that document’s CSWP.39 evidence and Close clears it', () => {
    const [refId, reqs] = [...maturityByRefId.entries()][0]
    renderAt(`/compliance?evref=${encodeURIComponent(refId)}`)
    pressed('CSWP.39')
    const panel = screen.getByRole('region', { name: 'Linked evidence' })
    expect(panel).toHaveTextContent(reqs[0].sourceName)
    expect(panel).toHaveTextContent(`${reqs.length} extracted requirement`)
    expect(panel).toHaveTextContent('on a larger screen')
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(urlParams().get('evref')).toBeNull()
    expect(screen.queryByRole('region', { name: 'Linked evidence' })).toBeNull()
  })

  it('an unknown ?evref= says not-found instead of being ignored', () => {
    renderAt('/compliance?evref=NO-SUCH-REF')
    pressed('CSWP.39')
    expect(screen.getByTestId('deeplink-notice-not-found')).toHaveTextContent('NO-SUCH-REF')
  })

  it.each(['landscape', 'frameworks'])('legacy tab=%s lands on Landscape', (tab) => {
    renderAt(`/compliance?tab=${tab}`)
    pressed('Landscape')
  })
})
