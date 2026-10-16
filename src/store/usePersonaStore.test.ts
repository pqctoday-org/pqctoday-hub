// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, beforeEach } from 'vitest'
import { usePersonaStore } from './usePersonaStore'

describe('usePersonaStore — hasSkippedPersonalization (Role Home escape hatch)', () => {
  beforeEach(() => {
    usePersonaStore.setState({
      selectedPersona: null,
      hasSeenPersonaPicker: false,
      hasSkippedPersonalization: false,
    })
  })

  it('defaults to false', () => {
    expect(usePersonaStore.getState().hasSkippedPersonalization).toBe(false)
  })

  it('skipPersonalization sets the flag true without selecting a persona or touching hasSeenPersonaPicker', () => {
    usePersonaStore.getState().skipPersonalization()
    const state = usePersonaStore.getState()
    expect(state.hasSkippedPersonalization).toBe(true)
    expect(state.selectedPersona).toBeNull()
    expect(state.hasSeenPersonaPicker).toBe(false)
  })

  it('is distinct from setPersona(null), which still means "clear the persona"', () => {
    usePersonaStore.getState().skipPersonalization()
    expect(usePersonaStore.getState().selectedPersona).toBeNull()
    expect(usePersonaStore.getState().hasSkippedPersonalization).toBe(true)

    // setPersona(null) is a different, pre-existing action and must not be
    // repurposed by this new flag.
    usePersonaStore.getState().setPersona('developer')
    expect(usePersonaStore.getState().hasSkippedPersonalization).toBe(true)
  })

  it('clearPreferences resets hasSkippedPersonalization back to false', () => {
    usePersonaStore.getState().skipPersonalization()
    usePersonaStore.getState().clearPreferences()
    expect(usePersonaStore.getState().hasSkippedPersonalization).toBe(false)
  })
})

describe('usePersonaStore migrate() — version 10 adds hasSkippedPersonalization', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- accessing internal persist options
  const migrate = (usePersonaStore.persist.getOptions() as any).migrate

  it('fromVersion < 10: defaults hasSkippedPersonalization to false when absent', () => {
    const legacyState = { selectedPersona: 'executive', hasSeenPersonaPicker: true }
    const migrated = migrate(legacyState, 9)
    expect(migrated.hasSkippedPersonalization).toBe(false)
    // Pre-existing fields untouched.
    expect(migrated.selectedPersona).toBe('executive')
    expect(migrated.hasSeenPersonaPicker).toBe(true)
  })

  it('fromVersion < 10: preserves an existing value instead of clobbering it', () => {
    const legacyState = { hasSkippedPersonalization: true }
    const migrated = migrate(legacyState, 9)
    expect(migrated.hasSkippedPersonalization).toBe(true)
  })

  it('is a no-op on an already-current (v10) persisted state', () => {
    const currentState = { hasSkippedPersonalization: true, selectedPersona: null }
    const migrated = migrate(currentState, 10)
    expect(migrated.hasSkippedPersonalization).toBe(true)
  })

  it('handles a null/undefined persisted state without throwing', () => {
    expect(() => migrate(undefined, 0)).not.toThrow()
    expect(migrate(undefined, 0).hasSkippedPersonalization).toBe(false)
  })
})

describe('usePersonaStore migrate() — version 11 adds hasAcknowledgedExecutiveGrcSplit', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- accessing internal persist options
  const migrate = (usePersonaStore.persist.getOptions() as any).migrate

  it('fromVersion < 11: a legacy executive store has something to acknowledge', () => {
    const legacyState = { selectedPersona: 'executive', hasSeenPersonaPicker: true }
    const migrated = migrate(legacyState, 10)
    expect(migrated.hasAcknowledgedExecutiveGrcSplit).toBe(false)
    // Pre-existing fields untouched.
    expect(migrated.selectedPersona).toBe('executive')
  })

  it('fromVersion < 11: a non-executive persona has nothing to acknowledge', () => {
    const legacyState = { selectedPersona: 'developer' }
    const migrated = migrate(legacyState, 10)
    expect(migrated.hasAcknowledgedExecutiveGrcSplit).toBe(true)
  })

  it('fromVersion < 11: no persona selected yet has nothing to acknowledge', () => {
    const migrated = migrate({ selectedPersona: null }, 10)
    expect(migrated.hasAcknowledgedExecutiveGrcSplit).toBe(true)
  })

  it('fromVersion < 11: respects an already-boolean fixture value instead of recomputing it', () => {
    // A real pre-v11 store never has this key — this is the escape hatch a
    // test fixture uses to seed a settled, already-acknowledged 'executive'
    // store without also bumping its seeded version (see e2e specs that seed
    // 'executive' at pre-v11 versions).
    const alreadyAcknowledged = migrate(
      { selectedPersona: 'executive', hasAcknowledgedExecutiveGrcSplit: true },
      0
    )
    expect(alreadyAcknowledged.hasAcknowledgedExecutiveGrcSplit).toBe(true)

    const explicitlyUnacknowledged = migrate(
      { selectedPersona: 'developer', hasAcknowledgedExecutiveGrcSplit: false },
      0
    )
    expect(explicitlyUnacknowledged.hasAcknowledgedExecutiveGrcSplit).toBe(false)
  })

  it('is a no-op on an already-current (v11) persisted state', () => {
    const currentState = { hasAcknowledgedExecutiveGrcSplit: false, selectedPersona: 'executive' }
    const migrated = migrate(currentState, 11)
    expect(migrated.hasAcknowledgedExecutiveGrcSplit).toBe(false)
  })

  it('handles a null/undefined persisted state without throwing', () => {
    expect(() => migrate(undefined, 0)).not.toThrow()
    expect(migrate(undefined, 0).hasAcknowledgedExecutiveGrcSplit).toBe(true)
  })
})

describe('usePersonaStore — acknowledgeExecutiveGrcSplit (notice actions)', () => {
  beforeEach(() => {
    usePersonaStore.setState({
      selectedPersona: 'executive',
      hasAcknowledgedExecutiveGrcSplit: false,
    })
  })

  it('clearPreferences resets the flag back to true', () => {
    usePersonaStore.getState().clearPreferences()
    expect(usePersonaStore.getState().hasAcknowledgedExecutiveGrcSplit).toBe(true)
  })

  it('sets the flag true without changing the selected persona', () => {
    usePersonaStore.getState().acknowledgeExecutiveGrcSplit()
    const state = usePersonaStore.getState()
    expect(state.hasAcknowledgedExecutiveGrcSplit).toBe(true)
    expect(state.selectedPersona).toBe('executive')
  })

  it('setPersona to grc does not itself acknowledge the notice', () => {
    usePersonaStore.getState().setPersona('grc')
    expect(usePersonaStore.getState().hasAcknowledgedExecutiveGrcSplit).toBe(false)
  })
})
