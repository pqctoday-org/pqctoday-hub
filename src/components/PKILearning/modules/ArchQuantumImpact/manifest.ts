// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'arch-quantum-impact',
  whyThisMatters:
    'Architecture decisions made today — KMS, HSM, PKI topology — outlive any single algorithm; get crypto-agility wrong now and every future PQC transition costs far more to retrofit.',
  learnSections: [
    { id: 'why-it-matters', label: 'Why It Matters' },
    { id: 'what-to-learn', label: 'Knowledge & Skills' },
    { id: 'how-to-act', label: 'How to Act' },
  ],
  workshopSteps: [
    { id: 'why-it-matters', label: 'Why It Matters' },
    { id: 'what-to-learn', label: 'What to Learn' },
    { id: 'how-to-act', label: 'How to Act' },
    { id: 'self-assessment', label: 'Architecture Readiness Self-Assessment' },
    { id: 'strangler-fig', label: 'Strangler Fig' },
    { id: 'trust-hardware', label: 'Trust Hardware Selector' },
  ],
  startHere: {
    step: 'strangler-fig',
    text: 'Model the Strangler Fig migration in step 5: a legacy monolith moves behind a PQC API gateway one route at a time.',
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.ArchQuantumImpactModule })),
}

export default manifest
