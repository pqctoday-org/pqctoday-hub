// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Curated "start here" library picks for the curious persona (P04-P1-02).
 *
 * Surfaced above the main library grid on `/library` when the active persona
 * is curious, so a first-time visitor lands on 3 readable, canonical PQC docs
 * instead of a sortable 400+ row table.
 *
 * Trimmed from 5 → 3 picks under P04 audit P2.b (2026-05-22). FIPS-204
 * (ML-DSA) and FIPS-205 (SLH-DSA) were dropped because they are reachable via
 * the FIPS-203 ↔ IR-8547 hub-and-spoke relationship — a curious reader who
 * lands on ML-KEM or the transition timeline naturally pivots to the
 * signature-side standards from the related-docs links. The 3-pick set keeps
 * the "minimum viable mode" (PR 4) above-the-fold target tight.
 *
 * Re-picked 2026-10-16 (Curious journey review): a plain-language government
 * factsheet first, then one of the three final standards, then the draft
 * transition plan, labelled as a draft. RFC 9964 (JOSE/COSE) moved off the
 * beginner shelf as too specialised.
 *
 * `referenceId` values match `LibraryItem.referenceId` from the canonical
 * library CSV — they wire directly into the existing `openDetail()` flow.
 */
export interface LibraryCuriousPick {
  referenceId: string
  /** Display label — usually shorter than the formal document title. */
  label: string
  /** One-paragraph plain-English explainer of why this doc is the right starting point. */
  blurb: string
}

export const LIBRARY_CURIOUS_PICKS: readonly LibraryCuriousPick[] = [
  {
    referenceId: 'CISA-Quantum-Readiness-Roadmap',
    label: 'CISA / NSA / NIST — Quantum-Readiness',
    blurb:
      'A short U.S. government factsheet in plain language: why quantum computing matters for encryption, and the first steps an organisation takes (inventory, vendor questions, a migration roadmap). Guidance, not a rule.',
  },
  {
    referenceId: 'FIPS 203',
    label: 'FIPS 203 — ML-KEM',
    blurb:
      "One of NIST's first three post-quantum standards, all published in August 2024. ML-KEM sets up a shared secret key (the job RSA and ECDH key exchange do today). Its companions FIPS 204 and FIPS 205 cover digital signatures and are linked from this document.",
  },
  {
    referenceId: 'NIST IR 8547',
    label: 'NIST IR 8547 — Transition Timeline',
    blurb:
      "Final since October 2026. NIST's plan for retiring today's public-key encryption: RSA and elliptic-curve algorithms are deprecated after 2030 and disallowed after 2035. Many other agencies' timelines point to similar dates.",
  },
] as const

export function getLibraryCuriousPicks(): readonly LibraryCuriousPick[] {
  return LIBRARY_CURIOUS_PICKS
}
