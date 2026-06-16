// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'soc-implementation-pqc',
  lm_id: 'LM-057',
  title: 'SOC Implementation for PQC',
  description:
    'Operationalize PQC defense in the SOC: five detection use cases (hybrid downgrade, crypto drift, certificate-lifecycle anomalies, signature integrity, HNDL indicators), the posture registry they depend on, detection-engineering and CTI skills, and a phased SOC implementation plan with four quantum playbooks.',
  duration: '60 min',
  difficulty: 'advanced',
  frameworkPhase: 'p6',
  track: 'Executive',
  trackOrder: 10,
  learnSections: [
    { id: 'why-it-matters', label: 'Five PQC Detection Use Cases & the Posture Registry' },
    { id: 'what-to-learn', label: 'Detection, CTI & Incident-Response Skills' },
    { id: 'how-to-act', label: 'Phased SOC Implementation & Quantum Playbooks' },
  ],
  workshopSteps: [
    { id: 'why-it-matters', label: 'Why It Matters' },
    { id: 'what-to-learn', label: 'What to Learn' },
    { id: 'how-to-act', label: 'How to Act' },
    { id: 'detection-planner', label: 'Detection Planner' },
    { id: 'self-assessment', label: 'SOC Readiness' },
  ],
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.SocImplementationPqcModule })),
}

export default manifest
