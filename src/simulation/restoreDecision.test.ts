// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { decideResourceRestore, type ResourceRestoreInput } from './restoreDecision'
import { OPEN_PARAM, encodeOpen } from './resourceUrl'
import type { TreeStep } from './types'

const LEARN_STEP: TreeStep = {
  kind: 'learn',
  label: 'Learn: PQC 101',
  to: '/learn/pqc-101',
  moduleId: 'pqc-101',
}

const SCENARIO_STEP: TreeStep = {
  kind: 'scenario',
  label: 'TLS 1.3 Hybrid Lab',
  to: '/sandbox/tls-hybrid',
  scenarioId: 'tls-hybrid',
}

function makeInput(overrides: Partial<ResourceRestoreInput> = {}): ResourceRestoreInput {
  return {
    alreadyRestored: false,
    hydrated: true,
    savedStep: LEARN_STEP,
    selectedPhase: 'p1',
    searchParams: new URLSearchParams(),
    sandboxAvail: 'available',
    isScenarioStep: (s) => s.kind === 'scenario',
    canEmbedStep: () => true,
    ...overrides,
  }
}

describe('decideResourceRestore', () => {
  it('waits without latching while persisted store hydration is pending', () => {
    const decision = decideResourceRestore(makeInput({ hydrated: false }))
    expect(decision).toEqual({ action: 'wait', latch: false, reason: 'unhydrated' })
  })

  it('concludes noop WITH latch when hydrated and no step was saved (prevents first-click double open)', () => {
    const decision = decideResourceRestore(makeInput({ savedStep: null }))
    expect(decision).toEqual({ action: 'noop', latch: true, reason: 'no-saved-step' })
  })

  it('returns noop without re-running once alreadyRestored is true', () => {
    const decision = decideResourceRestore(makeInput({ alreadyRestored: true }))
    expect(decision).toEqual({ action: 'noop', latch: false, reason: 'already-restored' })
  })

  it('gives an explicit ?open= URL parameter precedence over a saved step and latches', () => {
    const params = new URLSearchParams()
    params.set(OPEN_PARAM, encodeOpen('p2', LEARN_STEP))
    const decision = decideResourceRestore(makeInput({ searchParams: params }))
    expect(decision).toEqual({ action: 'noop', latch: true, reason: 'explicit-open-param' })
  })

  it('clears the saved step when ?phase= targets a different phase than the saved selection', () => {
    const params = new URLSearchParams('phase=p3')
    const decision = decideResourceRestore(makeInput({ selectedPhase: 'p1', searchParams: params }))
    expect(decision).toEqual({ action: 'clear-saved', latch: true, reason: 'phase-param-mismatch' })
  })

  it('restores the saved step when ?phase= matches the saved selection', () => {
    const params = new URLSearchParams('phase=p1')
    const decision = decideResourceRestore(makeInput({ selectedPhase: 'p1', searchParams: params }))
    expect(decision).toEqual({
      action: 'restore',
      latch: true,
      step: LEARN_STEP,
      encodedOpen: encodeOpen('p1', LEARN_STEP),
    })
  })

  it('waits without latching for a saved sandbox scenario while sandbox availability is checking, then resolves once settled', () => {
    const checking = decideResourceRestore(
      makeInput({ savedStep: SCENARIO_STEP, sandboxAvail: 'checking' })
    )
    expect(checking).toEqual({ action: 'wait', latch: false, reason: 'sandbox-checking' })

    const available = decideResourceRestore(
      makeInput({ savedStep: SCENARIO_STEP, sandboxAvail: 'available', canEmbedStep: () => true })
    )
    expect(available).toEqual({
      action: 'restore',
      latch: true,
      step: SCENARIO_STEP,
      encodedOpen: encodeOpen('p1', SCENARIO_STEP),
    })

    const unavailable = decideResourceRestore(
      makeInput({
        savedStep: SCENARIO_STEP,
        sandboxAvail: 'unavailable',
        canEmbedStep: () => false,
      })
    )
    expect(unavailable).toEqual({
      action: 'unresolvable',
      latch: true,
      step: SCENARIO_STEP,
    })
  })

  it('does not wait on sandbox checking for non-scenario saved steps', () => {
    const decision = decideResourceRestore(
      makeInput({ savedStep: LEARN_STEP, sandboxAvail: 'checking' })
    )
    expect(decision).toEqual({
      action: 'restore',
      latch: true,
      step: LEARN_STEP,
      encodedOpen: encodeOpen('p1', LEARN_STEP),
    })
  })
})
