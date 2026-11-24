// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'
import { resolveManifest } from '@/components/PKILearning/manifest/resolve'

const manifest: ModuleManifest = {
  id: 'research-quantum-impact',
  whyThisMatters:
    'A paper published today with weak crypto protecting its underlying data can be compromised decades before its confidentiality requirement expires — research data is among the longest harvest-now-decrypt-later exposures, for example participant-linked genomic data that stays sensitive for the participant\u2019s lifetime and affects relatives.',
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
  startHere: {
    step: 'self-assessment',
    text: 'Score your exposure on the nine research-specific criteria in Research Readiness: data risk, publishing and institutional infrastructure ranked for action.',
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.ResearchQuantumImpactModule })),
}

export default resolveManifest(manifest)
