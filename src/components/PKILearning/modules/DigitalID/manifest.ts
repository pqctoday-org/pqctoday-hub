// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'
import { resolveManifest } from '@/components/PKILearning/manifest/resolve'

const manifest: ModuleManifest = {
  id: 'digital-id',
  whyThisMatters:
    'A digital identity credential such as the PID is issued under Union or national law and lets a person establish who they are — if its signature can be forged, a counterfeit credential would pass verification.',
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
  // Round 9, wave 2 (2026-09-19): "Start here" — one real workshop step, written from that step's component.
  startHere: {
    step: 'pid-issuer',
    text: 'Press Start Issuance Flow at the PID Issuer: the flow walks Discovery, Authorization, HSM Key Gen and Issuance with the protocol log alongside, and the PID lands in your wallet.',
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.DigitalIDModule })),
}

export default resolveManifest(manifest)
