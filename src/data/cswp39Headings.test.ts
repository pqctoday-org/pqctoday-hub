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
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { CSWP39_REAL_HEADINGS, CSWP39_ABSENT_TERMS, isRealCswp39Ref } from './cswp39Headings'
import { CSWP39_SECTIONS, CSWP39_STEPS } from '@/components/Compliance/cswp39Data'
import { CSWP39_ZONE_DETAILS, CSWP39_ZONE_ORDER } from './cswp39ZoneData'
import { BUSINESS_TOOLS } from '@/components/BusinessCenter/businessToolsRegistry'

/**
 * Document names that claim the §-reference following them. Matched against
 * the 40 characters immediately before a §, so only that reference is
 * exempted rather than everything else on the line.
 */
// Documents OTHER than CSWP.39 that legitimately carry §-numbered sections. A §-ref
// preceded by one of these is that document's section, not a claim about CSWP.39.
// `TLS BR` / `Baseline Requirements` added 2026-08-22: the crypto-mgmt-modernization
// module cites CA/B Forum TLS BR §6.3.2 for the certificate-validity ladder, and the
// same file also mentions CSWP.39, so without this every such citation reads as a
// fabricated CSWP.39 heading. Widening this list never weakens the gate for CSWP.39
// itself — a bare §-ref, or one next to CSWP.39, is still judged against the real
// headings.
const OTHER_DOCUMENT =
  /(ISO|IEC\b|SP\s?800|FIPS|RFC|NIS2|DORA|PHASE-OVERLAY|TLS\s?BR|Baseline\s?Requirements|CSWP[\s._]?3[68]A?\b|CSWP[\s._]?4)/i

/** OTHER_DOCUMENT plus CSWP.39 itself, global — so the loop below can ask which
 *  document name sits CLOSEST to a §-ref rather than whether any appears at all. */
const NEAREST_DOCUMENT = new RegExp(`${OTHER_DOCUMENT.source}|CSWP[\\s._]?39`, 'gi')

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

  /**
   * The checks above read DATA STRUCTURES — CSWP39_SECTIONS, CSWP39_STEPS,
   * BUSINESS_TOOLS. On 2026-08-11 a re-audit found two live §5.5 references
   * that none of them could see, because they were written straight into
   * component source:
   *
   *   cswp39Tier.ts                  'Evidence (...) documented (audit-checklist §5.5)'
   *   CryptoMgmtModernization/index  'Implement · §5.5 + §4.6 — gateway vs. migration'
   *
   * Both rendered to users. `isRealCswp39Ref('§5.5')` was already asserted
   * false directly above, and had been for weeks — the gate knew §5.5 was
   * fictional and simply was not pointed at the files that used it.
   *
   * This sweeps the component tree itself. It deliberately reads source text
   * rather than exports: a §-ref inside a template literal is invisible to
   * every other kind of check, which is exactly how these two survived.
   */
  it('no component attributes a §-reference to CSWP.39 that does not exist', () => {
    const roots = [
      resolve(__dirname, '../components/BusinessCenter'),
      resolve(__dirname, '../components/PKILearning/modules'),
      resolve(__dirname, '../components/Compliance'),
    ]

    const offenders: string[] = []
    for (const root of roots) {
      for (const file of walk(root)) {
        const text = readFileSync(file, 'utf8')
        // Only files that actually talk about CSWP.39 — otherwise a "§7.5" in
        // an ISO 27001 citation would be judged against the wrong document.
        if (!/CSWP[\s._]?39/i.test(text)) continue

        for (const line of text.split('\n')) {
          // Skip comments: a line explaining that §5.5 does NOT exist is
          // documentation, not attribution.
          const code = line.trim()
          if (code.startsWith('//') || code.startsWith('*') || code.startsWith('/*')) continue
          // Judge each reference by what immediately PRECEDES it, not by the
          // whole line. A line-wide skip was the first attempt and it was
          // wrong in a way that mattered: "See CSWP.39 §5.5 and NIST SP 800-88"
          // contains "SP 800", so the fabricated §5.5 next to CSWP.39 would
          // have been waved through. Caught reviewing this gate, not by it.
          for (const m of line.matchAll(/§\s?\d(?:\.\d){0,2}/g)) {
            const before = line.slice(Math.max(0, (m.index ?? 0) - 40), m.index ?? 0)
            // The NEAREST document name wins, not merely the presence of one.
            // Testing `OTHER_DOCUMENT.test(before)` let "TLS BR §6.3.2, and
            // CSWP.39 §5.5" excuse the fabricated §5.5, because "TLS BR" was
            // still inside the 40-char window. That hole existed for every
            // token in the list (ISO, RFC, SP 800 ...) and was found by a
            // sabotage check on 2026-08-22, not by the gate. Taking the last
            // match closes it: a CSWP.39 mention standing between another
            // document and the §-ref reclaims the reference.
            const names = [...before.matchAll(NEAREST_DOCUMENT)]
            const nearest = names.length ? names[names.length - 1][0] : ''
            if (nearest && !/CSWP[\s._]?39/i.test(nearest)) continue
            const ref = m[0].replace(/\s/g, '')
            if (!isRealCswp39Ref(ref)) {
              offenders.push(`${file.split('/src/')[1]}: ${ref} — ${code.slice(0, 90)}`)
            }
          }
        }
      }
    }

    expect(offenders, `fabricated CSWP.39 section refs:\n${offenders.join('\n')}`).toEqual([])
  })
})

/** Every .ts/.tsx under `dir`, excluding tests. */
function walk(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = `${dir}/${entry.name}`
    if (entry.isDirectory()) out.push(...walk(full))
    else if (/\.tsx?$/.test(entry.name) && !entry.name.includes('.test.')) out.push(full)
  }
  return out
}
