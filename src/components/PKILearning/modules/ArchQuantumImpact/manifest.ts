// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'arch-quantum-impact',
  contentVersion: 4,
  lm_id: 'LM-049',
  title: 'Architect Quantum Impact',
  description:
    'Architecture decisions that outlast the quantum transition: KMS, HSM, PKI, hybrid deployment patterns, and crypto-agile design.',
  whyThisMatters:
    'Architecture decisions made today — KMS, HSM, PKI topology — outlive any single algorithm; get crypto-agility wrong now and every future PQC transition costs far more to retrofit.',
  duration: '20 min',
  difficulty: 'beginner',
  frameworkPhase: 'foundations',
  track: 'Role Guides',
  trackOrder: 2,
  learnSections: [
    { id: 'why-it-matters', label: 'Why It Matters' },
    { id: 'what-to-learn', label: 'Knowledge & Skills' },
    { id: 'how-to-act', label: 'How to Act' },
  ],
  workshopSteps: [
    { id: 'why-it-matters', label: 'Why It Matters' },
    { id: 'what-to-learn', label: 'What to Learn' },
    { id: 'how-to-act', label: 'How to Act' },
    { id: 'self-assessment', label: 'Architecture Readiness Self-Assessment' },
  ],
  // Wave B (2026-09-18): derived from the algorithm and standard ids this
  // module's content.ts declares (the References tab's own data), restricted to
  // the STANDARD_TAXONOMY vocabulary so the researcher browse axis and the
  // related-modules engine see it. Re-derive from content.ts; do not hand-tune.
  taxonomy: {
    algorithms: ['Falcon', 'ML-DSA', 'ML-KEM', 'SLH-DSA'],
    standards: ['NIST SP 800-208', 'NIST SP 800-227', 'NSA CNSA 2.0', 'NIST IR 8547'],
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.ArchQuantumImpactModule })),
}

export default manifest
