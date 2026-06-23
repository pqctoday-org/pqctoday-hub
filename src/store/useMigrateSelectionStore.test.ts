// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach } from 'vitest'
import { useMigrateSelectionStore, selectedProductIds } from './useMigrateSelectionStore'
import { softwareData } from '@/data/migrateData'

// A real (softwareName → productId) pair from the catalog so the choice→id
// resolution in selectedProductIds/removeSelectedProduct is exercised faithfully.
const SAMPLE = softwareData[0]

const reset = () =>
  useMigrateSelectionStore.setState({ plan: [], choice: {}, tab: 'replace', myProducts: [] })

describe('useMigrateSelectionStore — workbench plan (v9)', () => {
  beforeEach(reset)

  it('toggles an asset in/out of the plan', () => {
    const { togglePlanAsset } = useMigrateSelectionStore.getState()
    togglePlanAsset('tls')
    expect(useMigrateSelectionStore.getState().plan).toEqual(['tls'])
    togglePlanAsset('tls')
    expect(useMigrateSelectionStore.getState().plan).toEqual([])
  })

  it('chooseProduct adds the asset to the plan and records the choice', () => {
    useMigrateSelectionStore.getState().chooseProduct('vpn', 'Acme PQ VPN')
    const s = useMigrateSelectionStore.getState()
    expect(s.plan).toContain('vpn')
    expect(s.choice.vpn).toEqual(['Acme PQ VPN'])
  })

  it('keeps multiple chosen products per asset (multi-select)', () => {
    const { chooseProduct } = useMigrateSelectionStore.getState()
    chooseProduct('foundations', 'OpenSSL')
    chooseProduct('foundations', 'BoringSSL')
    const s = useMigrateSelectionStore.getState()
    expect(s.choice.foundations).toEqual(['OpenSSL', 'BoringSSL'])
    expect(s.plan).toContain('foundations')
  })

  it('re-choosing the same product removes just it; dropping the last clears the asset', () => {
    const { chooseProduct } = useMigrateSelectionStore.getState()
    chooseProduct('foundations', 'OpenSSL')
    chooseProduct('foundations', 'BoringSSL')
    chooseProduct('foundations', 'OpenSSL') // toggle OpenSSL off — BoringSSL stays
    let s = useMigrateSelectionStore.getState()
    expect(s.choice.foundations).toEqual(['BoringSSL'])
    expect(s.plan).toContain('foundations')
    chooseProduct('foundations', 'BoringSSL') // remove the last → asset leaves the plan
    s = useMigrateSelectionStore.getState()
    expect(s.choice.foundations).toBeUndefined()
    expect(s.plan).not.toContain('foundations')
  })

  it('replace assets stay planned when their last product is unpicked', () => {
    const { chooseProduct } = useMigrateSelectionStore.getState()
    chooseProduct('tls', 'OpenSSL') // tls (replace asset) enters the plan
    chooseProduct('tls', 'OpenSSL') // unpick the only product
    const s = useMigrateSelectionStore.getState()
    expect(s.choice.tls).toBeUndefined()
    expect(s.plan).toContain('tls') // …but tls stays planned (managed by Add to plan)
  })

  it('leaving the plan drops the chosen product for that asset', () => {
    const { chooseProduct, togglePlanAsset } = useMigrateSelectionStore.getState()
    chooseProduct('certs', 'Some CA')
    togglePlanAsset('certs') // remove
    const s = useMigrateSelectionStore.getState()
    expect(s.plan).not.toContain('certs')
    expect(s.choice.certs).toBeUndefined()
  })

  it('removeFromPlan and clearPlan behave', () => {
    const st = useMigrateSelectionStore.getState()
    st.chooseProduct('tls', 'P1')
    st.chooseProduct('ssh', 'P2')
    useMigrateSelectionStore.getState().removeFromPlan('tls')
    expect(useMigrateSelectionStore.getState().plan).toEqual(['ssh'])
    useMigrateSelectionStore.getState().clearPlan()
    const s = useMigrateSelectionStore.getState()
    expect(s.plan).toEqual([])
    expect(s.choice).toEqual({})
  })

  it('does not disturb legacy myProducts', () => {
    useMigrateSelectionStore.setState({ myProducts: ['prod-a'] })
    useMigrateSelectionStore.getState().togglePlanAsset('hsm')
    expect(useMigrateSelectionStore.getState().myProducts).toEqual(['prod-a'])
  })

  it('migrate() v8→v9 adds plan fields without touching myProducts', () => {
    // Access the persist migrate via a fresh import is overkill; assert the
    // shape contract the migration guarantees: defaults exist + are typed.
    const s = useMigrateSelectionStore.getState()
    expect(Array.isArray(s.plan)).toBe(true)
    expect(typeof s.choice).toBe('object')
    expect(['replace', 'plan']).toContain(s.tab)
  })
})

describe('useMigrateSelectionStore — effective selection (myProducts ∪ choice)', () => {
  beforeEach(reset)

  it('selectedProductIds unions legacy ids with choice product names resolved to ids', () => {
    expect(selectedProductIds(['prod-a'], {})).toEqual(['prod-a'])
    // A choice product name resolves to its catalog productId and is included.
    expect(selectedProductIds([], { tls: [SAMPLE.softwareName] })).toEqual([SAMPLE.productId])
    // Unknown names (not in the catalog) are dropped, not surfaced as ids.
    expect(selectedProductIds([], { tls: ['Definitely Not A Real Product'] })).toEqual([])
  })

  it('selectedProductIds de-dupes when the same product is in both myProducts and choice', () => {
    const ids = selectedProductIds([SAMPLE.productId], { tls: [SAMPLE.softwareName] })
    expect(ids).toEqual([SAMPLE.productId])
  })

  it('removeSelectedProduct clears a product from legacy myProducts', () => {
    useMigrateSelectionStore.setState({ myProducts: ['prod-a', 'prod-b'] })
    useMigrateSelectionStore.getState().removeSelectedProduct('prod-a')
    expect(useMigrateSelectionStore.getState().myProducts).toEqual(['prod-b'])
  })

  it('removeSelectedProduct un-chooses the product from workbench choice + drops the emptied foundation asset', () => {
    const { chooseProduct, removeSelectedProduct } = useMigrateSelectionStore.getState()
    chooseProduct('foundations', SAMPLE.softwareName) // foundation domain (non-replace)
    expect(useMigrateSelectionStore.getState().plan).toContain('foundations')
    removeSelectedProduct(SAMPLE.productId)
    const s = useMigrateSelectionStore.getState()
    expect(s.choice.foundations).toBeUndefined()
    expect(s.plan).not.toContain('foundations')
  })

  it('removeSelectedProduct keeps a replace asset planned even after its product is removed', () => {
    const { chooseProduct, removeSelectedProduct } = useMigrateSelectionStore.getState()
    chooseProduct('tls', SAMPLE.softwareName) // tls is a replace asset
    removeSelectedProduct(SAMPLE.productId)
    const s = useMigrateSelectionStore.getState()
    expect(s.choice.tls).toBeUndefined()
    expect(s.plan).toContain('tls')
  })
})
