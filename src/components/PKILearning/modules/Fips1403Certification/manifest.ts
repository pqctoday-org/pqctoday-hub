// SPDX-License-Identifier: GPL-3.0-only
// OWNER: Scaffold
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

/**
 * FIPS 140-3 Certification (LM-067).
 *
 * SPLIT 2026-09-27 out of LM-065 (crypto-product-certification), then split
 * again the same day (user decision): the FIPS 140-3 & PCI deep dive
 * (id `fips-pci-certification`) became this module and LM-071
 * `pci-certification`. This module keeps LM-067, the FIPS sections, step and
 * exercises with their ids unchanged; the old id is declared in
 * MODULE_ID_RENAMES so saved progress carries over, and the old URL redirects
 * here (`?path=pci` goes to LM-071). The anchor product (the fictional Orrin N7
 * network HSM) and the shared types stay single-sourced in LM-065's data/.
 *
 * One timed ~60-minute route. Depth beyond it is `optional` reference
 * material, excluded from duration and completion.
 */
const manifest: ModuleManifest = {
  id: 'fips-140-3-certification',
  contentVersion: 7,
  lm_id: 'LM-067',
  title: 'FIPS 140-3 Certification',
  description:
    'FIPS 140-3 and the CMVP in depth: what a certificate proves, the eleven requirement areas and four security levels, the validation queue, why algorithm validation is not the certificate, and what adding PQC means for a validated module.',
  whyThisMatters:
    'The lab-tested scheme a network or payment HSM meets first: a FIPS 140-3 certificate proves one module at one version and configuration. Adding ML-KEM or ML-DSA changes the module, and the CMVP accepts that change only through one of its own submission routes.',
  duration: '60 min',
  difficulty: 'advanced',
  frameworkPhase: 'p7',
  track: 'Hardware Infrastructure',
  trackOrder: 7,
  learnSections: [
    { id: 'fips-what-it-is', label: 'FIPS 140-3 and the CMVP' },
    { id: 'fips-requirement-areas', label: 'The eleven requirement areas' },
    { id: 'fips-levels', label: 'Security Levels 1–4' },
    { id: 'fips-lifecycle', label: 'Validation lifecycle and the MIP queue' },
    { id: 'fips-acvp-bridge', label: 'Algorithm validation is not the certificate' },
    { id: 'fips-automation', label: 'Automating validation: algorithms, entropy, then the module' },
    { id: 'fips-landscape', label: 'Today’s landscape and the 2026 horizon' },
    { id: 'fips-route-table', label: 'CMVP submission routes (Manual v2.7)', optional: true },
  ],
  workshopSteps: [{ id: 'fips-level-planner', label: 'Level and boundary planner' }],
  startHere: {
    step: 'fips-level-planner',
    text: 'Open Level and boundary planner and choose the FIPS 140-3 security level and module boundary for the anchor HSM.',
  },
  // Derived from content.ts, restricted to the STANDARD_TAXONOMY vocabulary
  // (moduleEnrichment.ts). Re-derive from content.ts; do not hand-tune.
  taxonomy: {
    algorithms: ['ML-KEM', 'ML-DSA'],
    standards: ['FIPS 140-3'],
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.Fips1403CertificationModule })),
}

export default manifest
