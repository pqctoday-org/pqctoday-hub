// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'pqc-grc',
  lm_id: 'LM-058',
  title: 'PQC GRC',
  description:
    'Wire post-quantum risk into governance, risk, and compliance: cascade Key Risk Indicators from board to operational level, triage a deferral exception register into SOC suppression, and hand off cleanly between GRC and the SOC.',
  duration: '30 min',
  difficulty: 'intermediate',
  frameworkPhase: 'foundations',
  track: 'Executive',
  trackOrder: 9,
  learnSections: [
    { id: 'kri-cascade', label: 'KRI Cascade: Board, CISO & Operational Thresholds' },
    { id: 'exception-triage', label: 'Exception Register Triage & GRC-SOC Handoff' },
  ],
  workshopSteps: [
    { id: 'kri-cascade', label: 'KRI Cascade' },
    { id: 'exception-triage', label: 'Exception Register' },
  ],
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.PqcGrcModule })),
}

export default manifest
