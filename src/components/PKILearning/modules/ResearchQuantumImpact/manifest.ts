// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'research-quantum-impact',
  contentVersion: 2,
  lm_id: 'LM-051',
  title: 'Researcher Quantum Impact',
  description:
    'Quantum threats to research: long-lived data confidentiality, publication integrity, emerging PQC research frontiers, and funding opportunities.',
  whyThisMatters:
    'A paper published today with weak crypto protecting its underlying data can be compromised decades before its confidentiality requirement expires — research data often has the longest harvest-now-decrypt-later exposure window of any sector.',
  duration: '20 min',
  difficulty: 'beginner',
  frameworkPhase: 'foundations',
  track: 'Role Guides',
  trackOrder: 4,
  learnSections: [
    { id: 'why-it-matters', label: 'Why It Matters' },
    { id: 'what-to-learn', label: 'Knowledge & Skills' },
    { id: 'how-to-act', label: 'How to Act' },
  ],
  workshopSteps: [
    { id: 'why-it-matters', label: 'Why It Matters' },
    { id: 'what-to-learn', label: 'What to Learn' },
    { id: 'how-to-act', label: 'How to Act' },
    { id: 'self-assessment', label: 'Research Readiness Self-Assessment' },
  ],
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.ResearchQuantumImpactModule })),
}

export default manifest
