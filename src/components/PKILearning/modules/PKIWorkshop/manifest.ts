// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'pki-workshop',
  whyThisMatters:
    "PKI is the trust infrastructure everything else in this curriculum assumes exists — certificate chains, revocation, and CA hierarchies are what make 'this key belongs to this identity' a claim anyone can verify.",
  learnSections: [
    { id: 'fundamentals', label: 'PKI Fundamentals' },
    { id: 'cert-structure', label: 'Certificate Structure' },
    { id: 'ca-hierarchy', label: 'CA Hierarchies' },
    { id: 'lifecycle', label: 'Certificate Lifecycle' },
    { id: 'pqc-pki', label: 'PQC PKI Migration Path' },
  ],
  workshopSteps: [
    { id: 'csr', label: 'Certificate Signing Request' },
    { id: 'root-ca', label: 'Root CA Setup' },
    { id: 'sign', label: 'Certificate Signing' },
    { id: 'parse', label: 'Certificate Parsing' },
    { id: 'revoke', label: 'Certificate Revocation' },
    { id: 'mtc', label: 'Merkle Tree Certificates' },
    { id: 'acme', label: 'ACME + PQC', optional: true },
    { id: 'capacity', label: 'Cert Capacity', optional: true },
  ],
  // Round 9, wave 2 (2026-09-19): "Start here" — one real workshop step, written from that step's component.
  startHere: {
    step: 'csr',
    text: 'Pick a private key source and a CSR profile, fill in the subject attributes, then press Generate CSR: the console shows the OpenSSL run and the resulting PEM request.',
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.PKIWorkshop })),
}

export default manifest
