// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router'
import '@testing-library/jest-dom'
import { allComplianceFrameworks, getFrameworkById } from '@/data/complianceData'
import { ComplianceLandscape } from './ComplianceLandscape'
import { EvidenceClassLegend } from './EvidenceClassLegend'
import { PillarPipeline } from './redesign/PillarPipeline'
import { matchesCertType, pqcEvidenceLabel } from './recordSemantics'

// Passage fetching is independent of the navigation and evidence labels under test.
vi.mock('@/components/ui/SourcePassagesDrawer', () => ({ SourcePassagesDrawer: () => null }))

function LocationProbe() {
  return <output data-testid="location">{useLocation().search}</output>
}

describe('Compliance validation evidence scopes', () => {
  it('teaches distinct positive evidence scopes in the actual pillar and legend', () => {
    const change = vi.fn()
    render(
      <MemoryRouter>
        <PillarPipeline
          frameworks={allComplianceFrameworks}
          activePillar="standardize"
          onPillarChange={change}
          orgFilter="All"
          industryFilter="All"
          regionFilter="All"
          countryFilter="All"
          deadlineFilter="All"
          searchText=""
          searchInputValue=""
          sortBy="name"
          viewMode="table"
          onOrgFilterChange={vi.fn()}
          onIndustryFilterChange={vi.fn()}
          onRegionFilterChange={vi.fn()}
          onCountryFilterChange={vi.fn()}
          onDeadlineFilterChange={vi.fn()}
          onSearchTextChange={vi.fn()}
          onSortByChange={vi.fn()}
          onViewModeChange={vi.fn()}
        />
        <EvidenceClassLegend />
      </MemoryRouter>
    )
    const pillar = screen.getByRole('tab', { name: /Certification Schemes/ })
    expect(pillar).toHaveTextContent(
      'CAVP validates algorithm implementations, commonly through ACVP'
    )
    expect(pillar).toHaveTextContent('CMVP validates cryptographic modules to FIPS 140-3')
    expect(pillar).toHaveTextContent(
      'Common Criteria and EUCC evaluate a specified product and configuration against its Security Target'
    )
    expect(pillar).not.toHaveTextContent(
      'independently test that a product implements those algorithms correctly'
    )
    fireEvent.click(pillar)
    expect(change).toHaveBeenCalledWith('certify')
    const legend = screen.getByRole('complementary', { name: 'What the evidence proves' })
    expect(within(legend).getByText(/named algorithm implementation passed CAVP/)).toBeVisible()
    expect(within(legend).getByText(/defined cryptographic module and configuration/)).toBeVisible()
    expect(within(legend).getByText(/evaluated-product document names PQC/)).toBeVisible()
    expect(pqcEvidenceLabel('ACVP')).toBe('NIST CAVP validated algorithms')
    for (const type of ['Common Criteria', 'EUCC']) {
      expect(pqcEvidenceLabel(type)).toBe('Named in the Security Target')
    }
    expect(pqcEvidenceLabel('FIPS 140-3')).toBe("On the certificate's Approved Algorithms list")
  })

  it.each([
    ['FIPS-203', 'ML-KEM'],
    ['FIPS-204', 'ML-DSA'],
    ['FIPS-205', 'SLH-DSA'],
  ])('routes actual %s row to algorithm records, preserving its family filter', (id, family) => {
    const framework = getFrameworkById(id)
    expect(framework).toBeDefined()
    const select = vi.fn()
    render(
      <MemoryRouter initialEntries={['/compliance']}>
        <ComplianceLandscape
          frameworks={[framework!]}
          viewMode="cards"
          onSelectFramework={select}
        />
        <LocationProbe />
      </MemoryRouter>
    )
    const link = screen.getByRole('link', { name: 'Algorithm validation records' })
    expect(link).toHaveAttribute(
      'href',
      `/compliance?tab=records&rtab=acvp&pqc=${encodeURIComponent(family)}`
    )
    expect(link).toHaveAttribute(
      'title',
      `CAVP algorithm validation records for ${family}; not CMVP module certificates`
    )
    expect(screen.queryByRole('link', { name: 'Certified products' })).not.toBeInTheDocument()
    fireEvent.click(link)
    expect(select).not.toHaveBeenCalled()
    const params = new URLSearchParams(screen.getByTestId('location').textContent ?? '')
    expect(params.get('tab')).toBe('records')
    expect(params.get('pqc')).toBe(family)
    expect(matchesCertType({ type: 'ACVP' }, params.get('rtab')!)).toBe(true)
    for (const type of ['FIPS 140-3', 'Common Criteria', 'EUCC']) {
      expect(matchesCertType({ type }, params.get('rtab')!)).toBe(false)
    }
  })
})
