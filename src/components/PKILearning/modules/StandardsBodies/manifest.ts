// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'standards-bodies',
  lm_id: 'LM-004',
  title: 'Standards, Certification & Compliance Bodies',
  description:
    'Identify who creates PQC standards, who certifies products, and who mandates compliance — worldwide and by region.',
  duration: '40 min',
  difficulty: 'intermediate',
  frameworkPhase: 'foundations',
  track: 'Strategy',
  trackOrder: 0,
  learnSections: [
    { id: 'three-roles', label: 'Three Roles' },
    { id: 'gov-vs-nongov', label: 'Gov vs Non-Gov' },
    { id: 'global-regional', label: 'Global & Regional' },
    { id: 'app-pages-guide', label: 'App Pages Guide' },
    { id: 'ietf-process', label: 'IETF & RFC Process' },
  ],
  workshopSteps: [
    { id: 'body-classifier', label: 'Body Classifier' },
    { id: 'org-explorer', label: 'Org Explorer' },
    { id: 'chain-builder', label: 'Chain Builder' },
    { id: 'coverage-grid', label: 'Coverage Grid' },
    { id: 'scenario-challenge', label: 'Scenario Challenge' },
  ],
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.StandardsBodiesModule })),
}

export default manifest
