// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useResearchFieldsStore } from './useResearchFieldsStore'

const reset = () => useResearchFieldsStore.setState({ followedFields: [], lastVisitedAt: null })

describe('useResearchFieldsStore — followed fields', () => {
  beforeEach(reset)

  it('starts with no followed fields and no lastVisitedAt', () => {
    const s = useResearchFieldsStore.getState()
    expect(s.followedFields).toEqual([])
    expect(s.lastVisitedAt).toBeNull()
  })

  it('toggleFollowedField adds an unfollowed field id', () => {
    useResearchFieldsStore.getState().toggleFollowedField('lattice-based')
    expect(useResearchFieldsStore.getState().followedFields).toEqual(['lattice-based'])
  })

  it('toggleFollowedField removes an already-followed field id', () => {
    const { toggleFollowedField } = useResearchFieldsStore.getState()
    toggleFollowedField('lattice-based')
    toggleFollowedField('lattice-based')
    expect(useResearchFieldsStore.getState().followedFields).toEqual([])
  })

  it('supports following multiple fields independently', () => {
    const { toggleFollowedField } = useResearchFieldsStore.getState()
    toggleFollowedField('lattice-based')
    toggleFollowedField('hash-based')
    const s = useResearchFieldsStore.getState()
    expect(s.followedFields).toContain('lattice-based')
    expect(s.followedFields).toContain('hash-based')
    expect(s.followedFields).toHaveLength(2)
  })

  it('clearFollowedFields empties the list', () => {
    const { toggleFollowedField, clearFollowedFields } = useResearchFieldsStore.getState()
    toggleFollowedField('lattice-based')
    toggleFollowedField('hash-based')
    clearFollowedFields()
    expect(useResearchFieldsStore.getState().followedFields).toEqual([])
  })
})

describe('useResearchFieldsStore — markVisited', () => {
  beforeEach(reset)

  it('markVisited sets lastVisitedAt to a current timestamp', () => {
    const before = Date.now()
    useResearchFieldsStore.getState().markVisited()
    const after = Date.now()
    const { lastVisitedAt } = useResearchFieldsStore.getState()
    expect(lastVisitedAt).not.toBeNull()
    expect(lastVisitedAt as number).toBeGreaterThanOrEqual(before)
    expect(lastVisitedAt as number).toBeLessThanOrEqual(after)
  })

  it('a second markVisited call advances lastVisitedAt (or holds steady, never goes backwards)', () => {
    useResearchFieldsStore.getState().markVisited()
    const first = useResearchFieldsStore.getState().lastVisitedAt as number
    useResearchFieldsStore.getState().markVisited()
    const second = useResearchFieldsStore.getState().lastVisitedAt as number
    expect(second).toBeGreaterThanOrEqual(first)
  })
})

describe('useResearchFieldsStore migrate() — persistence conventions', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- accessing internal persist options
  const migrate = (useResearchFieldsStore.persist.getOptions() as any).migrate

  it('fromVersion < 1: defaults followedFields to [] when absent', () => {
    const migrated = migrate({}, 0)
    expect(migrated.followedFields).toEqual([])
  })

  it('fromVersion < 1: defaults followedFields to [] when the persisted value is not an array', () => {
    const migrated = migrate({ followedFields: 'not-an-array' }, 0)
    expect(migrated.followedFields).toEqual([])
  })

  it('fromVersion < 1: preserves a real followedFields array', () => {
    const migrated = migrate({ followedFields: ['lattice-based', 'qkd-quantum'] }, 0)
    expect(migrated.followedFields).toEqual(['lattice-based', 'qkd-quantum'])
  })

  it('fromVersion < 1: defaults lastVisitedAt to null when absent or corrupt', () => {
    expect(migrate({}, 0).lastVisitedAt).toBeNull()
    expect(migrate({ lastVisitedAt: 'garbage' }, 0).lastVisitedAt).toBeNull()
  })

  it('fromVersion < 1: preserves a real lastVisitedAt number', () => {
    const migrated = migrate({ lastVisitedAt: 12345 }, 0)
    expect(migrated.lastVisitedAt).toBe(12345)
  })

  it('is a no-op on an already-current (v1) persisted state — passes fields through unchanged', () => {
    const migrated = migrate({ followedFields: ['lattice-based'], lastVisitedAt: 12345 }, 1)
    expect(migrated.followedFields).toEqual(['lattice-based'])
    expect(migrated.lastVisitedAt).toBe(12345)
  })

  it('handles a totally corrupt (non-object) persisted state without throwing', () => {
    expect(() => migrate(null, 0)).not.toThrow()
    expect(() => migrate('garbage-string', 0)).not.toThrow()
    const migrated = migrate(null, 0)
    expect(migrated.followedFields).toEqual([])
    expect(migrated.lastVisitedAt).toBeNull()
  })

  it('declares an onRehydrateStorage crash guard (static contract check)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- accessing internal persist options
    const options = useResearchFieldsStore.persist.getOptions() as any
    expect(typeof options.onRehydrateStorage).toBe('function')
  })

  it('onRehydrateStorage logs (never throws) when rehydration errors', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- accessing internal persist options
    const options = useResearchFieldsStore.persist.getOptions() as any
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const onRehydrate = options.onRehydrateStorage()
    const rehydrationError = new Error('corrupted localStorage')

    expect(() => onRehydrate(undefined, rehydrationError)).not.toThrow()
    expect(consoleError).toHaveBeenCalledWith(
      'Research fields store rehydration failed:',
      rehydrationError
    )

    consoleError.mockRestore()
  })

  it('onRehydrateStorage is a silent no-op when there is no error', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- accessing internal persist options
    const options = useResearchFieldsStore.persist.getOptions() as any
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const onRehydrate = options.onRehydrateStorage()

    expect(() => onRehydrate(undefined, undefined)).not.toThrow()
    expect(consoleError).not.toHaveBeenCalled()

    consoleError.mockRestore()
  })
})
