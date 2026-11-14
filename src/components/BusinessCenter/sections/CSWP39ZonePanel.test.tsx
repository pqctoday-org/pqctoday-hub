// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { CSWP39ZonePanel } from './CSWP39ZonePanel'
import { ZONE_ARTIFACT_TYPES } from '../lib/cswp39StepMapping'
import { ARTIFACT_TYPE_TO_TOOL_ID, BUSINESS_TOOLS } from '../businessToolsRegistry'
import type { BusinessMetrics } from '../hooks/useBusinessMetrics'
import type { ExecutiveDocument, ExecutiveDocumentType } from '@/services/storage/types'
import type { Density } from '../lib/density'
import { BC_ZONE_EMPHASIS_BY_PERSONA } from '@/data/personaConfig'

// The tier calculation reads many metric fields this test does not need; the
// header count under test does not depend on it.
vi.mock('../lib/cswp39Tier', () => ({ computeZoneTiers: () => ({}) }))
// The advanced density renders the zone's data wire and tier badge; neither is under test.
vi.mock('./wires/GovernanceWire', () => ({ GovernanceWire: () => null }))
vi.mock('../widgets/TierBadge', () => ({ TierBadge: () => null }))

function doc(type: ExecutiveDocumentType, id: string): ExecutiveDocument {
  return { id, type, title: `${type} ${id}` } as unknown as ExecutiveDocument
}

function renderZone(
  zone: 'governance' | 'migration',
  docs: ExecutiveDocument[],
  options: { density?: Density; featured?: ExecutiveDocumentType[] } = {}
) {
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
  return render(
    <MemoryRouter>
      <CSWP39ZonePanel
        zone={zone}
        metrics={metrics}
        defaultOpen
        density={options.density ?? 'basic'}
        featuredArtifacts={options.featured}
        onViewArtifact={vi.fn()}
        onEditArtifact={vi.fn()}
        onDeleteArtifact={vi.fn()}
        onCreateArtifact={vi.fn()}
      />
    </MemoryRouter>
  )
}

function titled(type: ExecutiveDocumentType, id: string, title: string): ExecutiveDocument {
  return { id, type, title } as unknown as ExecutiveDocument
}

/** The name the zone header uses for a type: its tool name, else the type id. */
function nameOf(type: ExecutiveDocumentType): string {
  // eslint-disable-next-line security/detect-object-injection
  const toolId = ARTIFACT_TYPE_TO_TOOL_ID[type]
  return BUSINESS_TOOLS.find((t) => t.id === toolId)?.name ?? type
}

const EXECUTIVE_GOVERNANCE = BC_ZONE_EMPHASIS_BY_PERSONA.executive!.featuredArtifacts.governance!

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
    renderZone('migration', [doc(first, '1'), doc(first, '2'), doc(second, '3'), doc(second, '4')])
    const total = ZONE_ARTIFACT_TYPES.migration.length
    expect(screen.getByText(new RegExp(`^2/${total} created`))).toBeInTheDocument()
  })

  it('shows zero created when the zone has no documents', () => {
    renderZone('governance', [])
    const total = ZONE_ARTIFACT_TYPES.governance.length
    expect(screen.getByText(new RegExp(`^0/${total} created`))).toBeInTheDocument()
  })
})

describe('CSWP39ZonePanel artifact order (U-2)', () => {
  it("basic density: the executive's featured placeholders come first, in featured order", () => {
    renderZone('governance', [], { density: 'basic', featured: EXECUTIVE_GOVERNANCE })
    const missing = screen
      .getByTitle(/^Missing: /)
      .getAttribute('title')!
      .replace('Missing: ', '')
      .split(', ')
    // board-deck, roi-model, policy-draft, audit-checklist, program-charter lead the list.
    expect(missing.slice(0, 5)).toEqual(EXECUTIVE_GOVERNANCE.map((type) => nameOf(type)))
  })

  it('basic density: a created policy draft shows before every placeholder', () => {
    renderZone('governance', [titled('policy-draft', 'p1', 'Our policy')], {
      density: 'basic',
      featured: EXECUTIVE_GOVERNANCE,
    })
    const created = screen.getByText('Our policy')
    const board = screen.getByText('Board Deck')
    const roi = screen.getByText('ROI Model')
    expect(created.compareDocumentPosition(board) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(created.compareDocumentPosition(roi) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('advanced density: keeps the sub-element groups and puts created items before placeholders in each', () => {
    renderZone('governance', [titled('policy-draft', 'p1', 'Our policy')], {
      density: 'advanced',
      featured: EXECUTIVE_GOVERNANCE,
    })
    const subElement = BUSINESS_TOOLS.find(
      (t) => t.id === ARTIFACT_TYPE_TO_TOOL_ID['policy-draft']
    )?.cswp39ZoneSubElement
    expect(subElement).toBeTruthy()
    const heading = screen
      .getAllByText(subElement!)
      .find((el) => el.tagName === 'DIV' && el.className.includes('uppercase'))
    expect(heading).toBeDefined()
    const group = heading!.parentElement!
    const created = within(group).getByText('Our policy')
    const placeholders = within(group).getAllByText('Not created')
    expect(placeholders.length).toBeGreaterThan(0)
    for (const ph of placeholders) {
      expect(created.compareDocumentPosition(ph) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    }
  })
})
