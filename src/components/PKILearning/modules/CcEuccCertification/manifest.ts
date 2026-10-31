// SPDX-License-Identifier: AGPL-3.0-only
// OWNER: Scaffold
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

/**
 * Common Criteria, EUCC & eIDAS Certification (LM-068).
 *
 * SPLIT 2026-09-27 out of LM-065 (crypto-product-certification), which the
 * user judged too large. Sections, workshop steps, exercises and data moved
 * here unchanged, with the same ids; LM-065 keeps the fundamentals every
 * scheme shares (four questions, scope before level, what PQC changes, the
 * capstone). The anchor product (the fictional Orrin N7 network HSM) and the
 * shared types stay single-sourced in LM-065's data/ folder.
 *
 * Two alternative learn paths: CC evaluation criteria, and EUCC scheme/eIDAS context.
 * Depth beyond the timed route is `optional` reference material, excluded
 * from duration and completion. Off-path sections are hidden.
 */
const manifest: ModuleManifest = {
  id: 'cc-eucc-certification',
  contentVersion: 23,
  lm_id: 'LM-068',
  title: 'Common Criteria, EUCC & eIDAS Certification',
  description:
    'Common Criteria and the CC:2022 transition, EUCC as the EU scheme, eIDAS qualified devices and the Protection Profiles that connect them: what each claim proves and what adding PQC means for a certified product.',
  whyThisMatters:
    'In Europe, a Common Criteria evaluation may support an EUCC certificate and, for applicable qualified electronic-signature or seal devices, form part of an eIDAS conformity chain. CCRA recognition is separate and depends on the certificate, scheme, assurance claim and recognition rules. Reading the exact claim is what tells you whether adding PQC is a change the certificate survives.',
  duration: '66 min',
  difficulty: 'advanced',
  frameworkPhase: 'p7',
  track: 'Hardware Infrastructure',
  trackOrder: 8,
  learnSections: [
    { id: 'cc-model', label: 'The Common Criteria model' },
    { id: 'cc-eal-decoding', label: 'EALs and "EAL4+"' },
    { id: 'cc-lifecycle', label: 'Certification lifecycle and CC:2022 transition' },
    { id: 'cc-continuity', label: 'Assurance continuity (CCDB-015)', optional: true },
    { id: 'cc-regional-schemes', label: 'One criteria, many schemes: the regional schemes' },
    {
      id: 'cc-regional-reference',
      label: 'Regional schemes: per-scheme reference',
      optional: true,
    },
    {
      id: 'niap-pqc-route',
      label: 'NIAP and post-quantum cryptography: what its profiles require',
    },
    { id: 'eucc-scheme', label: 'EUCC is a scheme, not a PP' },
    { id: 'eidas-chain', label: 'From eIDAS to a certified device' },
    { id: 'pp-en419221-5', label: 'PP case: EN 419221-5 HSM' },
    { id: 'pp-security-ic', label: 'PP case: Security IC Platform', optional: true },
    { id: 'eucc-pqc-today', label: 'PQC under EUCC today (ACM v2)' },
  ],
  learnPaths: [
    {
      id: 'cc',
      label: 'Common Criteria — evaluation criteria',
      entrySection: 'cc-model',
      // +10 min: the regional-schemes section (user request 2026-09-27)
      // +4 min: the NIAP section; +2 min more: its table of profiles and the quoted decisions
      duration: '76 min',
      sections: [
        'cc-model',
        'cc-eal-decoding',
        'cc-lifecycle',
        'cc-continuity',
        'cc-regional-schemes',
        'cc-regional-reference',
        'niap-pqc-route',
        'pp-security-ic',
      ],
    },
    {
      id: 'eucc',
      label: 'EUCC — scheme rules',
      entrySection: 'eucc-scheme',
      duration: '35 min',
      sections: ['eucc-scheme', 'eucc-pqc-today', 'pp-security-ic'],
    },
    {
      // Preserve the legacy URL and section-progress IDs for existing learners.
      id: 'eucc-eidas',
      label: 'eIDAS — applicable devices and trust services',
      entrySection: 'eidas-chain',
      duration: '60 min',
      sections: ['eidas-chain', 'pp-en419221-5', 'pp-security-ic'],
    },
  ],
  offPathSections: 'hide',
  referencePaths: {
    // ── FIPS 140-3 / CMVP (Path A) ──
    // ── Common Criteria / CCRA (Path B) ──
    // CCMC-011 is CCRA/EUCC co-existence, so it belongs to both schemes.
    'CCMC-2023-04-001-CC2022-Transition-Policy': ['cc'],
    'CCDB-014-Assurance-Continuity-v3-1': ['cc'],
    'CCMC-011-CCRA-EUCC-Coexistence': ['cc', 'eucc-eidas'],
    'COMMON-CRITERIA': ['cc'],
    'CC-2022-PART2': ['cc'],
    'CC-2022-PART3': ['cc'],
    'CC-2022-PART4': ['cc'],
    'CC-2022-PART5': ['cc'],
    'CC-2022-CEM': ['cc'],

    // ── EUCC, eIDAS and Protection Profiles (Path C) ──
    // The protection profiles are evaluated under Common Criteria and cited by
    // the EUCC path, so both paths get them.
    'CIR-EU-2024-482-EUCC-Cybersecurity-Certification-Scheme': ['eucc', 'eucc-eidas'],
    'CIR-EU-2024-3144-EUCC-Amendment': ['eucc', 'eucc-eidas'],
    'CIR-EU-2025-2462-EUCC-Amendment': ['eucc', 'eucc-eidas'],
    'EUCC v2.0 ACM': ['eucc', 'eucc-eidas'],
    'ENISA-Hybridization-Standardisation-Status': ['eucc', 'eucc-eidas'],
    'EU-NIS-CG-Roadmap-v1.1': ['eucc-eidas'],
    'eIDAS-2-Regulation': ['eucc-eidas'],
    'CIR-EU-2025-1567-Remote-QSCD-Management': ['eucc-eidas'],
    'CIR-EU-2025-1570-QSCD-Certification-Notification': ['eucc-eidas'],
    'CID-EU-2016-650-QSCD-Security-Assessment': ['eucc-eidas'],
    'ENISA-EUCC-HSM-PP-FPT-PHP-Interpretation': ['eucc-eidas'],
    'ENISA-EUCC-Assurance-Continuity-Change-Scenarios': ['eucc', 'eucc-eidas'],
    'ENISA-EUCC-Product-Series-Methodology': ['eucc', 'eucc-eidas'],
    'ANSSI-CC-PP-2016-05-EN-419221-5': ['cc', 'eucc-eidas'],
    'ANSSI-CC-PP-2016-05-M01': ['cc', 'eucc-eidas'],
    'ANSSI-CC-PP-2018-02-EN-419241-2': ['cc', 'eucc-eidas'],
    'BSI-CC-PP-0084-V2-2026': ['cc', 'eucc', 'eucc-eidas'],
    // Sources added 15 Oct 2026 for sentences the module already makes.
    // ISO/IEC 19790 security levels are read in both schemes' sections.
    'CMVP-MGMT-MANUAL': ['cc', 'eucc-eidas'],
    'NIAP-CCEVS-POLICY-33': ['cc'],
    // Sources for the NIAP section (23 Oct 2026).
    'NIAP-CCEVS-MANUAL': ['cc'],
    'NSA CNSA 2.0 FAQ': ['cc'],
    'NSA CSfC PQC Guidance Addendum': ['cc'],
    'CNSSP-11-IA-Product-Acquisition-Policy': ['cc'],
    'CNSSP 15': ['cc'],
    'BSI-CC-PP-0114-V2X-HSM': ['cc'],
    'CAR-2-CAR-Communication-Consortium-HSM-Protection-Profile': ['cc'],
    'NIAP-Protection-Profile-for-Application-Software-Version-2-0': ['cc'],
    'NIAP-cPP-Dedicated-Security-Component-Version-2-1': ['cc'],
    'NIAP-cPP-Network-Devices-Version-4-0': ['cc'],
    'NIAP-PP-General-Purpose-Computing-Platforms-Version-2-0': ['cc'],
    'NIAP-PP-Virtualization-Version-2-0': ['cc'],
    'NIAP-cPP-Full-Drive-Encryption-Authorization-Acquisition-Version-3-0': ['cc'],
    'NIAP-cPP-Full-Drive-Encryption-Encryption-Engine-Version-3-0': ['cc'],
    'NIAP-cPP-Hardcopy-Devices-Version-2-0': ['cc'],
    'NIAP-PP-Module-VPN-Client-Version-3-0': ['cc'],
    'NIAP-PP-Module-File-Encryption-Version-2-0': ['cc'],
    'NIAP-PP-Module-File-Encryption-Enterprise-Management-Version-2-0': ['cc'],
    'NIAP-cPP-DSC-Supporting-Document-Version-2-1': ['cc'],
    'NIAP-TD1010-Network-Devices-v4-0-Endorsement': ['cc'],
    'NIAP-TD1011-DSC-v2-1-Endorsement': ['cc'],
    'NIAP-Announcements-Policy-33-Technical-Decisions-Notice': ['cc'],
    'ENISA-State-of-Cybersecurity-2024': ['eucc-eidas'],
    'EUCC-Guidelines-on-Cryptography': ['eucc', 'eucc-eidas'],
  },
  workshopSteps: [
    { id: 'cc-claim-decoder', label: 'Decode the certificate claim', paths: ['cc', 'eucc'] },
    { id: 'eidas-trace', label: 'Regulation-to-certificate trace', paths: ['eucc-eidas'] },
  ],
  startHere: {
    step: 'cc-claim-decoder',
    text: 'Open Decode the certificate claim and decode a Common Criteria claim — the EAL, each named augmentation, and what it does and does not cover.',
  },
  // Derived from content.ts, restricted to the STANDARD_TAXONOMY vocabulary
  // (moduleEnrichment.ts). Re-derive from content.ts; do not hand-tune.
  taxonomy: {
    algorithms: ['ML-KEM', 'ML-DSA'],
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.CcEuccCertificationModule })),
}

export default manifest
