// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'pki-enrollment-protocols',
  contentVersion: 6,
  lm_id: 'LM-055',
  title: 'PKI Enrollment Protocols (EST & CMP)',
  description:
    'RFC 7030 EST and RFC 9810 CMP (KEM update) — hands-on PQC certificate enrollment with real OpenSSL 3.6 WASM crypto and an in-browser mock CA.',
  whyThisMatters:
    'EST and CMP are how certificates actually get issued at scale in the real world — a PQC algorithm with no working enrollment protocol is a lab demo, not a deployable migration.',
  duration: '50 min',
  difficulty: 'advanced',
  frameworkPhase: 'p5',
  track: 'Protocols',
  trackOrder: 4,
  learnSections: [
    { id: 'enrollment-overview', label: 'Enrollment Overview' },
    { id: 'est-protocol', label: 'EST RFC 7030' },
    { id: 'cmp-protocol', label: 'CMP RFC 9810' },
    { id: 'pqc-enrollment', label: 'PQC Enrollment Drafts' },
  ],
  workshopSteps: [
    { id: 'keygen', label: 'Generate End-Entity Key (ML-DSA / ML-KEM)' },
    { id: 'cmp-ir', label: 'CMP Initial Request' },
    { id: 'est-enroll', label: 'EST simpleenroll' },
    { id: 'cmp-kur', label: 'CMP Key Update with ML-KEM' },
    { id: 'composite', label: 'Composite Enrollment (draft)' },
    { id: 'cert-viewer', label: 'Inspect Issued Certificate' },
  ],
  // Round 9, wave 2 (2026-09-19): "Start here" — one real workshop step, written from that step's component.
  startHere: {
    step: 'keygen',
    text: 'Pick an ML-DSA or ML-KEM parameter set and press Generate keypair: OpenSSL in the browser produces the end-entity key the CMP and EST enrollment steps use next, with the PEM available to inspect.',
  },
  playgroundTool: 'pki-enrollment',
  // reduced 5-tab set (no Exercises) — matches the original render
  tabs: [
    { value: 'learn', label: 'Learn' },
    { value: 'visual', label: 'Visual' },
    { value: 'workshop', label: 'Workshop' },
    { value: 'references', label: 'References' },
    { value: 'tools', label: 'Tools & Products' },
  ],
  // Wave B (2026-09-18): derived from the algorithm and standard ids this
  // module's content.ts declares (the References tab's own data), restricted to
  // the STANDARD_TAXONOMY vocabulary so the researcher browse axis and the
  // related-modules engine see it. Re-derive from content.ts; do not hand-tune.
  taxonomy: {
    algorithms: ['ML-DSA', 'ML-KEM'],
    standards: ['FIPS 203', 'FIPS 204'],
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.PKIEnrollmentProtocolsModule })),
}

export default manifest
