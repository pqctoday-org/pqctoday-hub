// SPDX-License-Identifier: AGPL-3.0-only
import type { PQCPosture, PaymentNetwork, RadarAxisKey } from './emvConstants'
import { cardCountExclusionReason } from './networkVolumeComparison'

/**
 * Rubric and scoring rules for the Network Comparator radar.
 *
 * A score is only given where this page shows a sourced basis for it. Where it does not, the
 * axis is "not scored" (null), which is different from 0: a 0 would mean the criterion does not
 * apply, and missing evidence is never turned into a number. The scores are teaching aids, not
 * measurements and not a rating of any company.
 */

export type { RadarAxisKey }

export interface RadarRubricEntry {
  key: RadarAxisKey
  label: string
  /** The question the score answers. */
  question: string
  /** What a higher score means, so the direction is never guessed. */
  direction: string
  /** Anchors at 0, 1, 3 and 5. Scores 2 and 4 sit between their neighbours. */
  anchors: { zero: string; one: string; three: string; five: string }
  /** The rule that turns evidence on this page into a score, or says why none can be given. */
  rule: string
  /** The evidence a learner should look for before agreeing or disagreeing. */
  evidenceToCheck: string
}

export const RADAR_RUBRIC: readonly RadarRubricEntry[] = [
  {
    key: 'scale',
    label: 'Scale',
    question:
      'How large is the network’s issuance footprint compared with the others that have a dated, comparable card count?',
    direction:
      'Higher means a larger footprint, and so more cards and terminals affected by one decision.',
    anchors: {
      zero: 'Not used: a network without a comparable count is not scored.',
      one: 'Under 10% of the largest dated count.',
      three: '25% to under 50% of the largest dated count.',
      five: '75% or more of the largest dated count.',
    },
    rule: 'Share of the largest comparable card count (same date, exact figure): 75% or more is 5, 50% to under 75% is 4, 25% to under 50% is 3, 10% to under 25% is 2, under 10% is 1. A network with no comparable count is not scored.',
    evidenceToCheck: 'The dated card counts on this page and the scope notes that come with them.',
  },
  {
    key: 'offlineExposure',
    label: 'Offline Exposure',
    question:
      'How much of the network’s card-present estate relies on offline card authentication with public-key signatures?',
    direction:
      'Higher means more reliance on offline authentication, which stays vulnerable to forged certificates until cards are replaced.',
    anchors: {
      zero: 'No offline public-key authentication is used.',
      one: 'Offline authentication is rare in the network’s card-present estate.',
      three: 'Offline authentication is common in some regions or products.',
      five: 'Offline authentication is widespread across the card-present estate.',
    },
    rule: 'Needs a figure for the share of the estate that uses offline authentication. No network figure of that kind is shown on this page, so every network is not scored. Which methods a network lists does not say how widely it uses them.',
    evidenceToCheck:
      'The offline authentication methods listed for the network, and your own terminal and card inventory.',
  },
  {
    key: 'tokenization',
    label: 'Tokenization',
    question:
      'How far does the network’s tokenization platform cover payments that are not card-present?',
    direction:
      'Higher means a more established token service, which can reduce how often a primary account number is exposed.',
    anchors: {
      zero: 'No token service applies.',
      one: 'A token service exists with limited reach.',
      three: 'A token service is established across several payment contexts.',
      five: 'A token service is the default in the main digital payment contexts.',
    },
    rule: 'Needs a figure or source for the reach of the token service. The page names each platform but gives no reach, so every network is not scored.',
    evidenceToCheck:
      'The token platform named for the network and your own wallet and e-commerce flows.',
  },
  {
    key: 'pqcReadiness',
    label: 'PQC Readiness',
    question:
      'How much public evidence is there of the network preparing for post-quantum cryptography?',
    direction:
      'Higher means more public evidence of preparation. It is not a measure of how safe the network is today.',
    anchors: {
      zero: 'Not used for missing evidence: no public evidence is shown as no public evidence, never as 0.',
      one: 'Little or no network-specific public evidence: shared EMVCo standards work or an internal readiness programme at most.',
      three:
        'Network-specific published guidance with concrete steps, or publicly described prototype tests, without a committed rollout.',
      five: 'A committed, dated production rollout is public.',
    },
    rule: 'From the network’s posture label: shared standards work only is 1; an internal readiness programme only is 1; published guidance that is not scoped to the card network is 2; publicly described prototypes together with published guidance, with no committed rollout, is 4.',
    evidenceToCheck:
      'The posture, official stance and public evidence shown on each network’s card.',
  },
  {
    key: 'regulatoryPressure',
    label: 'Regulatory',
    question: 'How much regulatory or supervisory attention applies to the network’s operations?',
    direction: 'Higher means more external pressure to document and manage cryptographic risk.',
    anchors: {
      zero: 'No regulatory attention applies to the criterion as defined.',
      one: 'Little direct regulatory attention.',
      three: 'Regulated in its main markets, with general operational and security rules.',
      five: 'Heavy and direct regulatory attention in its main markets.',
    },
    rule: 'Needs network-specific regulatory evidence. None is shown on this page, so every network is not scored.',
    evidenceToCheck: 'The regulations that apply in the markets and sectors you operate in.',
  },
  {
    key: 'legacyBurden',
    label: 'Legacy Burden',
    question: 'How much older cryptography and equipment does the network have to move?',
    direction: 'Higher means a heavier legacy load and a harder migration.',
    anchors: {
      zero: 'Not used: a network is not scored 0 for missing evidence.',
      one: 'The listed methods are all current.',
      three:
        'The listed methods mix current and older cryptography, such as RSA-1024 or 3DES in some paths.',
      five: 'Needs evidence of a large legacy base that is slow to replace; none is shown here.',
    },
    rule: 'From the methods listed on the card: no older method (RSA-1024, 3DES) listed is 1; older and current methods both listed is 3; only older methods listed is not scored. 4 and 5 need a figure for the size of the legacy base, which this page does not show.',
    evidenceToCheck:
      'The offline, online and key-management methods listed for the network and your own estate.',
  },
]

/** Plain statement shown on the page next to the radar. */
export const RADAR_SCORES_NOTICE =
  'Radar scores are teaching aids, not measurements, and not a rating of any company. A score is given only where this page shows a sourced basis for it; otherwise the axis is shown as "not scored". "Not scored" is not 0: missing evidence is never turned into a number.'

// ---------------------------------------------------------------------------
// Scoring rules (the data file records their results; tests keep the two in step)
// ---------------------------------------------------------------------------

const OLDER_METHOD = /3DES|RSA-1024/i

/** Scale from the share of the largest comparable card count. */
export function scaleScoreFromShare(share: number): number {
  if (!Number.isFinite(share) || share <= 0) throw new Error('Invalid share')
  if (share >= 0.75) return 5
  if (share >= 0.5) return 4
  if (share >= 0.25) return 3
  if (share >= 0.1) return 2
  return 1
}

/** PQC readiness from the posture label. */
export function pqcReadinessScore(posture: PQCPosture): number {
  switch (posture) {
    case 'shared-standards':
      return 1
    case 'readiness-program':
      return 1
    case 'published-guidance':
      return 2
    case 'prototype-testing':
      return 4
  }
}

/** Legacy burden from the listed methods: null (not scored) when only older methods are listed. */
export function legacyBurdenScore(crypto: PaymentNetwork['currentCrypto']): number | null {
  const listed = [...crypto.offlineAuth, ...crypto.onlineAuth, ...crypto.keyManagement]
  const older = listed.filter((m) => OLDER_METHOD.test(m))
  if (older.length === 0) return 1
  if (older.length === listed.length) return null
  return 3
}

/** The card counts that can be compared, as a share of the largest. */
export function cardCountShares(
  networks: readonly Pick<PaymentNetwork, 'id' | 'cardsInCirculationNum' | 'figures'>[],
  asOf: string
): Record<string, number> {
  const eligible = networks.filter(
    (n) => cardCountExclusionReason(n.figures, asOf) === null && n.cardsInCirculationNum > 0
  )
  const max = Math.max(0, ...eligible.map((n) => n.cardsInCirculationNum))
  const shares: Record<string, number> = {}
  for (const n of eligible) shares[n.id] = n.cardsInCirculationNum / max
  return shares
}
