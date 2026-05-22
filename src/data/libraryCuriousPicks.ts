// SPDX-License-Identifier: GPL-3.0-only
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
    referenceId: 'NIST IR 8547',
    label: 'NIST IR 8547 — Transition Timeline',
    blurb:
      "The single most important doc on this page: NIST's plan for retiring today's encryption. Deprecates 112-bit classical asymmetric crypto by 2030, disallows it by 2035. Every other regulator on the page is downstream of this.",
  },
  {
    referenceId: 'FIPS 203',
    label: 'FIPS 203 — ML-KEM',
    blurb:
      'The first NIST-standardised post-quantum algorithm (August 2024). Replaces RSA / ECDH for key exchange. If you only read one algorithm spec, this is the one. (FIPS 204 / 205 — ML-DSA and SLH-DSA — are reachable from this doc\'s related-standards links.)',
  },
  {
    referenceId: 'RFC-9964',
    label: 'RFC 9964 — ML-DSA for JOSE/COSE',
    blurb:
      'How ML-DSA signatures get embedded into JSON Web Tokens and COSE messages. The reason this matters: JWT/JWS is the universal token format on the web, and PQC signatures need a place in it.',
  },
] as const

export function getLibraryCuriousPicks(): readonly LibraryCuriousPick[] {
  return LIBRARY_CURIOUS_PICKS
}
