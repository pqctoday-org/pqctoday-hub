// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Roles and Thresholds (workshop step 1). The roles, their purposes and the rules for lost keys
 * are the sourced sentences in `sourceClaims.ts`; the only computation here is counting keys
 * against a threshold.
 */
import type { SourceClaimId } from './sourceClaims'

export interface TufRole {
  id: 'root' | 'targets' | 'snapshot' | 'timestamp'
  name: string
  /** Sentences that describe what a signature by this role does, in the specification's words */
  claims: SourceClaimId[]
  /** Starting values for the key count and the threshold */
  defaultKeys: number
  defaultThreshold: number
}

export const TUF_ROLES: TufRole[] = [
  { id: 'root', name: 'Root', claims: ['SC-3.3', 'SC-3.7'], defaultKeys: 3, defaultThreshold: 2 },
  { id: 'targets', name: 'Targets', claims: ['SC-3.7'], defaultKeys: 2, defaultThreshold: 1 },
  { id: 'snapshot', name: 'Snapshot', claims: ['SC-3.6'], defaultKeys: 1, defaultThreshold: 1 },
  {
    id: 'timestamp',
    name: 'Timestamp',
    claims: ['SC-3.6', 'SC-3.7'],
    defaultKeys: 1,
    defaultThreshold: 1,
  },
]

export const MAX_KEYS = 5

/** Clamp a role's settings to a valid pair: 1 to MAX_KEYS keys and a threshold between 1 and the key count. */
export function normaliseRole(
  keys: number,
  threshold: number
): { keys: number; threshold: number } {
  const k = Math.min(MAX_KEYS, Math.max(1, Math.round(keys)))
  const t = Math.min(k, Math.max(1, Math.round(threshold)))
  return { keys: k, threshold: t }
}

/** By counting: an attacker who holds at least the threshold number of a role's keys can sign for the role alone. */
export function attackerCanSign(heldKeys: number, threshold: number): boolean {
  return heldKeys >= threshold
}

export type UptaneAttackerControl = 'none' | 'director' | 'image' | 'both'

export interface UptaneOutcome {
  /** Whether the attacker's control is inside the assumption the standard states */
  insideAssumption: boolean
  /** Whether the full-verification comparison applies to this ECU and could catch a mismatch */
  fullVerificationApplies: boolean
  claims: SourceClaimId[]
}

/**
 * Which sentences apply for a combination of attacker control and an ECU that does or does not
 * perform full verification. No outcome is invented: each branch points at the sentences that state it.
 */
export function uptaneOutcome(
  control: UptaneAttackerControl,
  fullVerification: boolean
): UptaneOutcome {
  if (control === 'both') {
    return {
      insideAssumption: false,
      fullVerificationApplies: fullVerification,
      claims: ['SC-3.2', 'SC-3.10'],
    }
  }
  if (control === 'none') {
    return { insideAssumption: true, fullVerificationApplies: fullVerification, claims: ['SC-3.1'] }
  }
  return {
    insideAssumption: true,
    fullVerificationApplies: fullVerification,
    claims: fullVerification ? ['SC-3.10', 'SC-3.2'] : ['SC-3.10', 'SC-3.1'],
  }
}
