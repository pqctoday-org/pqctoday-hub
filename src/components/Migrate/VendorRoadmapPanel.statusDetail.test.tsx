// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { VendorRoadmapPanel } from './VendorRoadmapPanel'
import type { VendorRoadmap, VendorRoadmapEnrichment } from '@/types/MigrateTypes'

const roadmap: VendorRoadmap = {
  vendorId: 'v1',
  vendorName: 'Acme Corp',
  roadmapUrl: 'https://example.com/roadmap',
  roadmapTitle: 'Acme roadmap',
  roadmapType: '',
  publishDate: '',
  lastVerifiedDate: '',
  coverageNotes: '',
  compositeId: 'v1|https://example.com/roadmap',
}

function enrichment(currentGaStatus: string): VendorRoadmapEnrichment {
  return {
    vendorId: 'v1',
    roadmapUrl: 'https://example.com/roadmap',
    roadmapScope: '',
    pqcAlgorithms: [],
    targetMigrationDates: '',
    productsCovered: '',
    complianceFrameworks: [],
    hybridModeSupport: '',
    currentGaStatus,
    customerActionRequired: '',
    keyQuotes: [],
    extractionQuality: 'HIGH',
  }
}

describe('VendorRoadmapPanel availability chip', () => {
  it('shows which capabilities are GA and which are preview when the chip names both', () => {
    const status = 'GA (algorithms in the OS); Preview (hybrid key exchange)'
    render(<VendorRoadmapPanel roadmap={roadmap} enrichment={enrichment(status)} />)
    expect(screen.getByText('GA + Preview')).toHaveAttribute('title', status)
  })

  it('adds no tooltip to a bare single-state chip', () => {
    render(<VendorRoadmapPanel roadmap={roadmap} enrichment={enrichment('GA')} />)
    expect(screen.getByText('GA')).not.toHaveAttribute('title')
  })
})
