// SPDX-License-Identifier: GPL-3.0-only
/**
 * Tests for the learn-module change detection in the version store (B2).
 * Key invariant: a caught-up or freshly-seeded user sees NO module changes
 * (no "every module is new" spam) — only genuine catalog changes surface.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { useVersionStore } from './useVersionStore'
import { getModuleVersionFingerprint } from '../components/PKILearning/manifest/contentVersion'

describe('useVersionStore — learn-module changes (B2)', () => {
  beforeEach(() => {
    // Caught up: last-seen fingerprint equals the current catalog.
    useVersionStore.setState({ lastSeenModuleFingerprint: getModuleVersionFingerprint() })
  })

  it('reports no changes when caught up', () => {
    expect(useVersionStore.getState().getModuleChanges()).toEqual({
      added: [],
      retired: [],
      updated: [],
      renamed: [],
    })
  })

  it('reports nothing when the fingerprint is empty (not yet seeded)', () => {
    useVersionStore.setState({ lastSeenModuleFingerprint: {} })
    const c = useVersionStore.getState().getModuleChanges()
    expect(c.added.length + c.retired.length + c.updated.length + c.renamed.length).toBe(0)
  })

  it('detects a module added since last seen', () => {
    const fp = { ...getModuleVersionFingerprint() }
    delete fp['hsm-pqc'] // pretend hsm-pqc appeared after last seen
    useVersionStore.setState({ lastSeenModuleFingerprint: fp })
    expect(useVersionStore.getState().getModuleChanges().added).toContain('hsm-pqc')
  })

  it('detects a module whose content version was bumped', () => {
    useVersionStore.setState({
      lastSeenModuleFingerprint: { ...getModuleVersionFingerprint(), 'hsm-pqc': 0 },
    })
    expect(useVersionStore.getState().getModuleChanges().updated).toContain('hsm-pqc')
  })

  it('markAllSeen re-catches-up (clears module changes)', () => {
    useVersionStore.setState({ lastSeenModuleFingerprint: {} })
    useVersionStore.getState().markAllSeen()
    expect(useVersionStore.getState().getModuleChanges().added).toEqual([])
  })
})
