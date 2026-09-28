// SPDX-License-Identifier: GPL-3.0-only
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
 * Two alternative learn paths, one per scheme, each a timed ~60-minute route.
 * Depth beyond the timed route is `optional` reference material, excluded
 * from duration and completion. Off-path sections are hidden.
 */
const manifest: ModuleManifest = {
  id: 'cc-eucc-certification',
  contentVersion: 3,
  lm_id: 'LM-068',
  title: 'Common Criteria, EUCC & eIDAS Certification',
  description:
    'Common Criteria and the CC:2022 transition, EUCC as the EU scheme, eIDAS qualified devices and the Protection Profiles that connect them: what each claim proves and what adding PQC means for a certified product.',
  whyThisMatters:
    'In Europe a product meets Common Criteria three ways at once: as an international CCRA certificate, as an EUCC certificate under EU law, and as the evaluation behind an eIDAS qualified device. Reading the claim — EAL, augmentations, Protection Profile — is what tells you whether adding PQC is a change the certificate survives.',
  duration: '60 min',
  difficulty: 'advanced',
  frameworkPhase: 'p7',
  track: 'Hardware Infrastructure',
  trackOrder: 7,
  learnSections: [
    { id: 'cc-model', label: 'The Common Criteria model' },
    { id: 'cc-eal-decoding', label: 'EALs and "EAL4+"' },
    { id: 'cc-lifecycle', label: 'Certification lifecycle and CC:2022 transition' },
    { id: 'cc-continuity', label: 'Assurance continuity (CCDB-014)', optional: true },
    { id: 'cc-regional-schemes', label: 'One criteria, many schemes: the regional schemes' },
    {
      id: 'cc-regional-reference',
      label: 'Regional schemes: per-scheme reference',
      optional: true,
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
      label: 'Common Criteria',
      entrySection: 'cc-model',
      // +10 min: the regional-schemes section (user request 2026-09-27)
      duration: '70 min',
      sections: [
        'cc-model',
        'cc-eal-decoding',
        'cc-lifecycle',
        'cc-continuity',
        'cc-regional-schemes',
        'cc-regional-reference',
        'pp-security-ic',
      ],
    },
    {
      id: 'eucc-eidas',
      label: 'EUCC & eIDAS',
      entrySection: 'eucc-scheme',
      duration: '60 min',
      sections: ['eucc-scheme', 'eidas-chain', 'pp-en419221-5', 'pp-security-ic', 'eucc-pqc-today'],
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
    'CIR-EU-2024-482-EUCC-Cybersecurity-Certification-Scheme': ['eucc-eidas'],
    'CIR-EU-2024-3144-EUCC-Amendment': ['eucc-eidas'],
    'CIR-EU-2025-2462-EUCC-Amendment': ['eucc-eidas'],
    'EUCC v2.0 ACM': ['eucc-eidas'],
    'ENISA-Hybridization-Standardisation-Status': ['eucc-eidas'],
    'EU-NIS-CG-Roadmap-v1.1': ['eucc-eidas'],
    'eIDAS-2-Regulation': ['eucc-eidas'],
    'CIR-EU-2025-1567-Remote-QSCD-Management': ['eucc-eidas'],
    'CIR-EU-2025-1570-QSCD-Certification-Notification': ['eucc-eidas'],
    'CID-EU-2016-650-QSCD-Security-Assessment': ['eucc-eidas'],
    'ENISA-EUCC-HSM-PP-FPT-PHP-Interpretation': ['eucc-eidas'],
    'ENISA-EUCC-Assurance-Continuity-Change-Scenarios': ['eucc-eidas'],
    'ENISA-EUCC-Product-Series-Methodology': ['eucc-eidas'],
    'ANSSI-CC-PP-2016-05-EN-419221-5': ['cc', 'eucc-eidas'],
    'ANSSI-CC-PP-2016-05-M01': ['cc', 'eucc-eidas'],
    'ANSSI-CC-PP-2018-02-EN-419241-2': ['cc', 'eucc-eidas'],
    'BSI-CC-PP-0084-V2-2026': ['cc', 'eucc-eidas'],
  },
  workshopSteps: [
    { id: 'cc-claim-decoder', label: 'Decode the certificate claim', paths: ['cc'] },
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
