// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'exec-quantum-impact',
  contentVersion: 2,
  lm_id: 'LM-047',
  title: 'Executive Quantum Impact',
  description:
    'Why quantum matters to leadership: fiduciary risk, regulatory deadlines (CNSA 2.0, NIS2, DORA), and building a board-level PQC action plan.',
  whyThisMatters:
    "Quantum risk is a fiduciary and regulatory question before it's a technical one — boards that wait for a clean technical answer will miss the 2030/2035 deadlines regulators have already set.",
  duration: '30 min',
  difficulty: 'beginner',
  frameworkPhase: 'p0',
  track: 'Role Guides',
  trackOrder: 0,
  learnSections: [
    { id: 'why-it-matters', label: 'Why It Matters' },
    { id: 'what-to-learn', label: 'Knowledge & Skills' },
    { id: 'how-to-act', label: 'How to Act' },
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
