// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'digital-id',
  contentVersion: 3,
  lm_id: 'LM-030',
  title: 'Digital ID',
  description:
    'Master EUDI Wallet: Wallet activation, PID issuance, attestations, QES, and verification.',
  whyThisMatters:
    "A digital identity credential is meant to outlive the person it identifies — if its signature can be forged retroactively, the fraud isn't limited to one transaction, it's identity theft at national scale.",
  duration: '80 min',
  difficulty: 'advanced',
  frameworkPhase: 'p5',
  track: 'Applications',
  trackOrder: 5,
  // These are the sections the Learn tab actually renders, in order. Until
  // 2026-07-31 this listed five DIFFERENT ids ('wallet', 'pid', 'qes') that
  // matched no rendered heading, and the tab emitted no anchors at all — so
  // the sidebar advertised "0/5 sections read" against sections that did not
  // exist, and every ?section= / #id deep link resolved to nothing.
  learnSections: [
    { id: 'eidas', label: 'What is eIDAS 2.0?' },
    { id: 'credential-formats', label: 'Credential Formats: mdoc vs SD-JWT' },
    { id: 'trust-framework', label: 'Trust Framework' },
    { id: 'privacy', label: 'Privacy by Design' },
    { id: 'pqc-readiness', label: 'Post-Quantum Readiness' },
    { id: 'large-scale-pilots', label: 'Large-Scale Pilots' },
  ],
  workshopSteps: [
    { id: 'wallet', label: 'EUDI Wallet' },
    { id: 'pid-issuer', label: 'PID Issuer' },
    { id: 'attestation', label: 'University Attestation' },
    { id: 'relying-party', label: 'Relying Party' },
    { id: 'qes', label: 'Qualified Electronic Signature' },
  ],
  playgroundTool: 'digital-id',
  taxonomy: { algorithms: ['ML-DSA'], standards: ['X.509'] },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.DigitalIDModule })),
}

export default manifest
