// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'exec-quantum-impact',
  lm_id: 'LM-047',
  title: 'Executive Quantum Impact',
  description:
    'Why quantum matters to leadership: fiduciary risk, regulatory deadlines (CNSA 2.0, NIS2, DORA), and building a board-level PQC action plan.',
  duration: '30 min',
  difficulty: 'beginner',
  frameworkPhase: 'p0',
  track: 'Role Guides',
  trackOrder: 0,
  learnSections: [
    { id: 'why-it-matters', label: 'Why It Matters: Executive Quantum Exposure' },
    { id: 'what-to-learn', label: 'What to Learn: Knowledge & Skills Gap' },
    { id: 'how-to-act', label: 'How to Act: Phased Action Plan' },
  ],
  workshopSteps: [
    { id: 'why-it-matters', label: 'Why It Matters' },
    { id: 'what-to-learn', label: 'What to Learn' },
    { id: 'how-to-act', label: 'How to Act' },
    { id: 'self-assessment', label: 'Org Risk Self-Assessment' },
  ],
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.ExecQuantumImpactModule })),
}

export default manifest
