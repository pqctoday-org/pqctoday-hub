// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'government-defense-pqc',
  whyThisMatters:
    'Government is the one sector where post-quantum migration is already binding rather than advisory — CNSA 2.0 is required for new National Security System acquisitions from 1 January 2027, and vendors selling into that market inherit the deadline whether or not they have planned for it.',
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
  startHere: {
    step: 'mandate-explorer',
    text: 'Pick a system class in the Federal Mandate Explorer — National Security System, federal civilian, or a nonfederal system handling CUI — and see which instruments bind it and whether any of them has a dated deadline.',
  },
  // reduced 5-tab set (no Exercises) — no exercises component is wired for
  // this module; the default STANDARD_TABS set was rendering an empty tab.
  tabs: [
    { value: 'learn', label: 'Learn' },
    { value: 'visual', label: 'Visual' },
    { value: 'workshop', label: 'Workshop' },
    { value: 'references', label: 'References' },
    { value: 'tools', label: 'Tools & Products' },
  ],
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.GovernmentDefensePQCModule })),
}

export default manifest
