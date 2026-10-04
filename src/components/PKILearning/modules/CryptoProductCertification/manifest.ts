// SPDX-License-Identifier: GPL-3.0-only
// OWNER: Scaffold
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

/**
 * Cryptographic Product Certification — Fundamentals (LM-065).
 *
 * SPLIT 2026-09-27 (user decision: the four-path module was too large). This
 * module keeps the id, URL, poster and revision history and now holds only
 * what every scheme shares: the four questions, scope before level, what PQC
 * changes in certification, crypto agility vs certification latency, the
 * deadlines, and the capstone that plans one product across four markets.
 * The scheme deep dives moved out (the FIPS/PCI one was split again the
 * same day, user decision):
 *   - LM-067 fips-140-3-certification — FIPS 140-3 / CMVP
 *   - LM-068 cc-eucc-certification   — Common Criteria, EUCC and eIDAS (cc / eucc-eidas paths)
 *   - LM-071 pci-certification        — PCI PTS HSM and the payment operating stack
 * Section and step ids are unchanged from the build spec
 * (pqctoday-priv/nextfeature/cryptographic-certification-module-build-spec-09242026.md).
 *
 * `prerequisiteIds` is deliberately NOT declared: moduleRelations.driftguard
 * pins that no module authors a graph yet, and declaring one REPLACES the
 * computed "Related modules" list.
 */
const manifest: ModuleManifest = {
  id: 'crypto-product-certification',
  contentVersion: 7,
  lm_id: 'LM-065',
  title: 'Cryptographic Product Certification: Fundamentals',
  description:
    'What a FIPS 140-3, Common Criteria, EUCC or PCI certificate proves, why scope comes before level, and what adding PQC changes in each scheme. Deep dives: LM-067 (FIPS 140-3), LM-068 (Common Criteria, EUCC & eIDAS) and LM-071 (PCI).',
  whyThisMatters:
    'A certificate proves something narrow — a defined module, target or device, at a version and configuration, against one scheme’s requirements. Adding PQC changes the product, and each scheme has its own route for that change: a market deadline creates urgency, but no shortcut.',
  duration: '60 min',
  difficulty: 'advanced',
  frameworkPhase: 'p7',
  track: 'Hardware Infrastructure',
  trackOrder: 6,
  learnSections: [
    { id: 'four-questions', label: 'Four schemes, four questions' },
    { id: 'scope-before-level', label: 'Scope before level' },
    { id: 'pqc-impact', label: 'What PQC changes in certification' },
    { id: 'agility-latency', label: 'Crypto agility vs certification latency' },
    { id: 'transition-deadlines', label: 'Deadlines: urgency without shortcuts' },
    { id: 'change-routes-detail', label: 'Incremental-change routes by scheme', optional: true },
    { id: 'electronic-exchange', label: 'Electronic evidence exchange', optional: true },
  ],
  workshopSteps: [
    { id: 'scheme-selector', label: 'Which scheme answers the question?' },
    { id: 'boundary-drawer', label: 'Draw the certification boundary' },
    { id: 'capstone', label: 'One product, four markets' },
    { id: 'change-analyzer', label: 'PQC change analyzer', optional: true },
    { id: 'evidence-exchange', label: 'Evidence exchange demo', optional: true },
  ],
  startHere: {
    step: 'scheme-selector',
    text: 'Open Which scheme answers the question? and match each certification claim to FIPS 140-3, Common Criteria, EUCC or PCI — the scheme whose certificate can actually answer it.',
  },
  // Derived from content.ts, restricted to the STANDARD_TAXONOMY vocabulary
  // (moduleEnrichment.ts). Re-derive from content.ts; do not hand-tune.
  taxonomy: {
    algorithms: ['ML-KEM', 'ML-DSA'],
    standards: ['FIPS 140-3', 'NIST IR 8547'],
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.CryptoProductCertificationModule })),
}

export default manifest
