// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { SoftwareItem } from '@/types/MigrateTypes'
import { CatalogScopeNote, catalogScopeCounts } from './CatalogScopeNote'

const item = (pqcStatusCanonical: string) => ({ pqcStatusCanonical }) as SoftwareItem

describe('catalogScopeCounts', () => {
  it('buckets canonical statuses and folds roadmap/planned', () => {
    expect(
      catalogScopeCounts(
        ['available', 'partial', 'roadmap', 'planned', 'none', 'unknown', '', 'pending'].map(item)
      )
    ).toEqual({ total: 8, available: 1, partial: 1, planned: 2, none: 1, unknown: 3 })
  })
})

describe('CatalogScopeNote', () => {
  it('says the catalogue is curated and not exhaustive', () => {
    render(<CatalogScopeNote items={['available', 'none'].map(item)} />)
    expect(
      screen.getByText(/curated catalogue of 2 products — not an exhaustive/)
    ).toBeInTheDocument()
  })
})
