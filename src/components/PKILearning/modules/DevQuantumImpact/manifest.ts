// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'dev-quantum-impact',
  lm_id: 'LM-048',
  title: 'Developer Quantum Impact',
  description:
    'How quantum breaks your code: library transitions, larger keys/signatures, TLS/JWT/signing impacts, and a hands-on migration readiness plan.',
  duration: '20 min',
  difficulty: 'beginner',
  frameworkPhase: 'foundations',
  track: 'Role Guides',
  trackOrder: 1,
  learnSections: [
    { id: 'why-it-matters', label: 'Why It Matters: Developer Quantum Exposure' },
    { id: 'what-to-learn', label: 'What to Learn: Knowledge & Skills Gap' },
    { id: 'how-to-act', label: 'How to Act: Phased Action Plan' },
  ],
  workshopSteps: [
    { id: 'why-it-matters', label: 'Why It Matters' },
    { id: 'what-to-learn', label: 'What to Learn' },
    { id: 'how-to-act', label: 'How to Act' },
    { id: 'self-assessment', label: 'Skill Self-Assessment' },
  ],
  load: () => import('./index').then((m) => ({ default: m.DevQuantumImpactModule })),
}

export default manifest
