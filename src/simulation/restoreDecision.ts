// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Pure decision function for one-shot Simulation resource restoration on load.
 *
 * Separates "still waiting for hydration or sandbox check" (`action: 'wait'`,
 * caller must NOT latch its one-shot ref) from every terminal conclusion
 * (`noop`, `clear-saved`, `restore`, `unresolvable`, where the caller latches
 * its one-shot ref so subsequent user clicks never re-trigger restoration).
 */
import { OPEN_PARAM, encodeOpen } from './resourceUrl'
import type { TreeStep } from './types'

export type SandboxAvailability = 'checking' | 'available' | 'unavailable'

export interface ResourceRestoreInput {
  alreadyRestored: boolean
  hydrated: boolean
  savedStep: TreeStep | null
  selectedPhase: string
  searchParams: URLSearchParams
  sandboxAvail: SandboxAvailability
  isScenarioStep: (step: TreeStep) => boolean
  canEmbedStep: (step: TreeStep) => boolean
}

export type ResourceRestoreDecision =
  | { action: 'wait'; latch: false; reason: 'unhydrated' | 'sandbox-checking' }
  | {
      action: 'noop'
      latch: boolean
      reason: 'already-restored' | 'no-saved-step' | 'explicit-open-param'
    }
  | { action: 'clear-saved'; latch: true; reason: 'phase-param-mismatch' }
  | { action: 'restore'; latch: true; step: TreeStep; encodedOpen: string }
  | { action: 'unresolvable'; latch: true; step: TreeStep }

export function decideResourceRestore(input: ResourceRestoreInput): ResourceRestoreDecision {
  if (input.alreadyRestored) {
    return { action: 'noop', latch: false, reason: 'already-restored' }
  }
  if (!input.hydrated) {
    return { action: 'wait', latch: false, reason: 'unhydrated' }
  }

  const saved = input.savedStep
  if (saved && input.isScenarioStep(saved) && input.sandboxAvail === 'checking') {
    return { action: 'wait', latch: false, reason: 'sandbox-checking' }
  }

  if (!saved) {
    return { action: 'noop', latch: true, reason: 'no-saved-step' }
  }

  // Direct URL `?open=` retains precedence over any previously saved step.
  if (input.searchParams.get(OPEN_PARAM)) {
    return { action: 'noop', latch: true, reason: 'explicit-open-param' }
  }

  // A `?phase=` deep link to a different phase is a deliberate jump: clear the
  // stale saved step instead of reopening an unrelated resource under the new phase.
  const phaseParam = input.searchParams.get('phase')
  if (phaseParam && phaseParam !== input.selectedPhase) {
    return { action: 'clear-saved', latch: true, reason: 'phase-param-mismatch' }
  }

  if (!input.canEmbedStep(saved)) {
    return { action: 'unresolvable', latch: true, step: saved }
  }

  return {
    action: 'restore',
    latch: true,
    step: saved,
    encodedOpen: encodeOpen(input.selectedPhase, saved),
  }
}
