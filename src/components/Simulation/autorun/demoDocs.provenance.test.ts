// SPDX-License-Identifier: GPL-3.0-only
/**
 * Guardrail (local-only, not run in CI): demoDocs.ts is hand-authored narration,
 * the one place in the simulation where factual drift has crept in before
 * (see simulation-mode-improvement-plan — Wave 1). This scans every rendered
 * doc body for citation patterns that must not appear unqualified:
 *   - "SP 800-88" cited as a key-destruction standard (it's media sanitization —
 *     the framework explicitly avoids this citation; see verify-close tree)
 *   - "CSWP.39" / "CSWP 39" with an invented §-section or Fig. number
 *   - "hybrid ... required ... CSWP" (NIST permits, does not mandate, hybrid)
 *   - CycloneDX versions below 1.6 (pre-dates crypto-asset support)
 *   - a bare CRQC year claim with no accompanying planning-assumption label
 * Extend the allowlist only with a verified, sourced reason — not to silence
 * a real finding.
 */
import { describe, it, expect } from 'vitest'
import { DEMO_DOCS_BY_SECTOR } from './demoDocs'

const ALL_DOC_BODIES: { sector: string; type: string; data: string }[] = Object.entries(
  DEMO_DOCS_BY_SECTOR
).flatMap(([sector, docsByType]) =>
  Object.entries(docsByType).map(([type, doc]) => ({ sector, type, data: doc.data }))
)

describe('demoDocs narration provenance guard', () => {
  it('never cites SP 800-88 as a key-destruction standard', () => {
    for (const { sector, type, data } of ALL_DOC_BODIES) {
      expect(data, `${sector}/${type} cites SP 800-88 for key destruction`).not.toMatch(/SP 800-88/)
    }
  })

  it('never attaches an invented CSWP 39 section or figure number', () => {
    for (const { sector, type, data } of ALL_DOC_BODIES) {
      expect(
        data,
        `${sector}/${type} attaches an unverifiable CSWP 39 §/Fig. citation`
      ).not.toMatch(/CSWP\.?\s?39[^.]{0,20}(§|Fig\.)/)
    }
  })

  it('never claims CSWP 39 (or NIST) "requires" hybrid mode', () => {
    for (const { sector, type, data } of ALL_DOC_BODIES) {
      expect(
        data,
        `${sector}/${type} claims hybrid mode is required rather than permitted`
      ).not.toMatch(/hybrid[^.]{0,40}required[^.]{0,40}CSWP/i)
    }
  })

  it('never cites a CycloneDX CBOM version below 1.6', () => {
    for (const { sector, type, data } of ALL_DOC_BODIES) {
      const match = data.match(/CycloneDX(?: CBOM)? v?(\d+)\.(\d+)/)
      if (!match) continue
      const [, major, minor] = match
      const isBelow16 = Number(major) < 1 || (Number(major) === 1 && Number(minor) < 6)
      expect(isBelow16, `${sector}/${type} cites CycloneDX ${major}.${minor} (pre-1.6)`).toBe(false)
    }
  })

  it('never states a CRQC/Z-horizon year range without a planning-assumption qualifier nearby', () => {
    for (const { sector, type, data } of ALL_DOC_BODIES) {
      // Any 20XX–20XX range near "CRQC" must be paired with "planning" within the doc.
      const hasCrqcYearRange = /CRQC[^.]{0,60}20\d{2}[–-]20\d{2}/.test(data)
      if (!hasCrqcYearRange) continue
      expect(
        /planning/i.test(data),
        `${sector}/${type} states a CRQC year range with no planning-assumption qualifier`
      ).toBe(true)
    }
  })
})
