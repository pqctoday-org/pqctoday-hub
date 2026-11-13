// SPDX-License-Identifier: AGPL-3.0-only
import type { RADAR_AXES } from './emvConstants'

/**
 * Authored rubric for the Network Comparator radar.
 *
 * The six 0-5 scores are the module author's judgements for teaching. They are not measured,
 * not calculated from the dated figures on the page, and not a rating of any company. This
 * rubric says what each criterion asks and what the ends and the middle of the scale mean, so
 * a learner can disagree with a score and say why.
 */

export type RadarAxisKey = (typeof RADAR_AXES)[number]['key']

export interface RadarRubricEntry {
  key: RadarAxisKey
  label: string
  /** The question the score answers. */
  question: string
  /** What a higher score means, so the direction is never guessed. */
  direction: string
  /** Anchors at 0, 1, 3 and 5. Scores 2 and 4 sit between their neighbours. */
  anchors: { zero: string; one: string; three: string; five: string }
  /** The evidence a learner should look for before agreeing or disagreeing. */
  evidenceToCheck: string
}

export const RADAR_RUBRIC: readonly RadarRubricEntry[] = [
  {
    key: 'scale',
    label: 'Scale',
    question:
      'How large is the network’s issuance and acceptance footprint compared with the others in this sample?',
    direction:
      'Higher means a larger footprint, and so more cards and terminals affected by one decision.',
    anchors: {
      zero: 'No footprint applies to the criterion as defined.',
      one: 'Small compared with the others here.',
      three: 'Large, but clearly smaller than the biggest networks here.',
      five: 'Among the largest in this sample.',
    },
    evidenceToCheck:
      'The dated card and volume figures on this page, and the scope notes that come with them.',
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
    evidenceToCheck: 'The regulations that apply in the markets and sectors you operate in.',
  },
  {
    key: 'legacyBurden',
    label: 'Legacy Burden',
    question: 'How much older cryptography and equipment does the network have to move?',
    direction: 'Higher means a heavier legacy load and a harder migration.',
    anchors: {
      zero: 'No legacy cryptography applies.',
      one: 'Mostly recent cryptography and equipment.',
      three: 'A mix of current and older cryptography, such as RSA-1024 or 3DES in some paths.',
      five: 'A large base of older cryptography and equipment that is slow to replace.',
    },
    evidenceToCheck:
      'The offline, online and key-management methods listed for the network and your own estate.',
  },
]

/** Plain statement shown on the page next to the radar. */
export const RADAR_SCORES_NOTICE =
  'The six radar scores are authored judgements made for teaching. They are not measured, not calculated from the figures on this page, and not a rating of any company. A score of 0 would mean a criterion does not apply; missing evidence is never scored as 0.'
