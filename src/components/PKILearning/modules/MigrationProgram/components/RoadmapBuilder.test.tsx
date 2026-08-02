// SPDX-License-Identifier: GPL-3.0-only
/**
 * Regression test for the "Roadmap Builder never receives picks made in the
 * Migration Workbench" bug: RoadmapBuilder used to read `myProducts` alone
 * from useMigrateSelectionStore, but the real Migration Workbench (the
 * Replace tab under /migrate) only ever calls `chooseProduct`, which writes
 * `choice`/`plan` — never `myProducts`. That left every real user pick
 * invisible to this tool's Mitigation Gateway section.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RoadmapBuilder } from './RoadmapBuilder'
import { useMigrateSelectionStore } from '@/store/useMigrateSelectionStore'
import { softwareData } from '@/data/migrateData'
import type { ExecutiveDocument } from '@/services/storage/types'

// A real catalog product that matches the Mitigation Gateway section's
// gateway-category filter (/gateway|sase|zero[\s-]?trust|tls/i), so it's a
// genuine candidate the "+ Mine" / "★ Mine" toggle can target.
const GATEWAY = softwareData.find((p) =>
  /gateway|sase|zero[\s-]?trust|tls/i.test(p.categoryName || '')
)
if (!GATEWAY)
  throw new Error('Fixture assumption broken: no gateway-category product in the catalog')

const addExecutiveDocument = vi.fn()
let mockExecutiveDocuments: ExecutiveDocument[] = []

vi.mock('@/store/useModuleStore', () => ({
  useModuleStore: (selector?: (s: unknown) => unknown) => {
    const state = {
      addExecutiveDocument,
      artifacts: { executiveDocuments: mockExecutiveDocuments },
    }
    return selector ? selector(state) : state
  },
}))

const resetMigrateStore = () =>
  useMigrateSelectionStore.setState({
    myProducts: [],
    choice: {},
    plan: [],
    nameToProductId: {},
  })

// Seed a saved roadmap with one mitigation row already pointed at GATEWAY, so
// the "Mine" toggle button renders immediately without needing to drive the
// FilterDropdown interaction.
const seedMitigationRow = () => {
  mockExecutiveDocuments = [
    {
      id: 'seed-roadmap-1',
      moduleId: 'migration-program',
      type: 'migration-roadmap',
      title: 'PQC Migration Roadmap',
      data: '',
      createdAt: Date.now(),
      inputs: {
        mitigations: [
          {
            asset: 'Legacy MQ',
            gatewayProductId: GATEWAY!.productId,
            reason: 'blocked',
            sunset: '2030-01-01',
          },
        ],
      },
    },
  ]
}

describe('RoadmapBuilder — reflects real Migration Workbench picks', () => {
  beforeEach(() => {
    resetMigrateStore()
    mockExecutiveDocuments = []
    addExecutiveDocument.mockClear()
  })

  it('shows "+ Mine" (not selected) for a gateway product nobody has chosen', () => {
    seedMitigationRow()
    render(<RoadmapBuilder />)
    expect(screen.getByRole('button', { name: /\+ Mine/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /★ Mine/i })).not.toBeInTheDocument()
  })

  it('shows "★ Mine" for a product picked via the real Workbench chooseProduct action (not toggleMyProduct)', () => {
    // This is exactly what ReplaceTab.tsx's onChoose handler calls when a
    // user picks a replacement product in the real /migrate Workbench —
    // never toggleMyProduct.
    useMigrateSelectionStore.getState().chooseProduct('tls', GATEWAY!.softwareName)
    // Sanity: this really did NOT touch the legacy myProducts list.
    expect(useMigrateSelectionStore.getState().myProducts).toEqual([])

    seedMitigationRow()
    render(<RoadmapBuilder />)
    expect(screen.getByRole('button', { name: /★ Mine/i })).toBeInTheDocument()
  })

  it('still recognizes a legacy toggleMyProduct bookmark (back-compat)', () => {
    useMigrateSelectionStore.getState().toggleMyProduct(GATEWAY!.productId)
    seedMitigationRow()
    render(<RoadmapBuilder />)
    expect(screen.getByRole('button', { name: /★ Mine/i })).toBeInTheDocument()
  })
})
