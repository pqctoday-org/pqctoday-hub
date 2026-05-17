// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
/**
 * Matrix pure-helper KAT tests.
 *
 * Per feedback-unit-tests-kat: every pure function gets known-input →
 * known-output assertions. These functions drive the heatmap legend and
 * cell chip rendering — a regression in either produces silently wrong
 * UI for users navigating the Protocol Support matrix.
 *
 * eslint security/detect-object-injection is disabled — every Record
 * lookup in this file uses a statically-typed `DraftStage` key from a
 * pinned literal-array KAT table; the rule fires on indexed access
 * regardless of provable type safety.
 */
import { describe, expect, it } from 'vitest'
import { shortRefLabel } from './PQCProtocolMatrix'
import { DRAFT_STAGE_LEVEL, DRAFT_STAGE_SHORT, type DraftStage } from '../../data/pqcProtocolMatrix'

describe('shortRefLabel — draft prefix stripping', () => {
  it.each([
    ['draft-ietf-tls-mlkem', 'tls-mlkem'],
    ['draft-ietf-lamps-pq-composite-kem', 'lamps-pq-composite-kem'],
    ['draft-ietf-sshm-mlkem-hybrid-kex', 'sshm-mlkem-hybrid-kex'],
    ['draft-harrison-sshm-mlkem', 'harrison-sshm-mlkem'],
    ['draft-yusef-tls-pqt-dual-certs', 'yusef-tls-pqt-dual-certs'],
  ])('%s → %s', (input, expected) => {
    expect(shortRefLabel(input)).toBe(expected)
  })

  it.each([
    ['RFC 9941', 'RFC 9941'],
    ['RFC 9935', 'RFC 9935'],
    ['RFC 8446', 'RFC 8446'],
  ])('RFC ids pass through unchanged: %s', (input, expected) => {
    expect(shortRefLabel(input)).toBe(expected)
  })

  it.each([
    ['TCG TPM 2.0 v1.85', 'TCG TPM 2.0 v1.85'],
    ['3GPP TR 33.841', '3GPP TR 33.841'],
    ['UEFI 2.10', 'UEFI 2.10'],
    ['IEEE 802.1AE-2018', 'IEEE 802.1AE-2018'],
  ])('vendor / SDO spec ids pass through unchanged: %s', (input, expected) => {
    expect(shortRefLabel(input)).toBe(expected)
  })
})

describe('DRAFT_STAGE_LEVEL — IETF stage → 0–7 KAT', () => {
  // Per the saved schema rationale in pqcProtocolMatrix.ts:
  //   0 = none / na, 1 = problem identified, 2 = experimental,
  //   3 = individual I-D, 4 = WG (doc or LC), 5 = IESG submitted,
  //   6 = IETF LC / RFC Editor queue, 7 = RFC published.
  const KAT: Array<[DraftStage, number]> = [
    ['none', 0],
    ['na', 0],
    ['identified', 1],
    ['experimental', 2],
    ['individual-draft', 3],
    ['wg-document', 4],
    ['wg-last-call', 4],
    ['iesg-submitted', 5],
    ['ietf-last-call', 6],
    ['rfc-editor-queue', 6],
    ['rfc-published', 7],
  ]
  it.each(KAT)('stage "%s" maps to level %i', (stage, level) => {
    expect(DRAFT_STAGE_LEVEL[stage]).toBe(level)
  })

  it('every level in 0..7 has at least one stage', () => {
    const levels = new Set(Object.values(DRAFT_STAGE_LEVEL))
    for (let i = 0; i <= 7; i++) expect(levels.has(i)).toBe(true)
  })

  it('every stage maps to an integer level in [0,7]', () => {
    for (const v of Object.values(DRAFT_STAGE_LEVEL)) {
      expect(Number.isInteger(v)).toBe(true)
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(7)
    }
  })
})

describe('DRAFT_STAGE_SHORT — IETF stage → chip label KAT', () => {
  const KAT: Array<[DraftStage, string]> = [
    ['none', 'None'],
    ['na', 'N/A'],
    ['identified', 'Identified'],
    ['experimental', 'Experimental'],
    ['individual-draft', 'I-D'],
    ['wg-document', 'WG Doc'],
    ['wg-last-call', 'WG LC'],
    ['iesg-submitted', 'IESG'],
    ['ietf-last-call', 'IETF LC'],
    ['rfc-editor-queue', 'RFC Ed Queue'],
    ['rfc-published', 'RFC'],
  ]
  it.each(KAT)('stage "%s" renders as "%s"', (stage, label) => {
    expect(DRAFT_STAGE_SHORT[stage]).toBe(label)
  })
})
