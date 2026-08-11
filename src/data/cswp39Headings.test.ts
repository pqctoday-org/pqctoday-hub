// SPDX-License-Identifier: GPL-3.0-only
/**
 * Provenance gate for every CSWP.39 §-reference the app renders.
 *
 * The defect this exists for (found 2026-08-10): `cswp39Data.ts` displayed
 * "§5.2 Inventory — CBOM and Information Repository" on the Command Center.
 * §5.2 is "Crypto Security Policy Enforcement"; neither "CBOM" nor
 * "Information Repository" occurs anywhere in the publication. A "§5.5" was
 * also rendered, and §5 runs 5.1–5.4.
 *
 * Nothing here re-parses the PDF — CSWP39_REAL_HEADINGS is the checked-in
 * extraction. What this guards is that no OTHER file drifts away from it.
 */
import { describe, it, expect } from 'vitest'
import {
  CSWP39_REAL_HEADINGS,
  CSWP39_ABSENT_TERMS,
  isRealCswp39Ref,
} from './cswp39Headings'
import { CSWP39_SECTIONS, CSWP39_STEPS } from '@/components/Compliance/cswp39Data'
import { CSWP39_ZONE_DETAILS, CSWP39_ZONE_ORDER } from './cswp39ZoneData'
import { BUSINESS_TOOLS } from '@/components/BusinessCenter/businessToolsRegistry'

/** Pull every "§N.N.N" token out of a string. */
function refsIn(text: string): string[] {
  return text.match(/§\d(?:\.\d){0,2}/g) ?? []
}

describe('CSWP.39 §-reference provenance', () => {
  it('every subSection ref and title in CSWP39_SECTIONS matches the publication verbatim', () => {
    for (const section of CSWP39_SECTIONS) {
      expect(isRealCswp39Ref(section.ref), `section ${section.ref} is not a real heading`).toBe(
        true
      )
      expect(section.title, `title for ${section.ref}`).toBe(CSWP39_REAL_HEADINGS[section.ref])
      for (const sub of section.subSections) {
        expect(isRealCswp39Ref(sub.ref), `${sub.ref} is not a real CSWP.39 heading`).toBe(true)
        expect(sub.title, `title for ${sub.ref}`).toBe(CSWP39_REAL_HEADINGS[sub.ref])
      }
    }
  })

  it('every §-reference in BUSINESS_TOOLS resolves to a real heading', () => {
    for (const tool of BUSINESS_TOOLS) {
      expect(
        isRealCswp39Ref(tool.cswp39SectionRef),
        `BUSINESS_TOOLS["${tool.id}"] cites ${tool.cswp39SectionRef}, which is not a CSWP.39 heading`
      ).toBe(true)
    }
  })

  it('every §-reference in the step model and zone model resolves to a real heading', () => {
    for (const step of CSWP39_STEPS) {
      for (const ref of refsIn(step.sectionRef)) {
        expect(isRealCswp39Ref(ref), `step "${step.id}" cites ${ref}`).toBe(true)
      }
    }
    for (const zoneId of CSWP39_ZONE_ORDER) {
      const zone = CSWP39_ZONE_DETAILS[zoneId]
      for (const ref of refsIn(zone.cswpRef ?? '')) {
        expect(isRealCswp39Ref(ref), `zone "${zoneId}" cites ${ref}`).toBe(true)
      }
    }
  })

  it('does not attribute absent terms to the publication', () => {
    const corpus = [
      ...CSWP39_SECTIONS.flatMap((s) => [
        s.title,
        s.summary,
        ...s.subSections.map((x) => `${x.ref} ${x.title}`),
      ]),
      ...CSWP39_STEPS.map((s) => `${s.sectionRef} ${s.title}`),
    ]
      .join(' | ')
      .toLowerCase()

    for (const term of CSWP39_ABSENT_TERMS) {
      expect(
        corpus.includes(term.toLowerCase()),
        `"${term}" does not occur in CSWP 39-upd1 and must not be attributed to it`
      ).toBe(false)
    }
  })

  it('§5 has no sub-section beyond §5.4', () => {
    expect(isRealCswp39Ref('§5.5')).toBe(false)
    expect(isRealCswp39Ref('§5.4')).toBe(true)
  })
})
