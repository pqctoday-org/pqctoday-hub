// SPDX-License-Identifier: AGPL-3.0-only
// OWNER: Scaffold
/**
 * Structured content for the Cryptographic Product Certification module — Fundamentals (LM-065).
 *
 * SPLIT 2026-09-27: this module lists exactly the references its own files
 * cite (plus any that were listed for its scheme but cited nowhere). The
 * three certification modules share some rows because the fundamentals'
 * shared-PQC sections cite scheme documents too.
 *
 * `standards[]` is the plan r2 §7 source set: the rows "already in" the
 * library plus the WS-1 rows added on 24 September 2026 (library_09242026.csv).
 * Every id below was checked against that CSV (status=active) — getStandard()
 * throws at module-init on an unknown id.
 *
 * Grouped policy/program first, then specifications, so the spot-check stride
 * sample (moduleStandardsOrdering.driftguard.test.ts) reads scheme documents.
 *
 * The six rows that were pending here (build spec §6.2) landed on 2026-09-25
 * and are now cited properly rather than in plain text.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'crypto-product-certification',
  // lastReviewed removed: facts in this module were corrected in release 4.187.0 after the owner's
  // sign-off, so the sign-off is reset until the owner renews it (moduleReviewHonesty.test.ts). The
  // on-page notice follows it (common/moduleReviewStatus.ts).
  version: '0.1.0',
  lastEdited: '2026-10-30',

  standards: [
    // ── FIPS 140-3 / CMVP (Path A) ──
    getStandard('FIPS-140-3-STANDARD'),
    getStandard('CMVP-MGMT-MANUAL'),
    getStandard('NIST-FIPS140-3-IG-PQC'),
    getStandard('NIST-CMVP-MIP-List'),
    getStandard('NIST-CMVP-Validated-Modules'),
    getStandard('NIST-CMVP-140-2-to-140-3-Transition-Timeline'),
    getStandard('EO-2026-06-22-Securing-the-Nation'), // EO 14412 §6(b)
    getStandard('NIST-SP-800-140B'),
    getStandard('NIST-ACVP'),
    getStandard('NIST-CMVP-ESV'),
    getStandard('NIST-SP-1800-40B-IPD'),
    getStandard('NIST-SP-1800-40A-PD'),
    getStandard('NIST-CSWP-37A'),
    getStandard('NIST-CSWP-37B-Automation-of-the-NIST-Cryptographic-Module-Va'),
    getStandard('NIST IR 8547'),
    // Algorithm standards the shared PQC section cites (sharedData.ts SHARED_SOURCES)
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    getStandard('FIPS 205'),

    // ── Common Criteria / CCRA (Path B) ──
    getStandard('CCMC-2023-04-001-CC2022-Transition-Policy'),
    getStandard('CCDB-014-Assurance-Continuity-v3-1'),
    getStandard('COMMON-CRITERIA'), // also the term key above the scheme table (Security Target, Protection Profile)
    getStandard('CC-2022-PART2'),
    getStandard('CC-2022-PART3'),

    // ── EUCC, eIDAS and Protection Profiles (Path C) ──
    getStandard('CIR-EU-2024-482-EUCC-Cybersecurity-Certification-Scheme'),
    getStandard('CIR-EU-2024-3144-EUCC-Amendment'),
    getStandard('CIR-EU-2025-2462-EUCC-Amendment'),
    getStandard('EUCC v2.0 ACM'), // not the duplicate row ECCG-ACM-v2 (same PDF)
    getStandard('ENISA-Hybridization-Standardisation-Status'),
    getStandard('ENISA-EUCC-Assurance-Continuity-Change-Scenarios'), // new-platform section
    getStandard('EU-NIS-CG-Roadmap-v1.1'),
    getStandard('eIDAS-2-Regulation'),
    getStandard('ANSSI-CC-PP-2016-05-EN-419221-5'),
    getStandard('BSI-CC-PP-0084-V2-2026'),

    // ── PCI (Path D; public documents only, plan r2 D4) ──
    getStandard('PCI-SSC-Blog-Publishes-PTS-HSM-v5-0'),
    getStandard('PCI-PTS-Listing-Field-Definitions'),
    getStandard('PCI-SSC-Blog-KMO-v1-0-Published'),
    getStandard('PCI-SSC-P2PE-Program-Page'), // term key above the scheme table (P2PE)
    getStandard('PCI-SSC-Blog-Authentication-Cryptography-Guidance'),
    getStandard('PCI-DSS-v4-0-1-Requirements-and-Testing-Procedures'),
    getStandard('ETSI-EN-319-411'), // second source for claim:6c7319b5f7fff220
    getStandard('NIST-CMVP-FIPS-140-3-Standards-page'), // second source for claim:58f696df5ca2fd80
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
