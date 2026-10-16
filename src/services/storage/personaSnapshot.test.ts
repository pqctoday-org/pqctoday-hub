// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Regression coverage for the Executive/GRC split's snapshot (Drive/backup)
 * behavior: a restored snapshot must round-trip a valid `grc` persona and
 * `hasAcknowledgedExecutiveGrcSplit`, and must never crash or guess a role
 * when a snapshot carries an unknown/renamed persona id — see
 * UnifiedStorageService.ts's restoreSnapshot(), "3. Persona" section.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { UnifiedStorageService } from './UnifiedStorageService'
import { usePersonaStore } from '@/store/usePersonaStore'

const resetPersonaStore = () =>
  usePersonaStore.setState({
    selectedPersona: null,
    hasSeenPersonaPicker: false,
    selectedRegion: 'global',
    selectedIndustry: null,
    selectedIndustries: [],
    suppressSuggestion: false,
    experienceLevel: null,
    viewAccess: 'unlocked',
    niceTier: 'awareness',
    niceTierOverridden: false,
    hasAcknowledgedExecutiveGrcSplit: true,
  })

beforeEach(resetPersonaStore)

describe('AppSnapshot ↔ persona store — Executive/GRC split', () => {
  it('round-trips a valid grc persona, including hasAcknowledgedExecutiveGrcSplit', () => {
    usePersonaStore.setState({ selectedPersona: 'grc', hasAcknowledgedExecutiveGrcSplit: false })
    const snap = UnifiedStorageService.exportSnapshot()
    expect(snap.stores.persona.selectedPersona).toBe('grc')
    expect(snap.stores.persona.hasAcknowledgedExecutiveGrcSplit).toBe(false)

    resetPersonaStore()
    UnifiedStorageService.restoreSnapshot(snap)
    const state = usePersonaStore.getState()
    expect(state.selectedPersona).toBe('grc')
    expect(state.hasAcknowledgedExecutiveGrcSplit).toBe(false)
  })

  it('falls back to null rather than guessing when a snapshot carries an unknown/renamed persona id', () => {
    usePersonaStore.setState({ selectedPersona: 'grc' })
    const snap = UnifiedStorageService.exportSnapshot()
    // Simulate a snapshot from a build that used a since-removed id (e.g. the
    // pre-split combined role, or a future id this build doesn't know yet).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(snap.stores.persona as any).selectedPersona = 'executive-grc-legacy'

    expect(() => UnifiedStorageService.restoreSnapshot(snap)).not.toThrow()
    expect(usePersonaStore.getState().selectedPersona).toBeNull()
  })

  it("a snapshot predating hasAcknowledgedExecutiveGrcSplit applies the same rule as the store's own v11 migration", () => {
    usePersonaStore.setState({ selectedPersona: 'executive' })
    const snap = UnifiedStorageService.exportSnapshot()
    const legacyPersona = { ...snap.stores.persona } as Record<string, unknown>
    delete legacyPersona.hasAcknowledgedExecutiveGrcSplit
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(snap.stores as any).persona = legacyPersona

    UnifiedStorageService.restoreSnapshot(snap)
    expect(usePersonaStore.getState().hasAcknowledgedExecutiveGrcSplit).toBe(false)

    // Same legacy snapshot shape, non-executive persona: nothing to acknowledge.
    resetPersonaStore()
    usePersonaStore.setState({ selectedPersona: 'developer' })
    const snap2 = UnifiedStorageService.exportSnapshot()
    const legacyPersona2 = { ...snap2.stores.persona } as Record<string, unknown>
    delete legacyPersona2.hasAcknowledgedExecutiveGrcSplit
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(snap2.stores as any).persona = legacyPersona2

    UnifiedStorageService.restoreSnapshot(snap2)
    expect(usePersonaStore.getState().hasAcknowledgedExecutiveGrcSplit).toBe(true)
  })

  it('does not delete work when switching from a restored executive snapshot to grc', () => {
    usePersonaStore.setState({
      selectedPersona: 'executive',
      selectedIndustry: 'Finance & Banking',
      selectedIndustries: ['Finance & Banking'],
    })
    const snap = UnifiedStorageService.exportSnapshot()
    resetPersonaStore()
    UnifiedStorageService.restoreSnapshot(snap)
    expect(usePersonaStore.getState().selectedPersona).toBe('executive')

    usePersonaStore.getState().setPersona('grc')
    const state = usePersonaStore.getState()
    expect(state.selectedPersona).toBe('grc')
    // setPersona only ever touches persona/tier/access fields — industry
    // selection (real user work) must survive a role switch untouched.
    expect(state.selectedIndustry).toBe('Finance & Banking')
    expect(state.selectedIndustries).toEqual(['Finance & Banking'])
  })
})
