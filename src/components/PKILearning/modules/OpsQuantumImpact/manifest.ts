// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'ops-quantum-impact',
  contentVersion: 3,
  lm_id: 'LM-050',
  title: 'Ops Quantum Impact',
  description:
    'Operational PQC challenges: certificate scaling, fleet upgrades, VPN/SSH key exchange, monitoring recalibration, and migration playbooks.',
  whyThisMatters:
    'Certificate scaling and fleet upgrades are operational problems, not cryptographic ones — the algorithm choice is a one-time decision, but the rollout across thousands of endpoints is where PQC migrations actually succeed or fail.',
  duration: '20 min',
  difficulty: 'beginner',
  frameworkPhase: 'foundations',
  track: 'Role Guides',
  trackOrder: 3,
  learnSections: [
    { id: 'why-it-matters', label: 'Why It Matters' },
    { id: 'what-to-learn', label: 'Knowledge & Skills' },
    { id: 'how-to-act', label: 'How to Act' },
  ],
  workshopSteps: [
    { id: 'why-it-matters', label: 'Why It Matters' },
    { id: 'what-to-learn', label: 'What to Learn' },
    { id: 'how-to-act', label: 'How to Act' },
    { id: 'self-assessment', label: 'Ops Readiness Self-Assessment' },
  ],
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.OpsQuantumImpactModule })),
}

export default manifest
