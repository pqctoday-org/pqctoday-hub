// SPDX-License-Identifier: GPL-3.0-only
//
// Deep-link PR 1 (2026-09-28): the phone view honours the same params as desktop.
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router'
import '@testing-library/jest-dom'
import { MobileComplianceView, type MobileCertRecord } from './MobileComplianceView'
import { usePersonaStore } from '@/store/usePersonaStore'
import { complianceFrameworks } from '@/data/complianceData'

function LocationProbe() {
  return <output data-testid="location-search">{useLocation().search}</output>
}
const urlParams = () => new URLSearchParams(screen.getByTestId('location-search').textContent ?? '')

const records: MobileCertRecord[] = [
  {
    id: '4389',
    source: 'NIST',
    date: '2023-01-01',
    link: 'https://csrc.nist.gov/x',
    type: 'FIPS 140-3',
    status: 'Active',
    productName: 'Linked Module',
    productCategory: 'HSM',
    vendor: 'Acme',
  },
]

function renderAt(url: string, props: Parameters<typeof MobileComplianceView>[0] = {}) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <MobileComplianceView {...props} />
      <LocationProbe />
    </MemoryRouter>
  )
}

describe('MobileComplianceView deep links', () => {
  beforeEach(() => {
    usePersonaStore.setState({
      selectedPersona: null,
      selectedIndustries: [],
      selectedRegion: null,
    })
  })

  it.each(['standards', 'technical', 'certification', 'compliance'])(
    'maps the desktop Landscape pillar tab=%s to Landscape',
    (tab) => {
      renderAt(`/compliance?tab=${tab}`)
      expect(screen.getByRole('button', { name: 'Landscape' })).toHaveAttribute(
        'aria-pressed',
        'true'
      )
    }
  )

  it('lands a bare ?evref= on CSWP.39', () => {
    renderAt('/compliance?evref=X')
    expect(screen.getByRole('button', { name: 'CSWP.39' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('opens the framework sheet from ?framework= and clears it on close', () => {
    const fw = complianceFrameworks[0]
    renderAt(`/compliance?framework=${encodeURIComponent(fw.id)}`)
    expect(screen.getByTestId('compliance-framework-detail-sheet')).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(urlParams().get('framework')).toBeNull()
  })

  it('shows not-found for an unknown framework', () => {
    renderAt('/compliance?framework=NOT-A-FRAMEWORK')
    expect(screen.getByTestId('deeplink-notice-not-found')).toHaveTextContent(/NOT-A-FRAMEWORK/)
  })

  it('opens the linked record on Records and clears ?cert= on close', () => {
    renderAt('/compliance?cert=4389', { records, recordsLoaded: true })
    expect(screen.getByRole('button', { name: 'Records' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('compliance-record-detail-sheet')).toHaveTextContent('Linked Module')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(urlParams().get('cert')).toBeNull()
  })

  it('shows not-found for an unknown cert once records are loaded (not before)', () => {
    const { unmount } = renderAt('/compliance?cert=NOPE', { records: [], recordsLoaded: false })
    expect(screen.queryByTestId('deeplink-notice-not-found')).not.toBeInTheDocument()
    unmount()
    renderAt('/compliance?cert=NOPE', { records, recordsLoaded: true })
    expect(screen.getByTestId('deeplink-notice-not-found')).toHaveTextContent(/NOPE/)
  })
})
