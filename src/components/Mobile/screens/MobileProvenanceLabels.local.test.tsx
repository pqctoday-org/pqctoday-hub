// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { MobileCommunityView } from './MobileCommunityView'
import { MobileComplianceView } from './MobileComplianceView'
import { leadersData } from '@/data/leadersData'
import { maturityByRefId } from '@/data/maturityGovernanceData'
describe('phone source metadata limits', () => {
  it('recorded yes flag and institutions do not become institutional profile review', () => {
    const profile = leadersData.find(
      (r) => r.sourceKind === 'curated' && r.peerReviewed === 'yes' && r.vettingBody?.length
    )!
    expect(profile).toBeDefined()
    render(
      <MemoryRouter initialEntries={['/leaders?leader=' + encodeURIComponent(profile.leaderId)]}>
        <MobileCommunityView />
      </MemoryRouter>
    )
    expect(screen.getAllByText('review flag recorded').length).toBeGreaterThan(0)
    expect(screen.queryByText('peer reviewed', { exact: true })).not.toBeInTheDocument()
    const sheet = within(screen.getByTestId('leader-detail-sheet'))
    expect(sheet.getByText('Institutions in source metadata')).toBeInTheDocument()
    expect(sheet.getByText(profile.vettingBody!.join(', '))).toBeInTheDocument()
    expect(
      sheet.getByText(/do not establish institutional review or endorsement/)
    ).toBeInTheDocument()
    expect(sheet.queryByText('Vetted by', { exact: true })).not.toBeInTheDocument()
  })
  it('NIST source header retains Hub synthesis and extraction-date limits', () => {
    render(
      <MemoryRouter initialEntries={['/compliance?tab=cswp39']}>
        <MobileComplianceView />
      </MemoryRouter>
    )
    expect(
      screen.getByText(/PQC Today synthesis — not NIST.s section structure/)
    ).toBeInTheDocument()
    expect(screen.getByText(/data extracted/)).toBeInTheDocument()
    expect(screen.queryByText(/data reviewed/)).not.toBeInTheDocument()
  })
  it('linked candidate practices retain primary-source and review limitations', () => {
    const ref = [...maturityByRefId].find(([, rows]) => rows.length > 0)![0]
    render(
      <MemoryRouter initialEntries={['/compliance?tab=cswp39&evref=' + encodeURIComponent(ref)]}>
        <MobileComplianceView />
      </MemoryRouter>
    )
    expect(screen.getByRole('region', { name: 'Linked evidence' })).toHaveTextContent(
      'machine-extracted candidate practices, not automatically legal requirements'
    )
    expect(screen.getByRole('region', { name: 'Linked evidence' })).toHaveTextContent(
      'Verify the passage and primary source'
    )
    expect(screen.getByRole('region', { name: 'Linked evidence' })).toHaveTextContent(
      'recorded extraction details and their review limitations'
    )
  })
})
