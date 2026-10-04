// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { ComplianceImpactSection } from './ComplianceImpactSection'
import type { ComplianceImpact } from '../../../hooks/assessmentTypes'

vi.mock(
  'framer-motion',
  async () => (await import('../../../test/mocks/framer-motion')).framerMotionMock
)
// The applicability panel has its own tests; here it only has to mount.
vi.mock('../../applicability/ApplicabilityPanel', () => ({ ApplicabilityPanel: () => null }))

const impacts: ComplianceImpact[] = [
  {
    framework: 'PCI DSS',
    requiresPQC: false,
    deadline: 'No explicit PQC timeline yet',
    notes: 'Will follow NIST guidance.',
  },
]

const renderSection = (omitted?: string[], complianceImpacts = impacts) =>
  render(
    <MemoryRouter>
      <ComplianceImpactSection
        complianceImpacts={complianceImpacts}
        omitted={omitted}
        industry="Finance & Banking"
        country="United States"
        defaultOpen
      />
    </MemoryRouter>
  )

describe('ComplianceImpactSection — frameworks left out', () => {
  it('names the frameworks that were left out, on one line', () => {
    renderSection(['DORA (EU Digital Operational Resilience)', 'HIPAA'])
    const line = screen.getByTestId('compliance-omitted')
    expect(line).toHaveTextContent(
      'Left out because they do not apply to your country or industry: DORA (EU Digital Operational Resilience), HIPAA.'
    )
  })

  it('says nothing when nothing was left out', () => {
    renderSection()
    expect(screen.queryByTestId('compliance-omitted')).not.toBeInTheDocument()
    renderSection([])
    expect(screen.queryByTestId('compliance-omitted')).not.toBeInTheDocument()
  })

  it('still shows the line when every selected framework was left out', () => {
    renderSection(['DORA (EU Digital Operational Resilience)'], [])
    expect(screen.getByTestId('compliance-omitted')).toBeInTheDocument()
    expect(screen.queryByText('PCI DSS')).not.toBeInTheDocument()
  })
})
