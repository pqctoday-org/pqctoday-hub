// SPDX-License-Identifier: AGPL-3.0-only
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
      psk: 0,
      planned: 2,
      none: 1,
      unknown: 3,
      relevant: { available: 0, partial: 0, psk: 0, planned: 0, none: 0, unknown: 0 },
      baselineWithPqc: 0,
      baselinePsk: 0,
      unassigned: 8,
    })
  })

  it('counts a pre-shared-key-only status in its own bucket, not partial or unknown', () => {
    const c = catalogScopeCounts(['psk', 'partial', 'unknown'].map(item))
    expect(c.psk).toBe(1)
    expect(c.partial).toBe(1)
    expect(c.unknown).toBe(1)
  })

  it('keeps PSK rows out of baselineWithPqc and out of the PQC-relevant partial count', () => {
    const c = catalogScopeCounts([
      { pqcStatusCanonical: 'psk', cataloguePopulation: 'migration_baseline' },
      { pqcStatusCanonical: 'partial', cataloguePopulation: 'migration_baseline' },
      { pqcStatusCanonical: 'psk', cataloguePopulation: 'pqc_relevant' },
      { pqcStatusCanonical: 'psk', cataloguePopulation: 'pqc_relevant' },
    ] as SoftwareItem[])
    expect(c.baselineWithPqc).toBe(1)
    expect(c.baselinePsk).toBe(1)
    expect(c.relevant.psk).toBe(2)
    expect(c.relevant.partial).toBe(0)
    expect(c.psk).toBe(3)
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

  it('names the pre-shared-key-only products in both groups and says they are not PQC support', () => {
    const items = [
      { pqcStatusCanonical: 'available', cataloguePopulation: 'pqc_relevant' },
      { pqcStatusCanonical: 'psk', cataloguePopulation: 'pqc_relevant' },
      { pqcStatusCanonical: 'psk', cataloguePopulation: 'pqc_relevant' },
      { pqcStatusCanonical: 'psk', cataloguePopulation: 'migration_baseline' },
      { pqcStatusCanonical: 'partial', cataloguePopulation: 'migration_baseline' },
    ] as SoftwareItem[]
    render(<CatalogScopeNote items={items} />)
    const text = document.body.textContent ?? ''
    expect(text).toMatch(
      /3 PQC-relevant products \(1 available · 0 partial .* · 2 pre-shared key \(PSK\) only\)/
    )
    expect(text).toMatch(
      /1 of them already have some PQC support\); 1 of them rely on a pre-shared key \(PSK\) only/
    )
    expect(text).toMatch(/A pre-shared key \(PSK\) alone is not counted as PQC support\./)
  })

  it('says nothing about pre-shared keys when no product is in that status', () => {
    render(
      <CatalogScopeNote
        items={
          [
            { pqcStatusCanonical: 'available', cataloguePopulation: 'pqc_relevant' },
          ] as SoftwareItem[]
        }
      />
    )
    expect(document.body.textContent ?? '').not.toMatch(/PSK|pre-shared/)
  })

  it('names the PSK count in the single-list sentence too', () => {
    render(<CatalogScopeNote items={['available', 'psk', 'psk'].map(item)} />)
    expect(document.body.textContent ?? '').toMatch(
      /1 available · 0 partial · 2 pre-shared key \(PSK\) only, not counted as PQC support · 0 planned/
    )
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
