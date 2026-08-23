// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'pqc-grc',
  contentVersion: 2,
  lm_id: 'LM-058',
  title: 'PQC GRC',
  description:
    'Wire post-quantum risk into governance, risk, and compliance: cascade Key Risk Indicators from board to operational level, triage a deferral exception register into SOC suppression, and hand off cleanly between GRC and the SOC.',
  whyThisMatters:
    'A Key Risk Indicator that never reaches the board is just a spreadsheet — cascading KRIs from operational to governance level is what turns a SOC finding into an organizational decision.',
  duration: '30 min',
  difficulty: 'intermediate',
  frameworkPhase: 'foundations',
  track: 'Executive',
  trackOrder: 8,
  learnSections: [
    { id: 'kri-cascade', label: 'KRI Cascade Thresholds' },
    { id: 'exception-triage', label: 'GRC-SOC Exception Triage' },
  ],
  workshopSteps: [
    { id: 'kri-cascade', label: 'KRI Cascade' },
    { id: 'exception-triage', label: 'Exception Register' },
  ],
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.PqcGrcModule })),
}

export default manifest
