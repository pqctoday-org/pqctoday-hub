// SPDX-License-Identifier: GPL-3.0-only
//
// Deep-link PR 1 (2026-09-28): `?cert=` widening + not-found, `?framework=`
// not-found, and the drawer following the URL.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router'
import '@testing-library/jest-dom'
import { ComplianceView } from './ComplianceView'
import { usePersonaStore } from '@/store/usePersonaStore'
import { complianceFrameworks } from '@/data/complianceData'

vi.mock('@/hooks/useIsMobileShell', () => ({ useIsMobileShell: () => false }))

vi.mock('./services', () => ({
  useComplianceRefresh: () => ({
    data: [
      {
        id: 'hist-1',
        type: 'FIPS 140-3',
        vendor: 'Acme Corp',
        productName: 'Old Module',
        productCategory: 'HSM',
        status: 'Historical',
        source: 'NIST',
        date: '2020-01-01',
        link: '',
        pqcCoverage: '',
      },
      {
        id: 'cc-1',
        type: 'Common Criteria',
        vendor: 'EU Vendor',
        productName: 'EU HSM',
        productCategory: 'HSM',
        status: 'Active',
        source: 'Common Criteria',
        date: '2025-01-01',
        link: '',
        pqcCoverage: '',
      },
    ],
    loading: false,
    error: null,
    lastUpdated: new Date('2026-02-17'),
    meta: null,
    refresh: vi.fn(),
  }),
}))

vi.mock('./PqcCertificationTrendChart', () => ({
  PqcCertificationTrendChart: () => <div data-testid="pqc-trend-chart-stub" />,
}))

vi.mock('./ComplianceTable', () => ({
  ComplianceTable: ({ selectedRecordId }: { selectedRecordId?: string }) => (
    <div data-testid="compliance-table">selected: {selectedRecordId ?? 'none'}</div>
  ),
}))

vi.mock('../../utils/analytics', () => ({
  logComplianceFilter: vi.fn(),
  logPreviewBannerShown: vi.fn(),
  logPreviewBannerDismissed: vi.fn(),
}))

function LocationProbe() {
  return <output data-testid="location-search">{useLocation().search}</output>
}
const urlParams = () => new URLSearchParams(screen.getByTestId('location-search').textContent ?? '')

function renderAt(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <ComplianceView />
      <LocationProbe />
    </MemoryRouter>
  )
}

describe('ComplianceView deep links', () => {
  beforeEach(() => {
    window.localStorage.clear()
    usePersonaStore.setState({
      selectedPersona: null,
      selectedIndustries: [],
      selectedRegion: null,
    })
  })

  it('widens the default current-only scope for a historical record, with Undo', () => {
    renderAt('/compliance?cert=hist-1')
    expect(screen.getByTestId('deeplink-notice-widened')).toHaveTextContent(/Old Module/)
    expect(urlParams().get('rstatus')).toBe('all')
    expect(urlParams().get('cert')).toBe('hist-1')
    expect(screen.getByTestId('compliance-table')).toHaveTextContent('selected: hist-1')

    fireEvent.click(screen.getByRole('button', { name: 'Undo' }))
    expect(urlParams().get('rstatus')).toBeNull()
    expect(urlParams().get('cert')).toBe('hist-1')
    expect(screen.queryByTestId('deeplink-notice-widened')).not.toBeInTheDocument()
  }, 15000)

  it('clears only the same-URL filter that hides the record', () => {
    renderAt('/compliance?tab=records&cert=cc-1&rtab=fips&vendor=EU')
    const p = urlParams()
    expect(p.get('rtab')).toBeNull()
    expect(p.get('vendor')).toBe('EU')
    expect(p.get('rstatus')).toBeNull()
    expect(screen.getByTestId('deeplink-notice-widened')).toHaveTextContent(/record-type tab/)
  }, 15000)

  it('says nothing when the record is already visible', () => {
    renderAt('/compliance?cert=cc-1')
    expect(screen.queryByTestId(/deeplink-notice/)).not.toBeInTheDocument()
  }, 15000)

  it('shows not-found for an unknown cert, and dismissing clears the param', () => {
    renderAt('/compliance?cert=NOPE')
    expect(screen.getByTestId('deeplink-notice-not-found')).toHaveTextContent(/NOPE/)
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss notice' }))
    expect(urlParams().get('cert')).toBeNull()
  }, 15000)

  it('shows not-found for an unknown framework id', () => {
    renderAt('/compliance?framework=NOT-A-FRAMEWORK')
    expect(screen.getByTestId('deeplink-notice-not-found')).toHaveTextContent(/NOT-A-FRAMEWORK/)
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss notice' }))
    expect(urlParams().get('framework')).toBeNull()
  }, 15000)

  it('opens the drawer for a known framework and keeps ?framework= in the URL', () => {
    const fw = complianceFrameworks[0]
    renderAt(`/compliance?framework=${encodeURIComponent(fw.id)}`)
    expect(screen.queryByTestId('deeplink-notice-not-found')).not.toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(urlParams().get('framework')).toBe(fw.id)
    // Closing replaces the param away.
    fireEvent.click(screen.getAllByRole('button', { name: /^Close/ })[0])
    expect(urlParams().get('framework')).toBeNull()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  }, 15000)
})
