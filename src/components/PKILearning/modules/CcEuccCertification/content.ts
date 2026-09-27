// SPDX-License-Identifier: GPL-3.0-only
// OWNER: Scaffold
/**
 * Structured content for the Cryptographic Product Certification module — Common Criteria, EUCC & eIDAS deep dive (LM-068).
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
  moduleId: 'cc-eucc-certification',
  version: '0.1.0',
  // No lastReviewed: nobody has reviewed this module's claims via
  // record_module_review.py yet (moduleReviewHonesty.test.ts). v1 ships as
  // "practitioner orientation", not reviewed by a lab or certification body.
  lastEdited: '2026-09-27',

  standards: [
    // ── FIPS 140-3 / CMVP (Path A) ──
    // Algorithm standards the shared PQC section cites (sharedData.ts SHARED_SOURCES)
    // ── Common Criteria / CCRA (Path B) ──
    getStandard('CCMC-2023-04-001-CC2022-Transition-Policy'),
    getStandard('CCDB-014-Assurance-Continuity-v3-1'),
    getStandard('CCMC-011-CCRA-EUCC-Coexistence'),
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
    getStandard('EUCC v2.0 ACM'), // not the duplicate row ECCG-ACM-v2 (same PDF)
    getStandard('ENISA-Hybridization-Standardisation-Status'),
    getStandard('EU-NIS-CG-Roadmap-v1.1'),
    getStandard('eIDAS-2-Regulation'),
    getStandard('CIR-EU-2025-1567-Remote-QSCD-Management'),
    getStandard('CIR-EU-2025-1570-QSCD-Certification-Notification'),
    getStandard('CID-EU-2016-650-QSCD-Security-Assessment'),
    getStandard('ANSSI-CC-PP-2016-05-EN-419221-5'),
    getStandard('ANSSI-CC-PP-2016-05-M01'),
    getStandard('ANSSI-CC-PP-2018-02-EN-419241-2'),
    getStandard('BSI-CC-PP-0084-V2-2026'),
    getStandard('ENISA-EUCC-HSM-PP-FPT-PHP-Interpretation'),
    getStandard('ENISA-EUCC-Assurance-Continuity-Change-Scenarios'),
    getStandard('ENISA-EUCC-Product-Series-Methodology'),

    // ── PCI (Path D; public documents only, plan r2 D4) ──
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
