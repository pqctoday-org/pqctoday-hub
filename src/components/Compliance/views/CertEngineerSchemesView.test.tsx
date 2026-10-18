// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { CertEngineerSchemesView } from './CertEngineerSchemesView'
import { complianceFrameworks } from '../../../data/complianceData'
import { applicableFrameworks } from '../../../utils/applicabilityEngine'

// No records loaded: ModuleCertificationStatus renders nothing on empty data,
// so this suite covers the schemes list and the links deterministically.
vi.mock('../services', () => ({
  useComplianceRefresh: () => ({ data: [] }),
}))

function renderView(onSelectFramework = vi.fn()) {
  render(
    <MemoryRouter>
      <CertEngineerSchemesView
        profileOverride={{ country: 'United States', industry: 'Technology', region: 'americas' }}
        onSelectFramework={onSelectFramework}
      />
    </MemoryRouter>
  )
}

const schemes = applicableFrameworks(
  { country: 'United States', industry: 'Technology', region: 'americas' },
  complianceFrameworks
)
  .map((result) => result.item)
  .filter((fw) => fw.bodyType === 'certification_body')
const expecting = schemes.filter((fw) =>
  ['yes', 'expected', 'partial', 'guidance'].includes(fw.pqcRequirement ?? '')
)

describe('CertEngineerSchemesView', () => {
  it('lists in-scope certification schemes with PQC posture from the live framework set', () => {
    renderView()
    expect(expecting.length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: 'FIPS 140-3' })).toBeInTheDocument()
    expect(
      screen.getAllByText(/Requires PQC|PQC expected|Partly PQC|PQC guidance/).length
    ).toBeGreaterThan(0)
  })

  it('counts the remaining schemes instead of listing them', () => {
    renderView()
    const rest = schemes.length - expecting.length
    expect(
      screen.getByText((text) =>
        text.includes(`${rest} more certification schemes record no PQC requirement`)
      )
    ).toBeInTheDocument()
  })

  it('opens a scheme through the shared framework callback', () => {
    const onSelect = vi.fn()
    renderView(onSelect)
    fireEvent.click(screen.getByRole('button', { name: expecting[0].label }))
    expect(onSelect).toHaveBeenCalledWith(expecting[0])
  })

  it('links the test surfaces and keeps CAVP apart from a certificate', () => {
    renderView()
    expect(screen.getByRole('link', { name: /Run the ACVP vectors/ })).toHaveAttribute(
      'href',
      '/playground/hsm?tab=build&dtab=acvp'
    )
    expect(screen.getByRole('link', { name: /CAVP records/ })).toHaveAttribute(
      'href',
      '/compliance?tab=records&rtab=acvp'
    )
    expect(screen.getByText(/the prerequisite stage, not a module certificate/)).toBeInTheDocument()
  })

  it('shows the certification evidence readiness checklist and current program links', () => {
    renderView()
    expect(screen.getByText('Learn the submission evidence chain')).toBeInTheDocument()
    expect(screen.getByText(/module boundary and approved mode/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /CMVP Management Manual/ })).toBeInTheDocument()
  })
})
