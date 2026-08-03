// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useResearchFieldsStore } from './useResearchFieldsStore'

const reset = () => useResearchFieldsStore.setState({ followedFields: [] })

describe('useResearchFieldsStore — followed fields', () => {
  beforeEach(reset)

  it('starts with no followed fields', () => {
    expect(useResearchFieldsStore.getState().followedFields).toEqual([])
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

  /**
   * v2 (2026-08-02) removed `lastVisitedAt`. A visitor carrying a v0 or v1
   * state must come out the other side with the field GONE, not merely
   * ignored — an orphaned key in localStorage is what makes a later "why is
   * this here?" archaeology problem.
   */
  it('fromVersion < 2: drops lastVisitedAt from a persisted v1 state', () => {
    const migrated = migrate({ followedFields: ['lattice-based'], lastVisitedAt: 12345 }, 1)
    expect(migrated.followedFields).toEqual(['lattice-based'])
    expect(migrated).not.toHaveProperty('lastVisitedAt')
  })

  it('fromVersion < 2: drops lastVisitedAt from a persisted v0 state too', () => {
    const migrated = migrate({ lastVisitedAt: 12345 }, 0)
    expect(migrated).not.toHaveProperty('lastVisitedAt')
    expect(migrated.followedFields).toEqual([])
  })

  it('is a no-op on an already-current (v2) persisted state', () => {
    const migrated = migrate({ followedFields: ['lattice-based'] }, 2)
    expect(migrated.followedFields).toEqual(['lattice-based'])
  })

  it('handles a totally corrupt (non-object) persisted state without throwing', () => {
    expect(() => migrate(null, 0)).not.toThrow()
    expect(() => migrate('garbage-string', 0)).not.toThrow()
    const migrated = migrate(null, 0)
    expect(migrated.followedFields).toEqual([])
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
