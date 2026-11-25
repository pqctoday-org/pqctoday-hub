// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'ops-quantum-impact',
  whyThisMatters:
    'Certificate scaling and fleet upgrades are operational problems, not cryptographic ones — choose the algorithms per migration wave, and plan to revisit them: parameter sets, provider support and cryptanalysis change. The rollout across thousands of endpoints is where PQC migrations actually succeed or fail.',
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
  startHere: {
    step: 'how-to-act',
    text: 'Build the operational action plan in How to Act: from infrastructure inventory to a pilot migration, with certificate, VPN/SSH and pipeline work in order.',
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.OpsQuantumImpactModule })),
}

export default manifest
