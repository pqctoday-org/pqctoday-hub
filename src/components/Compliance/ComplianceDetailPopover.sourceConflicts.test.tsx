// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { ComplianceDetailPopover } from './ComplianceDetailPopover'
import type { ComplianceRecord } from './types'

vi.mock('../ui/AskAssistantButton', () => ({ AskAssistantButton: () => null }))
vi.mock('../ui/EndorseButton', () => ({ EndorseButton: () => null }))
vi.mock('../ui/FlagButton', () => ({ FlagButton: () => null }))

// nShield5s CSA_CC_23004: the CC Portal list says AVA_VAN.4, the certificate's
// own certification report says AVA_VAN.5 (user decision 2026-09-25: show both).
const record = {
  id: 'cc-nshield5s-hardware-security-module-version-13-5-1-5a7136dc',
  source: 'Common Criteria',
  type: 'Common Criteria',
  status: 'Active',
  date: '2024-09-24',
  link: '',
  pqcCoverage: '',
  productName: 'nShield5s Hardware Security Module Version 13.5.1',
  productCategory: 'Other Devices and Systems',
  vendor: 'Entrust',
  certificationLevel: 'EAL4+,ALC_FLR.2,AVA_VAN.4',
  sourceConflicts: [
    {
      field: 'certificationLevel',
      note: 'Both are shown; neither is chosen.',
      values: [
        {
          value: 'EAL4+,ALC_FLR.2,AVA_VAN.4',
          source: 'Common Criteria Portal — certified_products.csv',
          url: 'https://www.commoncriteriaportal.org/products/certified_products.csv',
        },
        {
          value: 'EAL4 augmented by ALC_FLR.2 and AVA_VAN.5',
          source: 'Certification report CSA_CC_23004',
          url: 'https://www.commoncriteriaportal.org/files/epfiles/report.pdf',
        },
      ],
    },
  ],
} as unknown as ComplianceRecord

describe('ComplianceDetailPopover — official sources that disagree', () => {
  it('shows both values, each with its source link', () => {
    render(
      <MemoryRouter>
        <ComplianceDetailPopover isOpen onClose={() => {}} record={record} />
      </MemoryRouter>
    )
    expect(screen.getByText('Official sources disagree')).toBeInTheDocument()
    expect(screen.getByText('EAL4 augmented by ALC_FLR.2 and AVA_VAN.5')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Certification report CSA_CC_23004' })).toHaveAttribute(
      'href',
      'https://www.commoncriteriaportal.org/files/epfiles/report.pdf'
    )
    expect(
      screen.getByRole('link', { name: 'Common Criteria Portal — certified_products.csv' })
    ).toBeInTheDocument()
  })

  it('renders nothing extra when sources agree', () => {
    render(
      <MemoryRouter>
        <ComplianceDetailPopover
          isOpen
          onClose={() => {}}
          record={{ ...record, sourceConflicts: undefined }}
        />
      </MemoryRouter>
    )
    expect(screen.queryByText('Official sources disagree')).not.toBeInTheDocument()
  })
})
