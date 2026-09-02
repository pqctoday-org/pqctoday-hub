// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'government-defense-pqc',
  contentVersion: 3,
  lm_id: 'LM-062',
  title: 'Government & Defense PQC',
  description:
    'The federal PQC policy layer: the CNSA 2.0 suite and its dated mandates, National Security Systems and CSfC, Federal PKI and the PQC certificate profile, the statute/EO/OMB stack, and how CISA product categories shape procurement.',
  whyThisMatters:
    'Government is the one sector where post-quantum migration is already binding rather than advisory — CNSA 2.0 is required for new National Security System acquisitions from 1 January 2027, and vendors selling into that market inherit the deadline whether or not they have planned for it.',
  duration: '60 min',
  difficulty: 'advanced',
  frameworkPhase: 'p5',
  track: 'Industries',
  trackOrder: 7,
  learnSections: [
    { id: 'cnsa-suite', label: 'The CNSA 2.0 Suite' },
    { id: 'cnsa-timeline', label: 'Mandates & Dated Milestones' },
    { id: 'nss-csfc', label: 'National Security Systems & CSfC' },
    { id: 'federal-pki', label: 'Federal PKI & the PQC Profile' },
    { id: 'procurement', label: 'Procurement & Supply Chain' },
  ],
  workshopSteps: [
    { id: 'suite-comparator', label: 'CNSA 1.0 → 2.0 Comparator' },
    { id: 'mandate-explorer', label: 'Federal Mandate Explorer' },
    { id: 'fpki-profile-pair', label: 'Federal PKI Profile Pair' },
  ],
  // reduced 5-tab set (no Exercises) — no exercises component is wired for
  // this module; the default STANDARD_TABS set was rendering an empty tab.
  tabs: [
    { value: 'learn', label: 'Learn' },
    { value: 'visual', label: 'Visual' },
    { value: 'workshop', label: 'Workshop' },
    { value: 'references', label: 'References' },
    { value: 'tools', label: 'Tools & Products' },
  ],
  // Not sim-embeddable: SIM_LEARN_MODULES is a curated set and the conformance
  // test asserts `embeddable` matches it exactly. Adding this module to the
  // simulation is a separate decision, not a side effect of authoring it.
  embeddable: false,
  load: () => import('./index').then((m) => ({ default: m.GovernmentDefensePQCModule })),
}

export default manifest
