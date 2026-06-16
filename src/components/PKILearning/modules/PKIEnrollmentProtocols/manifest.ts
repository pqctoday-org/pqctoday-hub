// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'pki-enrollment-protocols',
  lm_id: 'LM-055',
  title: 'PKI Enrollment Protocols (EST & CMP)',
  description:
    'RFC 7030 EST and RFC 9810 CMP (KEM update) — hands-on PQC certificate enrollment with real OpenSSL 3.6 WASM crypto and an in-browser mock CA.',
  duration: '50 min',
  difficulty: 'advanced',
  frameworkPhase: 'p5',
  track: 'Protocols',
  trackOrder: 4,
  learnSections: [
    { id: 'enrollment-overview', label: 'Enrollment Protocols Overview' },
    { id: 'est-protocol', label: 'EST (RFC 7030) Walkthrough' },
    { id: 'cmp-protocol', label: 'CMP (RFC 4210 + 9810) Walkthrough' },
    { id: 'pqc-enrollment', label: 'PQC Enrollment Landscape & Drafts' },
  ],
  workshopSteps: [
    { id: 'keygen', label: 'Generate End-Entity Key (ML-DSA / ML-KEM)' },
    { id: 'cmp-ir', label: 'CMP Initial Request' },
    { id: 'est-enroll', label: 'EST simpleenroll' },
    { id: 'cmp-kur', label: 'CMP Key Update with ML-KEM' },
    { id: 'composite', label: 'Composite Enrollment (draft)' },
    { id: 'cert-viewer', label: 'Inspect Issued Certificate' },
  ],
  playgroundTool: 'pki-enrollment',
  load: () => import('./index').then((m) => ({ default: m.PKIEnrollmentProtocolsModule })),
}

export default manifest
