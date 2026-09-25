// SPDX-License-Identifier: GPL-3.0-only
// OWNER: Scaffold
/**
 * Structured content for the Cryptographic Product Certification module.
 *
 * `standards[]` is the plan r2 §7 source set: the rows "already in" the
 * library plus the WS-1 rows added on 24 September 2026 (library_09242026.csv).
 * Every id below was checked against that CSV (status=active) — getStandard()
 * throws at module-init on an unknown id.
 *
 * Grouped policy/program first, then specifications, so the spot-check stride
 * sample (moduleStandardsOrdering.driftguard.test.ts) reads scheme documents.
 *
 * Pending (not in the CSV yet — cite in plain text, build spec §6.2):
 * NIST-CSWP-37B-IPD, CCMC-011-CCRA-EUCC-Coexistence,
 * ENISA-EUCC-HSM-PP-FPT-PHP-Interpretation,
 * ENISA-EUCC-Assurance-Continuity-Change-Scenarios,
 * ENISA-EUCC-Product-Series-Methodology, ANSSI-CC-PP-2018-02-EN-419241-2.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'crypto-product-certification',
  version: '0.1.0',
  // No lastReviewed: nobody has reviewed this module's claims via
  // record_module_review.py yet (moduleReviewHonesty.test.ts). v1 ships as
  // "practitioner orientation", not reviewed by a lab or certification body.
  lastEdited: '2026-09-24',

  standards: [
    // ── FIPS 140-3 / CMVP (Path A) ──
    getStandard('FIPS-140-3-STANDARD'),
    getStandard('CMVP-MGMT-MANUAL'),
    getStandard('NIST-FIPS140-3-IG-PQC'),
    getStandard('NIST-CMVP-MIP-List'),
    getStandard('NIST-CMVP-Validated-Modules'),
    getStandard('NIST-CMVP-140-2-to-140-3-Transition-Timeline'),
    getStandard('EO-2026-06-22-Securing-the-Nation'), // EO 14412 §6(b)
    getStandard('NIST-SP-800-140'),
    getStandard('NIST-SP-800-140A'),
    getStandard('NIST-SP-800-140B'),
    getStandard('NIST-SP-800-140C'),
    getStandard('NIST-SP-800-140D'),
    getStandard('NIST-SP-800-140E'),
    getStandard('NIST-SP-800-140F'),
    getStandard('NIST-ACVP'),
    getStandard('NIST-CMVP-ESV'),
    getStandard('NIST-SP-1800-40B-IPD'),
    getStandard('NIST-SP-1800-40A-PD'),
    getStandard('NIST-CSWP-37A'),
    getStandard('NIST IR 8547'),

    // ── Common Criteria / CCRA (Path B) ──
    getStandard('CCMC-2023-04-001-CC2022-Transition-Policy'),
    getStandard('CCDB-014-Assurance-Continuity-v3-1'),
    getStandard('COMMON-CRITERIA'),
    getStandard('CC-2022-PART2'),
    getStandard('CC-2022-PART3'),
    getStandard('CC-2022-PART4'),
    getStandard('CC-2022-PART5'),
    getStandard('CC-2022-CEM'),

    // ── EUCC, eIDAS and Protection Profiles (Path C) ──
    getStandard('CIR-EU-2024-482-EUCC-Cybersecurity-Certification-Scheme'),
    getStandard('CIR-EU-2024-3144-EUCC-Amendment'),
    getStandard('CIR-EU-2025-2462-EUCC-Amendment'),
    getStandard('EUCC v2.0 ACM'),
    getStandard('eIDAS-2-Regulation'),
    getStandard('CIR-EU-2025-1567-Remote-QSCD-Management'),
    getStandard('CIR-EU-2025-1570-QSCD-Certification-Notification'),
    getStandard('CID-EU-2016-650-QSCD-Security-Assessment'),
    getStandard('ANSSI-CC-PP-2016-05-EN-419221-5'),
    getStandard('ANSSI-CC-PP-2016-05-M01'),
    getStandard('BSI-CC-PP-0084-V2-2026'),

    // ── PCI (Path D; public documents only, plan r2 D4) ──
    getStandard('PCI-SSC-Blog-Publishes-PTS-HSM-v5-0'),
    getStandard('PCI-SSC-Bulletin-PTS-HSM-v4-Extension'),
    getStandard('PCI-PTS-HSM-Modular-Security-Requirements-v4-0'),
    getStandard('PCI-PTS-Program-Guide-v1-9'),
    getStandard('PCI-PTS-Listing-Field-Definitions'),
    getStandard('PCI-PIN-v3-1-ROC-Reporting-Template'),
    getStandard('PCI-P2PE-Security-Requirements-v3-1'), // superseded by v3.2 (June 2025)
    getStandard('PCI-SSC-P2PE-Program-Page'),
    getStandard('PCI-SSC-Blog-KMO-v1-0-Published'),
    getStandard('PCI-SSC-Blog-Authentication-Cryptography-Guidance'),
  ],

  // The anchor product's change (build spec §5): adding ML-KEM and ML-DSA. The
  // parameter sets are the ones EUCC ACM v2 recommends (plan r2 §5, Path C).
  algorithms: [getAlgorithm('ML-KEM-768'), getAlgorithm('ML-DSA-65')],

  deadlines: [
    // Deliberately empty. Market/policy deadlines are read at runtime from the
    // Hub timeline facts (build spec §5), never typed into this module; scheme
    // clocks (plan r2 §5.8) are cited to their library rows in the prose.
  ],

  narratives: {},
}
