// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'merkle-tree-certs',
  lm_id: 'LM-025',
  title: 'Merkle Tree Certificates',
  description:
    'Build Merkle trees interactively, generate inclusion proofs, and compare MTC vs traditional PKI for post-quantum TLS.',
  whyThisMatters:
    "Merkle Tree Certificates could replace X.509's per-certificate PQC signature overhead with one tree and many inclusion proofs — the trade-off against traditional PKI shapes which TLS ecosystem wins post-quantum.",
  duration: '40 min',
  difficulty: 'advanced',
  frameworkPhase: 'p6',
  track: 'Software Infrastructure',
  trackOrder: 4,
  learnSections: [
    { id: 'merkle', label: 'Merkle Tree & SHA-256' },
    { id: 'inclusion', label: 'Inclusion & Auth Paths' },
    { id: 'verification', label: 'Proof Verification' },
    { id: 'comparison', label: 'MTC vs X.509 Trade-offs' },
    { id: 'ct-log', label: 'CT Log ML-DSA-44' },
  ],
  workshopSteps: [
    { id: 'build-tree', label: 'Build Tree' },
    { id: 'inclusion-proof', label: 'Inclusion Proof' },
    { id: 'verify-proof', label: 'Verify Proof' },
    { id: 'size-comparison', label: 'Size Comparison' },
    { id: 'ct-log', label: 'CT Log Simulator' },
  ],
  playgroundTool: 'merkle-proof',
  taxonomy: { algorithms: ['LMS/XMSS'], standards: ['NIST SP 800-208'] },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.MerkleTreeCertsModule })),
}

export default manifest
