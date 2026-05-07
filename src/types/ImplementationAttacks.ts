// SPDX-License-Identifier: GPL-3.0-only

export type AttackPresence = 'Yes' | 'No' | 'Unknown' | 'Partial'

export interface ImplementationAttack {
  algorithm: string
  sideChannelAttacks: AttackPresence
  faultInjectionAttacks: AttackPresence
  rngFailures: AttackPresence
  secretHandlingFailures: AttackPresence
  apiMisuse: AttackPresence
  dateStamp: string
  iacrReference: string
  mitigationNotes: string
}
