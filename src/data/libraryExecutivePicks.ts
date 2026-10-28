// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Curated "Boardroom set" library picks for the executive persona
 * (P04 audit — persona-overwhelm-p0, PR 2 / P1).
 *
 * Surfaced above the main library grid on `/library` when the active persona
 * is executive, so a board-room reader lands on a tight set of regulator-level
 * documents instead of the full corpus.
 *
 * `referenceId` values match `LibraryItem.referenceId` in the canonical CSV.
 * Now at the full audit-plan target of 8 picks — `CISA-Quantum-Readiness-
 * Roadmap` was added as a new library CSV row in `library_05222026_r2.csv`
 * to close the last open executive picks slot.
 */
import type { LibraryCuriousPick } from './libraryCuriousPicks'

export type LibraryExecutivePick = LibraryCuriousPick

export const LIBRARY_EXECUTIVE_PICKS: readonly LibraryExecutivePick[] = [
  {
    referenceId: 'NIST CSWP 39',
    label: 'NIST CSWP 39 — Considerations for Achieving Crypto Agility: Strategies and Practices',
    blurb:
      "NIST's strategies and practices for cryptographic agility: replacing and adapting algorithms in protocols, applications and infrastructure without disruption. The companion to the PQC transition.",
  },
  {
    referenceId: 'NIST IR 8547',
    label: 'NIST IR 8547 — PQC Transition Timeline',
    blurb:
      "NIST's final transition plan (October 2026). It deprecates quantum-vulnerable public-key cryptography, at 112-bit security and up, after 2030 and disallows it under NIST standards after 2035; it is NIST guidance, not a regulation.",
  },
  {
    referenceId: 'NSA CNSA 2.0',
    label: 'NSA CNSA 2.0 — National Security Suite',
    blurb:
      'The U.S. national-security algorithm suite for National Security Systems. Its requirements do not automatically apply to ordinary commercial systems, though vendors may use them when planning compatible products.',
  },
  {
    referenceId: 'ANSSI PQC Follow-up Paper',
    label: 'ANSSI — French PQC Position',
    blurb:
      "ANSSI's December 2023 position on staged PQC migration and hybridization. It explains the French national-security agency's position; it is not an EU-wide mandate.",
  },
  {
    referenceId: 'BSI TR-02102-1',
    label: 'BSI TR-02102-1 — German Crypto Guidance',
    blurb:
      "Germany's federal cryptographic recommendations. Use it to understand BSI's current algorithm and key-length guidance; it does not by itself create an EU-wide requirement.",
  },
  {
    referenceId: 'EC-Recommendation-2024-1101',
    label: 'EU Recommendation 2024/1101',
    blurb:
      'European Commission recommendation asking Member States to coordinate PQC migration roadmaps. It informs EU planning but should not be presented as a directly binding technical standard.',
  },
  {
    referenceId: 'UK-NCSC-Migration-Timelines-2025',
    label: 'UK NCSC — Migration Timelines',
    blurb:
      "The UK's official planning milestones: complete discovery and planning by 2028, complete the highest-priority migrations by 2031, and complete migration by 2035. This is UK NCSC guidance, not a global mandate.",
  },
  {
    referenceId: 'CISA-Quantum-Readiness-Roadmap',
    label: 'CISA Quantum-Readiness Roadmap',
    blurb:
      'The August 2023 CISA/NSA/NIST readiness factsheet: establish governance, inventory vulnerable cryptography, assess priorities and engage vendors. It predates NIST IR 8547 and provides practical preparation guidance rather than a binding deadline.',
  },
] as const

export function getLibraryExecutivePicks(): readonly LibraryExecutivePick[] {
  return LIBRARY_EXECUTIVE_PICKS
}
