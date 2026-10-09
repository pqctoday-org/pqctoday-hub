// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { ComplianceImpactSection } from './ComplianceImpactSection'
import type { ComplianceImpact } from '../../../hooks/assessmentTypes'
import { complianceFrameworks, type ComplianceFramework } from '../../../data/complianceData'
import type { BindingStatus } from '../../../utils/bindingSplit'

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

// Whether each framework binds organisations like yours. The compliance file now carries
// reviewed statuses, so every test starts with no framework classified, sets the statuses
// it needs on real frameworks, and the original values are put back afterwards.
describe('ComplianceImpactSection: binding chip', () => {
  const touched: Array<[ComplianceFramework, BindingStatus | undefined]> = []
  beforeEach(() => {
    for (const fw of complianceFrameworks) {
      if (fw.bindingStatus !== undefined) touched.push([fw, fw.bindingStatus])
      fw.bindingStatus = undefined
    }
  })
  afterEach(() => {
    while (touched.length) {
      const [fw, was] = touched.pop() as [ComplianceFramework, BindingStatus | undefined]
      fw.bindingStatus = was
    }
  })
  const mark = (fw: ComplianceFramework, status: BindingStatus) => {
    touched.push([fw, fw.bindingStatus])
    fw.bindingStatus = status
  }
  const impactFor = (fw: ComplianceFramework): ComplianceImpact => ({
    framework: fw.label,
    requiresPQC: fw.requiresPQC,
    deadline: fw.deadline,
    notes: fw.notes,
  })
  const [fwA, fwB, fwC] = complianceFrameworks

  it("shows no binding chip, and today's wording, while no framework has been reviewed", () => {
    renderSection(undefined, [impactFor(fwA)])
    expect(screen.queryByTestId('binding-chip')).not.toBeInTheDocument()
    expect(
      screen.getByText(/“mandatory” here means issued or enforced by a body/)
    ).toBeInTheDocument()
    expect(screen.queryByText(/Binding means a law/)).not.toBeInTheDocument()
  })

  it('shows Binding, Guidance or draft, or Not yet classified beside each selected framework', () => {
    mark(fwA, 'binding')
    mark(fwB, 'recommendation')
    renderSection(undefined, [impactFor(fwA), impactFor(fwB), impactFor(fwC)])
    const chips = screen.getAllByTestId('binding-chip')
    expect(chips.map((c) => c.textContent)).toEqual([
      'Binding',
      'Guidance or draft',
      'Not yet classified',
    ])
  })

  it('shows the PQC chip as well, so both facts are visible', () => {
    mark(fwA, 'binding')
    renderSection(undefined, [{ ...impactFor(fwA), requiresPQC: true }])
    const row = screen.getByText(fwA.label).closest('div')?.parentElement as HTMLElement
    expect(within(row).getByTestId('binding-chip')).toHaveTextContent('Binding')
    expect(within(row).getByText('PQC Required')).toBeInTheDocument()
  })

  it("names the basis in the chip's tooltip when the framework has one", () => {
    mark(fwA, 'binding')
    const was = fwA.bindingBasis
    fwA.bindingBasis = 'Regulation (EU) 2022/2554, Article 6'
    try {
      renderSection(undefined, [impactFor(fwA)])
      expect(screen.getByTestId('binding-chip')).toHaveAttribute(
        'title',
        expect.stringContaining('Regulation (EU) 2022/2554, Article 6')
      )
    } finally {
      fwA.bindingBasis = was
    }
  })

  it('replaces the stopgap sentence with what Binding means once frameworks are reviewed', () => {
    mark(fwA, 'binding')
    renderSection(undefined, [impactFor(fwA)])
    expect(
      screen.getByText(/Binding means a law, regulation or enforceable rule/)
    ).toBeInTheDocument()
    expect(screen.queryByText(/“mandatory” here means/)).not.toBeInTheDocument()
  })
})
