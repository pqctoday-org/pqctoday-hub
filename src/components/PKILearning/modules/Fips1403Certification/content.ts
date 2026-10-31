// SPDX-License-Identifier: AGPL-3.0-only
// OWNER: Scaffold
/**
 * Structured content for the FIPS 140-3 Certification deep dive (LM-067).
 *
 * SPLIT 2026-09-27 (twice: out of LM-065, then PCI out to LM-071): this
 * module lists exactly the references its own files cite (plus any that were
 * listed for its scheme but cited nowhere). The
 * four certification modules share some rows because the fundamentals'
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
  moduleId: 'fips-140-3-certification',
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
    getStandard('NIST-CSWP-37B-Automation-of-the-NIST-Cryptographic-Module-Va'),
    // Validation automation (fips-automation section, 2026-09-27)
    getStandard('NIST-Cryptographic-Algorithm-Validation-Program-CAVP'),
    getStandard('NIST-CMVP-ESV-Program'),
    getStandard('NIST-CMVP-ESV-Announcements'),
    getStandard('NIST-CMVP-MIS-SP800-140B'),
    getStandard('NIST-ACMVP-Protocol-Workstream'),
    getStandard('NCCoE-Automation-of-the-CMVP'),
    // Algorithm standards the shared PQC section cites (sharedData.ts SHARED_SOURCES)

    // PCI page the FIPS Level 3 callout cites (FipsSections.tsx): PTS approval is assigned and listed by PCI SSC
    getStandard('PCI-PTS-Listing-Field-Definitions'),
    getStandard('NIST-CMVP-FIPS-140-3-Standards-page'), // second source for claim:5be7a52c8654adee
    getStandard('ISO-IEC-19790-2025'), // second source for claim:e462fd5c6b804f37
    // Side-channel and fault attacks section (fips-attack-evidence)
    getStandard('CC-2022-PART3'),
    getStandard('NIST-PQC-Seminar-FaultInjection-Lattice'),
    getStandard('PROACT-2025-SCA-Lattice-PQC'),
    getStandard('ENISA-EUCC-HSM-PP-FPT-PHP-Interpretation'),
    getStandard('ENISA-EUCC-Assurance-Continuity-Change-Scenarios'),
    getStandard('NIST-CMVP-Programmatic-Transitions'),
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
