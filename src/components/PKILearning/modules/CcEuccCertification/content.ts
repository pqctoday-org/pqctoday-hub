// SPDX-License-Identifier: AGPL-3.0-only
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
  lastReviewed: '2026-11-01',
  // lastReviewed is the owner's sign-off of 1 November 2026 (moduleReviewHonesty.test.ts); the
  // revision record backs it. The on-page notice follows it (common/moduleReviewStatus.ts).
  version: '0.1.0',
  lastEdited: '2026-11-02',

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
    getStandard('CMVP-MGMT-MANUAL'), // second source for claim:3a3eeed3b35cd08b
    getStandard('ENISA-State-of-Cybersecurity-2024'), // second source for claim:aa6c2717399a14ad
    getStandard('NIAP-CCEVS-POLICY-33'), // second source for claim:e08838c7dd690915
    getStandard('NIAP-CCEVS-MANUAL'),
    getStandard('NSA CNSA 2.0 FAQ'),
    getStandard('NSA CSfC PQC Guidance Addendum'),
    getStandard('CNSSP-11-IA-Product-Acquisition-Policy'),
    getStandard('CNSSP 15'),
    getStandard('BSI-CC-PP-0114-V2X-HSM'),
    getStandard('CAR-2-CAR-Communication-Consortium-HSM-Protection-Profile'),
    getStandard('NIAP-Protection-Profile-for-Application-Software-Version-2-0'),
    getStandard('NIAP-cPP-Dedicated-Security-Component-Version-2-1'),
    getStandard('NIAP-cPP-Network-Devices-Version-4-0'),
    getStandard('NIAP-PP-General-Purpose-Computing-Platforms-Version-2-0'),
    getStandard('NIAP-PP-Virtualization-Version-2-0'),
    getStandard('NIAP-cPP-Full-Drive-Encryption-Authorization-Acquisition-Version-3-0'),
    getStandard('NIAP-cPP-Full-Drive-Encryption-Encryption-Engine-Version-3-0'),
    getStandard('NIAP-cPP-Hardcopy-Devices-Version-2-0'),
    getStandard('NIAP-PP-Module-VPN-Client-Version-3-0'),
    getStandard('NIAP-PP-Module-File-Encryption-Version-2-0'),
    getStandard('NIAP-PP-Module-File-Encryption-Enterprise-Management-Version-2-0'),
    getStandard('NIAP-cPP-DSC-Supporting-Document-Version-2-1'),
    getStandard('NIAP-TD1010-Network-Devices-v4-0-Endorsement'),
    getStandard('NIAP-TD1011-DSC-v2-1-Endorsement'),
    getStandard('NIAP-Announcements-Policy-33-Technical-Decisions-Notice'),
    getStandard('EUCC-Guidelines-on-Cryptography'), // second source for claim:48f91fd0621d1352
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
