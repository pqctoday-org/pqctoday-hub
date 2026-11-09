// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { RegulatoryGapAssessment } from './RegulatoryGapAssessment'

vi.mock('../data/complianceFrameworks', () => {
  const JURISDICTION_FRAMEWORKS = ['sample-a', 'sample-b'].map((id) => ({
    jurisdictionId: id,
    jurisdictionLabel: `Fictional region ${id}`,
    primaryFramework: 'Sample topics',
    secondaryFrameworks: [],
    requirements: [
      {
        id: `${id}-consideration`,
        category: 'Inventory',
        requirement: 'Review a sample inventory',
        framework: 'Teaching example',
        commonGap: false,
        effort: 'Low',
      },
    ],
  }))
  return {
    JURISDICTION_FRAMEWORKS,
    getJurisdictionFramework: (id: string) =>
      JURISDICTION_FRAMEWORKS.find((j) => j.jurisdictionId === id),
  }
})

describe('Jurisdiction selection is not a control assessment', () => {
  it('changing region leaves implementation unknown even for an unflagged catalogue topic', () => {
    const { rerender } = render(<RegulatoryGapAssessment selectedJurisdictions={['sample-a']} />)
    expect(screen.getByText('Catalogue implementation status: Not assessed')).toBeInTheDocument()
    expect(screen.queryByText('Met Requirements')).not.toBeInTheDocument()
    expect(screen.getByText('Other Review Topics')).toBeInTheDocument()
    rerender(<RegulatoryGapAssessment selectedJurisdictions={['sample-b']} />)
    expect(screen.getByText('Fictional region sample-b')).toBeInTheDocument()
    expect(screen.getByText('Catalogue implementation status: Not assessed')).toBeInTheDocument()
    expect(screen.queryByText(/^\d+ met$/)).not.toBeInTheDocument()
  })
})
