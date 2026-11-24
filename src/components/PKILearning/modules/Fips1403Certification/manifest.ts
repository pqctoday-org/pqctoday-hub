// SPDX-License-Identifier: AGPL-3.0-only
// OWNER: Scaffold
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'
import { resolveManifest } from '@/components/PKILearning/manifest/resolve'

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
 * One timed ~80-minute route (the second workshop step, `fips-algorithm-records`, added
 * 15 minutes to the earlier 65). Depth beyond it is `optional` reference
 * material, excluded from duration and completion.
 */
const manifest: ModuleManifest = {
  id: 'fips-140-3-certification',
  whyThisMatters:
    'The lab-tested scheme a network or payment HSM meets first: a FIPS 140-3 certificate proves one module at one version and configuration. Adding ML-KEM or ML-DSA changes the module, and the CMVP accepts that change only through one of its own submission routes.',
  learnSections: [
    { id: 'fips-what-it-is', label: 'FIPS 140-3 and the CMVP' },
    { id: 'fips-requirement-areas', label: 'The eleven requirement areas' },
    { id: 'fips-levels', label: 'Security Levels 1–4' },
    {
      id: 'fips-attack-evidence',
      label: 'Side-channel and fault attacks: what a certificate does and does not show',
    },
    { id: 'fips-lifecycle', label: 'Validation lifecycle and the MIP queue' },
    { id: 'fips-acvp-bridge', label: 'Algorithm validation is not the certificate' },
    { id: 'fips-automation', label: 'Automating validation: algorithms, entropy, then the module' },
    { id: 'fips-landscape', label: 'Today’s landscape and the 2026 horizon' },
    { id: 'fips-route-table', label: 'CMVP submission routes (Manual v2.7)', optional: true },
  ],
  workshopSteps: [
    { id: 'fips-level-planner', label: 'Level and boundary planner' },
    { id: 'fips-algorithm-records', label: 'Read the algorithm records' },
  ],
  startHere: {
    step: 'fips-level-planner',
    text: 'Open Level and boundary planner and choose the FIPS 140-3 security level and module boundary for the anchor HSM.',
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.Fips1403CertificationModule })),
}

export default resolveManifest(manifest)
