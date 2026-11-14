// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { CSWP39ZonePanel } from './CSWP39ZonePanel'
import { ZONE_ARTIFACT_TYPES } from '../lib/cswp39StepMapping'
import type { BusinessMetrics } from '../hooks/useBusinessMetrics'
import type { ExecutiveDocument, ExecutiveDocumentType } from '@/services/storage/types'

// The tier calculation reads many metric fields this test does not need; the
// header count under test does not depend on it.
vi.mock('../lib/cswp39Tier', () => ({ computeZoneTiers: () => ({}) }))

function doc(type: ExecutiveDocumentType, id: string): ExecutiveDocument {
  return { id, type, title: `${type} ${id}` } as unknown as ExecutiveDocument
}

function renderZone(zone: 'governance' | 'migration', docs: ExecutiveDocument[]) {
  const metrics = {
    artifactsByPillar: {
      risk: [],
      compliance: [],
      governance: docs,
      vendor: [],
      inventory: [],
      architecture: [],
    },
  } as unknown as BusinessMetrics
  render(
    <MemoryRouter>
      <CSWP39ZonePanel
        zone={zone}
        metrics={metrics}
        density="basic"
        onViewArtifact={vi.fn()}
        onEditArtifact={vi.fn()}
        onDeleteArtifact={vi.fn()}
        onCreateArtifact={vi.fn()}
      />
    </MemoryRouter>
  )
}

describe('CSWP39ZonePanel created count', () => {
  it('counts distinct artifact types, not documents, so it matches the zone tile', () => {
    const [type] = ZONE_ARTIFACT_TYPES.governance
    // Three saved documents of one type: the zone has one type created.
    renderZone('governance', [doc(type, '1'), doc(type, '2'), doc(type, '3')])
    const total = ZONE_ARTIFACT_TYPES.governance.length
    expect(screen.getByText(new RegExp(`^1/${total} created`))).toBeInTheDocument()
    expect(screen.queryByText(new RegExp(`^3/${total} created`))).not.toBeInTheDocument()
  })

  it('counts each distinct created type once when types repeat', () => {
    const [first, second] = ZONE_ARTIFACT_TYPES.migration
    renderZone('migration', [
      doc(first, '1'),
      doc(first, '2'),
      doc(second, '3'),
      doc(second, '4'),
    ])
    const total = ZONE_ARTIFACT_TYPES.migration.length
    expect(screen.getByText(new RegExp(`^2/${total} created`))).toBeInTheDocument()
  })

  it('shows zero created when the zone has no documents', () => {
    renderZone('governance', [])
    const total = ZONE_ARTIFACT_TYPES.governance.length
    expect(screen.getByText(new RegExp(`^0/${total} created`))).toBeInTheDocument()
  })
})
