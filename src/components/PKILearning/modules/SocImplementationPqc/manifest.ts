// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'soc-implementation-pqc',
  whyThisMatters:
    "Detection engineering hasn't caught up to PQC yet — a SOC that can't detect hybrid downgrade or crypto drift will miss a PQC-relevant incident even with a perfect migration on paper.",
  learnSections: [
    { id: 'why-it-matters', label: 'Why It Matters' },
    { id: 'what-to-learn', label: 'Detection & CTI Skills' },
    { id: 'how-to-act', label: 'How to Act' },
  ],
  workshopSteps: [
    { id: 'why-it-matters', label: 'Why It Matters' },
    { id: 'what-to-learn', label: 'What to Learn' },
    { id: 'how-to-act', label: 'How to Act' },
    { id: 'detection-planner', label: 'Detection Planner' },
    { id: 'self-assessment', label: 'SOC Readiness' },
  ],
  startHere: {
    step: 'detection-planner',
    text: 'Set each of the five detection use cases to not-started, building or operational in the Detection Planner and watch the SOC coverage score move.',
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.SocImplementationPqcModule })),
}

export default manifest
