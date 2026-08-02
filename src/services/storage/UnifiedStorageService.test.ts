// SPDX-License-Identifier: GPL-3.0-only
/**
 * Regression test: the app-wide snapshot (Drive/backup) used to serialize
 * only `myProducts` from useMigrateSelectionStore, silently discarding a
 * user's actual Migration Workbench plan (`plan`/`choice`/`nameToProductId`)
 * on export — and dropping it again on restore, even when a snapshot somehow
 * carried it. Both directions must now round-trip the complete state.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { UnifiedStorageService } from './UnifiedStorageService'
import { useMigrateSelectionStore } from '@/store/useMigrateSelectionStore'
import { softwareData } from '@/data/migrateData'

const SAMPLE = softwareData[0]

const migrate = () => useMigrateSelectionStore.getState()

const resetMigrateStore = () =>
  useMigrateSelectionStore.setState({
    hiddenProducts: [],
    activeLayer: 'All',
    activeSubCategory: 'All',
    myProducts: [],
    viewMode: 'stack',
    workflowCollapsed: true,
    plan: [],
    choice: {},
    nameToProductId: {},
    tab: 'replace',
  })

beforeEach(resetMigrateStore)

describe('AppSnapshot ↔ migrate selection store', () => {
  it('captures the Workbench plan/choice (not just legacy myProducts) into the snapshot', () => {
    migrate().chooseProduct('tls', SAMPLE.softwareName) // the real Workbench pick path
    migrate().togglePlanAsset('some-replace-asset')
    migrate().setTab('plan')

    const snap = UnifiedStorageService.exportSnapshot()
    expect(snap.stores.migrate.plan).toContain('tls')
    expect(snap.stores.migrate.plan).toContain('some-replace-asset')
    expect(snap.stores.migrate.choice.tls).toEqual([SAMPLE.softwareName])
    expect(snap.stores.migrate.nameToProductId[SAMPLE.softwareName]).toBe(SAMPLE.productId)
    expect(snap.stores.migrate.tab).toBe('plan')
  })

  it('restores the Workbench plan/choice from a snapshot, round-tripping the complete state', () => {
    migrate().chooseProduct('vpn', SAMPLE.softwareName)
    migrate().setTab('roadmaps')
    const snap = UnifiedStorageService.exportSnapshot()

    resetMigrateStore()
    expect(migrate().choice).toEqual({})

    UnifiedStorageService.restoreSnapshot(snap)
    const s = migrate()
    expect(s.plan).toContain('vpn')
    expect(s.choice.vpn).toEqual([SAMPLE.softwareName])
    expect(s.nameToProductId[SAMPLE.softwareName]).toBe(SAMPLE.productId)
    expect(s.tab).toBe('roadmaps')
  })

  it('still round-trips legacy myProducts alongside the Workbench fields', () => {
    useMigrateSelectionStore.setState({ myProducts: ['legacy-prod-a'] })
    const snap = UnifiedStorageService.exportSnapshot()
    resetMigrateStore()
    UnifiedStorageService.restoreSnapshot(snap)
    expect(migrate().myProducts).toEqual(['legacy-prod-a'])
  })

  it('tolerates a legacy snapshot with no plan/choice/nameToProductId/tab fields (back-compat)', () => {
    const snap = UnifiedStorageService.exportSnapshot()
    // Simulate an old snapshot captured before this fix.
    const legacyMigrate = { ...snap.stores.migrate } as Record<string, unknown>
    delete legacyMigrate.plan
    delete legacyMigrate.choice
    delete legacyMigrate.nameToProductId
    delete legacyMigrate.tab
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(snap.stores as any).migrate = legacyMigrate

    migrate().chooseProduct('tls', SAMPLE.softwareName) // pre-existing state must survive
    expect(() => UnifiedStorageService.restoreSnapshot(snap)).not.toThrow()
    const s = migrate()
    expect(s.plan).toEqual([])
    expect(s.choice).toEqual({})
    expect(s.nameToProductId).toEqual({})
    expect(s.tab).toBe('replace')
  })

  it('drops malformed choice/nameToProductId entries defensively instead of throwing', () => {
    const snap = UnifiedStorageService.exportSnapshot()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(snap.stores as any).migrate = {
      ...snap.stores.migrate,
      choice: { tls: 'not-an-array' }, // malformed: should be string[]
      nameToProductId: 'not-an-object', // malformed: should be a record
      tab: 'not-a-real-tab',
    }
    expect(() => UnifiedStorageService.restoreSnapshot(snap)).not.toThrow()
    const s = migrate()
    expect(s.choice).toEqual({})
    expect(s.nameToProductId).toEqual({})
    expect(s.tab).toBe('replace')
  })
})
