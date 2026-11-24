// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'
import { resolveManifest } from '@/components/PKILearning/manifest/resolve'

const manifest: ModuleManifest = {
  id: 'exec-quantum-impact',
  whyThisMatters:
    'Quantum risk is a governance question before it becomes an implementation programme: executives need to identify long-lived exposure, determine which scoped milestones apply, assign ownership and ask for measurable evidence.',
  learnSections: [
    { id: 'why-it-matters', label: 'Why It Matters' },
    { id: 'what-to-learn', label: 'Why Now' },
    { id: 'how-to-act', label: 'What This Module Covers' },
  ],
  workshopSteps: [
    { id: 'why-it-matters', label: 'Why It Matters' },
    { id: 'what-to-learn', label: 'What to Learn' },
    { id: 'how-to-act', label: 'How to Act' },
    { id: 'self-assessment', label: 'Organisational Evidence Scope' },
  ],
  // Round 9, wave 2 (2026-09-19): "Start here" — one real workshop step, written from that step's component.
  startHere: {
    step: 'self-assessment',
    text: 'Answer Yes, No, or Unknown in the Organisational Evidence Scope: nine questions identify applicable decision drivers and evidence requests without turning unanswered items into a low-risk score.',
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.ExecQuantumImpactModule })),
}

export default resolveManifest(manifest)
