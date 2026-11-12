// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useVendorConcentrationRisks } from './vendorConcentrationRisk'
const state = vi.hoisted(() => ({
  selected: [] as string[],
  items: [
    {
      productId: 'validated',
      pqcStatusCanonical: 'available',
      hasCertification: 'yes',
      fipsValidated: 'Yes (FIPS 140-3)',
    },
    {
      productId: 'algorithms-only',
      pqcStatusCanonical: 'available',
      hasCertification: 'cavp',
      fipsValidated: 'CAVP only',
    },
    {
      productId: 'pending',
      pqcStatusCanonical: 'available',
      hasCertification: 'in_progress',
      fipsValidated: 'In process',
    },
    {
      productId: 'unrecorded',
      pqcStatusCanonical: 'available',
      hasCertification: 'no',
      fipsValidated: 'No',
    },
    {
      productId: 'planned',
      pqcStatusCanonical: 'roadmap',
      hasCertification: 'no',
      fipsValidated: 'No',
    },
  ],
}))
vi.mock('@/data/migrateData', () => ({ softwareData: state.items, vendorMap: new Map() }))
vi.mock('@/data/migrationAssets', () => ({ REPLACE_ASSETS: [] }))
vi.mock('./workbenchCatalog', () => ({ productsForDomain: () => [] }))
vi.mock('@/store/useMigrateSelectionStore', () => ({ useSelectedProductIds: () => state.selected }))
const gap = () =>
  renderHook(() => useVendorConcentrationRisks()).result.current.find((c) => c.key === 'cert-gap')!
beforeEach(() => {
  state.selected = []
})
describe('Catalog module-validation evidence denominator', () => {
  it('counts CAVP, in-process and missing records as gaps, excluding nonavailable products', () => {
    expect(gap()).toMatchObject({ headline: '75%', severe: true })
    expect(gap().detail).toContain('3 of 4 available catalog products')
  })
  it.each(['algorithms-only', 'pending'])(
    'does not report completed module validation for %s',
    (id) => {
      state.selected = [id]
      expect(gap().headline).toBe('100%')
      expect(gap().detail).toContain('1 of 1 available selected products')
    }
  )
  it('preserves the scoped recorded certificate as a zero gap', () => {
    state.selected = ['validated']
    expect(gap()).toMatchObject({ headline: '0%', severe: false })
  })
})
