// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Curated "start here" library picks for the Certification & Validation
 * Engineer persona.
 *
 * Three documents for an engineer adapting certification work to PQC: what
 * FIPS 140-3 now expects of ML-KEM/ML-DSA/SLH-DSA modules, how KEMs must be
 * implemented and combined whatever the route, and which PQC mechanisms the
 * EU (EUCC) route accepts. Balanced across the FIPS and EU routes; each blurb
 * names the section to start with (checked against the documents on
 * 2026-10-21). The NIST ACVP sample vectors are left to the ACVP pages, where
 * the Playground suite and the ACVP lesson already use them.
 *
 * Blurbs follow each document's own library description and make no claim
 * about any product or certificate. `referenceId` values match
 * `LibraryItem.referenceId`; `libraryStartPicks.test.ts` keeps them resolving.
 */
import type { LibraryCuriousPick } from './libraryCuriousPicks'

export type LibraryCertEngineerPick = LibraryCuriousPick

export const LIBRARY_CERT_ENGINEER_PICKS: readonly LibraryCertEngineerPick[] = [
  {
    referenceId: 'NIST-FIPS140-3-IG-PQC',
    label: 'FIPS 140-3 Implementation Guidance',
    blurb:
      'What FIPS 140-3 now expects from a module that implements ML-KEM, ML-DSA or SLH-DSA. Start with §10.3.A (the self-tests these algorithms need before first use) and D.S (key-encapsulation mechanisms).',
  },
  {
    referenceId: 'NIST SP 800-227',
    label: 'NIST SP 800-227 — Key-Encapsulation Mechanisms',
    blurb:
      'How a KEM such as ML-KEM must be implemented and used, whichever certification route applies. Start with §3 (requirements for secure KEM implementations) and §4.6 (combining a post-quantum and a classical KEM).',
  },
  {
    referenceId: 'EUCC v2.0 ACM',
    label: 'ECCG Agreed Cryptographic Mechanisms v2.0',
    blurb:
      'Which post-quantum mechanisms the EU certification route (EUCC) accepts, and on what conditions. Start with §1.4 (post-quantum cryptography and hybrid use), then the ML-KEM, ML-DSA and SLH-DSA rows in §5 with their notes on hybridisation and parameter sizes. ENISA lists version 2 as applicable; version 3 is still a draft.',
  },
] as const
