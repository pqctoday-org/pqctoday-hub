// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'dnssec-pqc',
  whyThisMatters:
    'DNSSEC is a signature-only protocol that protects DNS data authenticity and integrity when a validating resolver checks a signed zone — a cryptographically relevant quantum computer could forge its RSA/ECDSA signatures outright. Cloudflare’s 2026-09-10 announcement adds ML-DSA-44 validation to resolvers as one of the first PQC deployment steps.',
  learnSections: [
    { id: 'dnssec-basics', label: 'What DNSSEC Protects' },
    { id: 'mldsa44-mechanism', label: 'ML-DSA-44 & Algorithm 18' },
    { id: 'cloudflare-pilot', label: "Cloudflare's Real Pilot" },
    { id: 'whats-missing', label: "What's Still Missing" },
  ],
  workshopSteps: [
    { id: 'signature-size-explorer', label: 'Signature Size Explorer' },
    { id: 'validation-chain-walkthrough', label: 'PQ Validation Chain Walkthrough' },
    { id: 'deployment-roadmap-tracker', label: 'Deployment Roadmap Tracker' },
  ],
  // Round 9, wave 2 (2026-09-19): "Start here" — one real workshop step, written from that step's component.
  startHere: {
    step: 'signature-size-explorer',
    text: 'Click each algorithm row in the Signature Size Explorer: its signature is drawn against the 1,232-byte DNS UDP limit, and the two post-quantum rows show why an ML-DSA-44 or SLH-DSA response needs TCP.',
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.DNSSECPQCModule })),
}

export default manifest
