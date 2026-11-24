// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'
import { resolveManifest } from '@/components/PKILearning/manifest/resolve'

const manifest: ModuleManifest = {
  id: 'dev-quantum-impact',
  whyThisMatters:
    "Your code doesn't call 'RSA' — it calls a library, and libraries are what quietly change under you when the underlying algorithm gets swapped. Knowing what breaks (key sizes, signature sizes, TLS handshakes) is the difference between a migration and an outage.",
  learnSections: [
    { id: 'why-it-matters', label: 'Why It Matters' },
    { id: 'what-to-learn', label: 'Knowledge & Skills' },
    { id: 'how-to-act', label: 'How to Act' },
  ],
  workshopSteps: [
    { id: 'why-it-matters', label: 'Why It Matters' },
    { id: 'what-to-learn', label: 'What to Learn' },
    { id: 'how-to-act', label: 'How to Act' },
    { id: 'self-assessment', label: 'Skill Self-Assessment' },
  ],
  startHere: {
    step: 'self-assessment',
    text: 'Score yourself on the nine developer competencies in the Skill Self-Assessment: the result says which of the three earlier steps to go back to first.',
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.DevQuantumImpactModule })),
}

export default resolveManifest(manifest)
