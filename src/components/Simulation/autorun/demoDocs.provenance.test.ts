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
 *
 * Also scans REAL_DOC_GENERATORS output (07182026) — `realToolDocs.ts` /
 * `derivedFinancialDocs.ts` compute doc bodies from live tool math and
 * OVERRIDE the hand-authored DEMO_DOCS_BY_SECTOR entries at exec-tour render
 * time (see `demoDocFor`), so a qualifier present in the hand-authored copy
 * can silently vanish in what a player actually sees. That exact drift shipped
 * for months: `deriveBoardDeck`'s CRQC sentence dropped the planning-assumption
 * label this guard's last rule exists to catch, because only the hand-authored
 * path was ever scanned. See simulation-mode-review-07182026.md finding A8.
 */
import { describe, it, expect } from 'vitest'
import { DEMO_DOCS_BY_SECTOR, type DemoSector } from './demoDocs'
import { REAL_DOC_GENERATORS } from './realToolDocs'

const SECTORS: DemoSector[] = [
  'financial',
  'healthcare',
  'government',
  'energy',
  'telecom',
  'retail',
  'general',
]

const HAND_AUTHORED_BODIES: { sector: string; type: string; data: string }[] = Object.entries(
  DEMO_DOCS_BY_SECTOR
).flatMap(([sector, docsByType]) =>
  Object.entries(docsByType).map(([type, doc]) => ({ sector, type, data: doc.data }))
)

// Render every derived-doc generator for every sector so the guard covers the
// path that actually reaches the player during the exec tour (REAL_DOC_GENERATORS
// is checked first by `demoDocFor`, before the hand-authored fallback).
const DERIVED_BODIES: { sector: string; type: string; data: string }[] = Object.entries(
  REAL_DOC_GENERATORS
).flatMap(([type, generator]) =>
  SECTORS.map((sector) => ({
    sector,
    type: `${type} (derived)`,
    data: generator!(sector).data,
  }))
)

const ALL_DOC_BODIES = [...HAND_AUTHORED_BODIES, ...DERIVED_BODIES]

describe('demoDocs narration provenance guard', () => {
  it('never cites SP 800-88 as a key-destruction standard', () => {
    // 07182026: the derived data-at-rest-strategy doc (realToolDocs.ts, via
    // DataAtRestStrategy's real tool) cites "NIST SP 800-88 (Guidelines for
    // Media Sanitization)" by its correct title, correctly scoped to
    // verifiable crypto-shred/media destruction — not claimed to retroactively
    // close HNDL exposure (that overclaim, found in the verify-close phase,
    // was fixed directly in simMoves.ts; see finding A10). This rule still
    // catches any OTHER SP 800-88 citation.
    for (const { sector, type, data } of ALL_DOC_BODIES) {
      if (type === 'data-at-rest-strategy (derived)') continue
      expect(data, `${sector}/${type} cites SP 800-88 for key destruction`).not.toMatch(/SP 800-88/)
    }
  })

  it('never attaches an invented CSWP 39 section or figure number', () => {
    // Verified 07182026 against the cached NIST CSWP 39 PDF (Dec 19 2025 body
    // text, not just the ToC): §3.2.1 = "Preserving Protocol Interoperability"
    // (under 3.2 Algorithm Transitions); §5 = "Crypto Agility Strategic Plan
    // for Managing Organizations' Crypto Risks"; §5.3 = "Technology Supply
    // Chains" (p.25) — its body text covers exactly the vendor/supply-chain
    // observability content (visibility into products/services, "a
    // comprehensive list of cryptographic components") cited by the
    // VendorScorecardBuilder/ContractClauseGenerator "Observability Tooling
    // Notes" heading, reached via REAL_DOC_GENERATORS in Wave 5 WP5.3. All
    // three citations match the document exactly — allowlisted as
    // verified-accurate, not invented. Any OTHER §/Fig. citation still fails.
    //
    // §6.5 added 07192026 (Batch 1: kpi-tracker via REAL_DOC_GENERATORS):
    // verified against the cached CSWP 39-upd1 PDF p.34 — §6.5 is titled
    // exactly "Maturity Assessment for Crypto Agility", which is verbatim
    // what the KPI tracker's own footer cites.
    //
    // §5.1 added 07192026 (Batch 1: audit-checklist): verified p.29 — §5.1
    // ("Cryptographic Standards, Regulations, and Mandates") states
    // "Cryptographic algorithm validation is a prerequisite for cryptographic
    // module validation" (CAVP/CMVP), which is exactly the Evidence heading's
    // claim. The tool's OTHER §5.1 cite — on the Exceptions heading — was
    // checked too, found invented (the document has no exception-process
    // content anywhere), and removed from the tool itself; this guard is what
    // caught it.
    const VERIFIED_CSWP39_SECTIONS = ['3.2.1', '5', '5.3', '6.5', '5.1']
    const citationPattern = /CSWP\.?\s?39[^.]{0,20}(§|Fig\.)\s?([0-9.]+)/g
    for (const { sector, type, data } of ALL_DOC_BODIES) {
      const invented: string[] = []
      for (const m of data.matchAll(citationPattern)) {
        const [full, marker, num] = m
        if (marker === '§' && VERIFIED_CSWP39_SECTIONS.includes(num)) continue
        invented.push(full)
      }
      expect(
        invented,
        `${sector}/${type} attaches an unverifiable CSWP 39 §/Fig. citation`
      ).toEqual([])
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
