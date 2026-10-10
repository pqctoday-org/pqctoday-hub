// SPDX-License-Identifier: GPL-3.0-only
/**
 * Curated "start here" library picks for the Certification & Validation
 * Engineer persona.
 *
 * Three documents a person who tests or certifies a cryptographic module
 * opens first: the rules a PQC module is checked against, how a validation is
 * run, and the public vectors the Playground's ACVP suite executes. Until
 * these were curated the persona's picks were derived by citation count and
 * were not about certification at all.
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
    label: 'FIPS 140-3 Implementation Guidance — PQC',
    blurb:
      'NIST’s updated Implementation Guidance for FIPS 140-3 and the CMVP: self-test requirements for the FIPS 203, 204 and 205 algorithms and guidance for key-encapsulation mechanisms.',
  },
  {
    referenceId: 'CMVP-MGMT-MANUAL',
    label: 'CMVP Management Manual',
    blurb:
      'How a validation runs: the CMVP lifecycle, laboratory conduct, certificate issuance and maintenance reporting.',
  },
  {
    referenceId: 'usnistgov-ACVP-Server-Public-Reference-Sample-Vector-Sets',
    label: 'NIST ACVP-Server — public reference samples',
    blurb:
      'NIST’s reference implementation that generates and verifies ACVP test vector sets, the source of the public sample vectors the Playground’s ACVP suite runs. It is code, not a certificate or a lab verdict.',
  },
] as const
