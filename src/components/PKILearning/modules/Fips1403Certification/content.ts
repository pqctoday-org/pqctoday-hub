// SPDX-License-Identifier: GPL-3.0-only
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
  version: '0.1.0',
  // No lastReviewed: nobody has reviewed this module's claims via
  // record_module_review.py yet (moduleReviewHonesty.test.ts). v1 ships as
  // "practitioner orientation", not reviewed by a lab or certification body.
  lastEdited: '2026-09-27',

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
    getStandard('NIST-CSWP-37B-IPD'),
    // Algorithm standards the shared PQC section cites (sharedData.ts SHARED_SOURCES)

    // PCI documents the FIPS Level 3 callout cites (FipsSections.tsx): PIN v3.1
    // Req 1-3 and P2PE v3.1 4A-1.1 accept FIPS Level 3+ or PCI-approved HSMs
    getStandard('PCI-PIN-v3-1-ROC-Reporting-Template'),
    getStandard('PCI-P2PE-Security-Requirements-v3-1'), // superseded by v3.2 (June 2025)
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
