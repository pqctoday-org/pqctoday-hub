// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'cert-quantum-impact',
  whyThisMatters:
    'Post-quantum migration is a validation-engineering bottleneck before it is a deployment milestone: certification engineers must separate algorithm testing from module validation, plan around CMVP/ESV queue lead times, and verify scheme-specific evidence across FIPS 140-3, EUCC, NIAP, and PCI.',
  learnSections: [
    { id: 'why-it-matters', label: 'Why It Matters' },
    { id: 'what-to-learn', label: 'Why Now' },
    { id: 'how-to-act', label: 'What This Module Covers' },
  ],
  workshopSteps: [
    { id: 'why-it-matters', label: 'Why It Matters' },
    { id: 'what-to-learn', label: 'What to Learn' },
    { id: 'how-to-act', label: 'How to Act' },
    { id: 'self-assessment', label: 'Certification Evidence Scope' },
  ],
  startHere: {
    step: 'self-assessment',
    text: 'Answer Yes, No, or Unknown in the Certification Evidence Scope: nine questions identify applicable validation drivers and evidence gaps without turning unanswered items into a low-exposure score.',
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.CertQuantumImpactModule })),
}

export default manifest
