// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'standards-bodies',
  whyThisMatters:
    'PQC has no single global standard — NIST, ETSI, and regional bodies move at different speeds with different mandates, and knowing who requires what, where, is what keeps a global rollout from missing a jurisdiction.',
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
  startHere: {
    step: 'chain-builder',
    text: 'Trace one of the four real scenarios from algorithm standard to certification programme to compliance mandate: three bodies, three different jobs, one chain.',
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.StandardsBodiesModule })),
}

export default manifest
