// SPDX-License-Identifier: GPL-3.0-only
/**
 * Curated "Boardroom set" library picks for the executive persona
 * (P04 audit — persona-overwhelm-p0, PR 2 / P1).
 *
 * Surfaced above the main library grid on `/library` when the active persona
 * is executive, so a board-room reader lands on a tight set of regulator-level
 * documents instead of the full corpus.
 *
 * `referenceId` values match `LibraryItem.referenceId` in the canonical CSV.
 * Picks that do not yet exist in the corpus (e.g. CISA Quantum Readiness
 * Roadmap) are intentionally omitted rather than wired to broken IDs.
 */
import type { LibraryCuriousPick } from './libraryCuriousPicks'

export type LibraryExecutivePick = LibraryCuriousPick

export const LIBRARY_EXECUTIVE_PICKS: readonly LibraryExecutivePick[] = [
  {
    referenceId: 'NIST-CSWP-39',
    label: 'NIST CSWP 39 — Cybersecurity Maturity',
    blurb:
      "NIST's organisational-maturity yardstick: 189 requirements, mapped across governance, planning, and operations. The board-level answer to \"are we ready?\"",
  },
  {
    referenceId: 'NIST IR 8547',
    label: 'NIST IR 8547 — PQC Transition Timeline',
    blurb:
      "NIST's plan for retiring today's encryption. Deprecates 112-bit classical asymmetric crypto by 2030, disallows it by 2035 — every downstream regulator references it.",
  },
  {
    referenceId: 'NSA CNSA 2.0',
    label: 'NSA CNSA 2.0 — National Security Suite',
    blurb:
      "The US national-security baseline for PQC. Sets the floor for federal and defence systems and drives vendor roadmaps far beyond government users.",
  },
  {
    referenceId: 'ANSSI PQC Follow-up Paper',
    label: 'ANSSI — French PQC Position',
    blurb:
      'France\'s national agency on hybrid-first PQC migration. The most quoted European counter-weight to NIST timelines.',
  },
  {
    referenceId: 'BSI TR-02102-1',
    label: 'BSI TR-02102-1 — German Crypto Guidance',
    blurb:
      "Germany's federal cryptographic recommendations. Sets the EU-side bar for which algorithms regulators consider acceptable.",
  },
  {
    referenceId: 'EU-REC-2024-1101',
    label: 'EU Recommendation 2024/1101',
    blurb:
      "European Commission's coordinated PQC migration recommendation. The compliance lens any multi-jurisdiction enterprise has to plan around.",
  },
  {
    referenceId: 'UK-NCSC-Migration-Timelines-2025',
    label: 'UK NCSC — Migration Timelines',
    blurb:
      "The UK's official PQC timeline: discovery by 2028, critical systems migrated by 2031, full migration by 2035. Aligns closely with US NIST IR 8547.",
  },
] as const

export function getLibraryExecutivePicks(): readonly LibraryExecutivePick[] {
  return LIBRARY_EXECUTIVE_PICKS
}
