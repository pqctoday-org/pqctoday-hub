// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { GovernanceWire } from './GovernanceWire'
import type { BusinessMetrics } from '../../hooks/useBusinessMetrics'
import type { ThreatData } from '@/data/threatsData'

// Rows use the labels the published threat data carries (see
// INDUSTRY_TO_THREATS_MAP in personaConfig.ts).
const rows = [
  { threatId: 'T-FIN', industry: 'Finance & Banking', description: 'Bank threat' },
  { threatId: 'T-HC', industry: 'Healthcare / Pharmaceutical', description: 'Clinical threat' },
  { threatId: 'T-IT', industry: 'IT Industry / Software', description: 'Software threat' },
  { threatId: 'T-CLOUD', industry: 'Cloud Computing / Data Centers', description: 'Cloud threat' },
  { threatId: 'T-OT', industry: 'Critical Infrastructure / OT', description: 'OT threat' },
  { threatId: 'T-IOT', industry: 'Internet of Things (IoT)', description: 'IoT threat' },
  { threatId: 'T-SUPPLY', industry: 'Supply Chain / Logistics', description: 'Supply threat' },
].map((r) => ({
  ...r,
  criticality: 'High',
  cryptoAtRisk: '',
  pqcReplacement: '',
  mainSource: '',
  sourceUrl: '',
  relatedModules: [],
})) as unknown as ThreatData[]

vi.mock('@/hooks/useThreatsData', () => ({
  useThreatsData: () => ({ data: rows, loading: false, error: null }),
}))

function renderFor(industry: string) {
  const metrics = {
    industry,
    country: '',
    trackedFrameworks: [],
    bookmarkedProducts: [],
  } as unknown as BusinessMetrics
  render(
    <MemoryRouter>
      <GovernanceWire metrics={metrics} />
    </MemoryRouter>
  )
}

describe('GovernanceWire industry threats', () => {
  it('shows threats for Healthcare', () => {
    renderFor('Healthcare')
    expect(screen.getByText('Clinical threat')).toBeInTheDocument()
  })

  it('shows threats for Technology from its mapped sector labels', () => {
    renderFor('Technology')
    expect(screen.getByText('Software threat')).toBeInTheDocument()
    expect(screen.getByText('Cloud threat')).toBeInTheDocument()
    expect(screen.getByText('IoT threat')).toBeInTheDocument()
    expect(screen.getByText('Supply threat')).toBeInTheDocument()
  })

  it('shows threats for Manufacturing from its mapped labels', () => {
    renderFor('Manufacturing')
    expect(screen.getByText('OT threat')).toBeInTheDocument()
    expect(screen.getByText('IoT threat')).toBeInTheDocument()
  })

  it('still shows Finance & Banking threats', () => {
    renderFor('Finance & Banking')
    expect(screen.getByText('Bank threat')).toBeInTheDocument()
    expect(screen.queryByText('Clinical threat')).not.toBeInTheDocument()
  })

  it('shows nothing for an industry with no mapped rows (no cross-industry fallback)', () => {
    renderFor('Automotive')
    expect(screen.queryByText(/Threats ·/)).not.toBeInTheDocument()
  })
})
