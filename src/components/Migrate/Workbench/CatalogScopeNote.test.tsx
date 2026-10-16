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
    ).toEqual({
      total: 8,
      pqcRelevant: 0,
      baseline: 0,
      available: 1,
      partial: 1,
      planned: 2,
      none: 1,
      unknown: 3,
      relevant: { available: 0, partial: 0, planned: 0, none: 0, unknown: 0 },
      baselineWithPqc: 0,
      unassigned: 8,
    })
  })
})

describe('CatalogScopeNote', () => {
  it('says the catalogue is curated and not exhaustive', () => {
    render(<CatalogScopeNote items={['available', 'none'].map(item)} />)
    expect(
      screen.getByText(/curated catalogue of 2 products — not an exhaustive/)
    ).toBeInTheDocument()
  })

  it('reports the two populations separately when the catalogue carries them', () => {
    const items = [
      { pqcStatusCanonical: 'available', cataloguePopulation: 'pqc_relevant' },
      { pqcStatusCanonical: 'none', cataloguePopulation: 'migration_baseline' },
      { pqcStatusCanonical: 'none', cataloguePopulation: 'migration_baseline' },
    ] as SoftwareItem[]
    render(<CatalogScopeNote items={items} />)
    expect(screen.getByText(/1 PQC-relevant products \(1 available/)).toBeInTheDocument()
    expect(screen.getByText(/2 migration-baseline/)).toBeInTheDocument()
  })

  it('counts the status breakdown inside the PQC-relevant group only, and names unassigned rows', () => {
    const items = [
      { pqcStatusCanonical: 'available', cataloguePopulation: 'pqc_relevant' },
      { pqcStatusCanonical: 'unknown', cataloguePopulation: 'pqc_relevant' },
      { pqcStatusCanonical: 'available', cataloguePopulation: 'migration_baseline' },
      { pqcStatusCanonical: 'unknown', cataloguePopulation: '' },
    ] as SoftwareItem[]
    render(<CatalogScopeNote items={items} />)
    const text = document.body.textContent ?? ''
    expect(text).toMatch(
      /2 PQC-relevant products \(1 available · 0 partial · 0 planned or on a roadmap · 1 not yet determined\)/
    )
    expect(text).toMatch(/1 of them already have some PQC support/)
    expect(text).toMatch(/1 more are not yet assigned/)
  })
})
