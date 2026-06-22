// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'merkle-tree-certs',
  lm_id: 'LM-025',
  title: 'Merkle Tree Certificates',
  description:
    'Build Merkle trees interactively, generate inclusion proofs, and compare MTC vs traditional PKI for post-quantum TLS.',
  duration: '40 min',
  difficulty: 'advanced',
  frameworkPhase: 'p6',
  track: 'Software Infrastructure',
  trackOrder: 4,
  learnSections: [
    { id: 'merkle', label: 'Merkle Tree Construction & SHA-256' },
    { id: 'inclusion', label: 'Inclusion Proofs & Authentication Paths' },
    { id: 'verification', label: 'Proof Verification Algorithm' },
    { id: 'comparison', label: 'MTC vs X.509: Size & Performance Trade-offs' },
    { id: 'ct-log', label: 'Certificate Transparency Log (ML-DSA-44 via SoftHSMv3)' },
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
