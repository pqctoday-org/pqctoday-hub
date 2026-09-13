// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'dnssec-pqc',
  contentVersion: 1,
  lm_id: 'LM-064',
  title: 'DNSSEC & Post-Quantum Signatures',
  description:
    'DNSSEC moving to post-quantum signatures: the ML-DSA-44 mechanism behind IANA DNSSEC algorithm 18, Cloudflare’s 1.1.1.1 resolver-side pilot against the dnstest.dev signed test zone, and what’s still missing before production zones can be signed.',
  whyThisMatters:
    'DNSSEC is a signature-only protocol protecting the integrity of nearly every DNS lookup on the Internet — a cryptographically relevant quantum computer could forge its RSA/ECDSA signatures outright. Cloudflare’s 2026-09-10 milestone is the first real-world PQ DNSSEC deployment, making this one of the few PQC migrations with live production evidence rather than only drafts.',
  duration: '35 min',
  difficulty: 'intermediate',
  frameworkPhase: 'p5',
  track: 'Protocols',
  trackOrder: 9,
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
  taxonomy: {
    algorithms: ['ML-DSA', 'ECDSA'],
    standards: ['RFC 4034', 'RFC 9364', 'draft-westerbaan-dnssec-mldsa'],
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.DNSSECPQCModule })),
}

export default manifest
