// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'merkle-tree-certs',
  contentVersion: 2,
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
  // learnSections CORRECTED 2026-07-30. The previous ids (merkle, inclusion,
  // verification, comparison, ct-log) mirrored this module's workshopSteps
  // (build-tree, inclusion-proof, verify-proof, size-comparison, ct-log —
  // note ct-log appeared in both) and named nothing on the learn tab, so the
  // table of contents advertised workshop steps as reading sections. These
  // describe the page.
  learnSections: [
    { id: 'cert-bloat', label: 'The Certificate Bloat Problem' },
    { id: 'how-mtc-works', label: 'How Merkle Tree Certificates Work' },
    { id: 'mtc-architecture', label: 'MTC Architecture' },
    { id: 'cert-types', label: 'Certificate Types & Tradeoffs' },
    { id: 'landmark-certs', label: 'Deep Dive: Landmark Certificates' },
    { id: 'ietf-status', label: 'IETF Standardization Status' },
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
