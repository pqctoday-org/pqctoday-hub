// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'standards-bodies',
  contentVersion: 8,
  lm_id: 'LM-004',
  title: 'Standards, Certification & Compliance Bodies',
  description:
    'Identify who creates PQC standards, who certifies products, and who mandates compliance — worldwide and by region.',
  whyThisMatters:
    'PQC has no single global standard — NIST, ETSI, and regional bodies move at different speeds with different mandates, and knowing who requires what, where, is what keeps a global rollout from missing a jurisdiction.',
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
  startHere: {
    step: 'chain-builder',
    text: 'Trace one of the four real scenarios from algorithm standard to certification programme to compliance mandate: three bodies, three different jobs, one chain.',
  },
  // Wave B (2026-09-18): derived from the algorithm and standard ids this
  // module's content.ts declares (the References tab's own data), restricted to
  // the STANDARD_TAXONOMY vocabulary so the researcher browse axis and the
  // related-modules engine see it. Re-derive from content.ts; do not hand-tune.
  taxonomy: {
    algorithms: ['ML-DSA', 'ML-KEM'],
    standards: ['ETSI TS 103 744', 'NIST SP 800-227', 'NSA CNSA 2.0', 'NIST IR 8547'],
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.StandardsBodiesModule })),
}

export default manifest
