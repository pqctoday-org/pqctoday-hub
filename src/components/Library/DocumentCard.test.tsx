// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import type { LibraryItem } from '../../data/libraryData'
import type { MaturityRequirement } from '@/types/MaturityTypes'

// The DocumentCard imports `maturityByRefId` at module load. Mock it before
// importing the component so the rollup logic sees a deterministic dataset.
// vi.mock is hoisted, so use vi.hoisted to share the mock map.
const { mockMaturityMap } = vi.hoisted(() => ({
  mockMaturityMap: new Map<string, import('@/types/MaturityTypes').MaturityRequirement[]>(),
}))

vi.mock('../../data/maturityGovernanceData', () => ({
  maturityByRefId: mockMaturityMap,
  maturityRequirements: [] as MaturityRequirement[],
}))

import { DocumentCard } from './DocumentCard'

const baseItem: LibraryItem = {
  referenceId: 'TEST-DOC-001',
  documentTitle: 'Test Doc',
  downloadUrl: 'https://example.com/test',
  initialPublicationDate: '2025-01-01',
  lastUpdateDate: '2025-06-01',
  documentStatus: 'Final',
  documentStatusBucket: 'Published',
  shortDescription: 'short',
  documentType: 'Standard',
  applicableIndustries: [],
  authorsOrOrganization: 'Test Body',
  dependencies: '',
  regionScope: '',
  algorithmFamily: '',
  securityLevels: '',
  protocolOrToolImpact: '',
  toolchainSupport: '',
  migrationUrgency: '',
  categories: ['NIST Standards'],
}

function makeReq(
  refId: string,
  pillar: MaturityRequirement['pillar'],
  level: MaturityRequirement['maturityLevel']
): MaturityRequirement {
  return {
    refId,
    sourceName: 'Test',
    category: 'Technical Standards',
    sourceType: 'standard',
    pillar,
    maturityLevel: level,
    assetClass: 'all',
    requirement: 'Some requirement text',
    evidenceQuote: '',
    evidenceLocation: '',
    sourceUrl: '',
    confidence: 'high',
    extractionModel: 'qwen3.6:27b',
    extractionDate: '2026-04-30',
  }
}

beforeEach(() => {
  mockMaturityMap.clear()
})

describe('DocumentCard — CSWP 39 cluster', () => {
  it('renders no CSWP 39 cluster when the doc has no enriched requirements', () => {
    render(
      <MemoryRouter>
        <DocumentCard item={baseItem} onViewDetails={() => {}} />
      </MemoryRouter>
    )
    expect(screen.queryByText('CSWP 39')).toBeNull()
  })

  it('renders pillar pills, tier dots, and a "N reqs" link when requirements exist', () => {
    mockMaturityMap.set('TEST-DOC-001', [
      makeReq('TEST-DOC-001', 'governance', 2),
      makeReq('TEST-DOC-001', 'governance', 3),
      makeReq('TEST-DOC-001', 'inventory', 2),
      makeReq('TEST-DOC-001', 'lifecycle', 4),
    ])

    render(
      <MemoryRouter>
        <DocumentCard item={baseItem} onViewDetails={() => {}} />
      </MemoryRouter>
    )

    // Cluster header
    expect(screen.getByText('CSWP 39')).toBeInTheDocument()

    // Three pillars present (governance, inventory, lifecycle); observability + assurance absent
    const govPill = screen.getByTitle(/Governance — 2 requirements/i)
    expect(govPill).toBeInTheDocument()
    expect(govPill).toHaveAttribute('href', '/business#zone-governance')

    const invPill = screen.getByTitle(/Assets — 1 requirement/i)
    expect(invPill).toHaveAttribute('href', '/business#zone-assets')

    const lifePill = screen.getByTitle(/Migration — 1 requirement/i)
    expect(lifePill).toHaveAttribute('href', '/business#zone-migration')

    // Total req count link to /compliance with the evref param
    const reqLink = screen.getByTitle(/View 4 CSWP 39 requirements/i)
    expect(reqLink).toHaveAttribute('href', '/compliance?tab=cswp39&evref=TEST-DOC-001')

    // Tier dots: tiers 2, 3, 4 covered; tier 1 not covered
    const tier1 = screen.getByLabelText('Tier 1 Partial not covered')
    const tier2 = screen.getByLabelText('Tier 2 Risk-Informed covered')
    const tier3 = screen.getByLabelText('Tier 3 Repeatable covered')
    const tier4 = screen.getByLabelText('Tier 4 Adaptive covered')
    expect(tier1).toBeInTheDocument()
    expect(tier2).toBeInTheDocument()
    expect(tier3).toBeInTheDocument()
    expect(tier4).toBeInTheDocument()
  })

  it('singular "1 req" copy when only one requirement exists', () => {
    mockMaturityMap.set('TEST-DOC-001', [makeReq('TEST-DOC-001', 'governance', 2)])

    render(
      <MemoryRouter>
        <DocumentCard item={baseItem} onViewDetails={() => {}} />
      </MemoryRouter>
    )

    expect(screen.getByTitle(/View 1 CSWP 39 requirements/i)).toBeInTheDocument()
    expect(screen.getByTitle(/Governance — 1 requirement;/i)).toBeInTheDocument()
  })
})
