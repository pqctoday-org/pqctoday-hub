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
  { threatId: 'T-CROSS', industry: 'Cross-Industry', description: 'Cross threat' },
  { threatId: 'T-CROSS-HSM', industry: 'Cross-Industry / HSM', description: 'HSM cross threat' },
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

  it('shows only the cross-industry heading for an industry with no rows of its own', () => {
    renderFor('Automotive')
    expect(screen.queryByText(/Threats ·/)).not.toBeInTheDocument()
    expect(screen.getByText('Applies to every sector')).toBeInTheDocument()
    expect(screen.getByText('Cross threat')).toBeInTheDocument()
  })

  it('Retail & E-Commerce shows only the cross-industry heading', () => {
    renderFor('Retail & E-Commerce')
    expect(screen.queryByText(/Threats ·/)).not.toBeInTheDocument()
    expect(screen.getAllByText('Applies to every sector')).toHaveLength(1)
    expect(screen.getByText('Cross threat')).toBeInTheDocument()
    expect(screen.getByText('HSM cross threat')).toBeInTheDocument()
  })

  it('Finance shows its own threats, then the cross-industry heading', () => {
    renderFor('Finance & Banking')
    const own = screen.getByText('Bank threat')
    const heading = screen.getByText('Applies to every sector')
    const cross = screen.getByText('Cross threat')
    expect(own.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(heading.compareDocumentPosition(cross) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('never shows a cross-industry row twice', () => {
    renderFor('Finance & Banking')
    expect(screen.getAllByText('Cross threat')).toHaveLength(1)
    expect(screen.getAllByText('HSM cross threat')).toHaveLength(1)
  })

  it('shows no threats block without an industry', () => {
    renderFor('')
    expect(screen.queryByText('Applies to every sector')).not.toBeInTheDocument()
    expect(screen.queryByText(/Threats ·/)).not.toBeInTheDocument()
  })
})
