// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'ops-quantum-impact',
  lm_id: 'LM-050',
  title: 'Ops Quantum Impact',
  description:
    'Operational PQC challenges: certificate scaling, fleet upgrades, VPN/SSH key exchange, monitoring recalibration, and migration playbooks.',
  duration: '20 min',
  difficulty: 'beginner',
  frameworkPhase: 'foundations',
  track: 'Role Guides',
  trackOrder: 3,
  learnSections: [
    { id: 'why-it-matters', label: 'Why It Matters: Ops Quantum Exposure' },
    { id: 'what-to-learn', label: 'What to Learn: Knowledge & Skills Gap' },
    { id: 'how-to-act', label: 'How to Act: Phased Action Plan' },
  ],
  workshopSteps: [
    { id: 'why-it-matters', label: 'Why It Matters' },
    { id: 'what-to-learn', label: 'What to Learn' },
    { id: 'how-to-act', label: 'How to Act' },
    { id: 'self-assessment', label: 'Ops Readiness Self-Assessment' },
  ],
  load: () => import('./index').then((m) => ({ default: m.OpsQuantumImpactModule })),
}

export default manifest
