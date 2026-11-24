// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'
import { resolveManifest } from '@/components/PKILearning/manifest/resolve'

const manifest: ModuleManifest = {
  id: 'pqc-grc',
  whyThisMatters:
    'A Key Risk Indicator that never reaches the board is just a spreadsheet — cascading KRIs from operational to governance level is what turns a SOC finding into an organizational decision.',
  learnSections: [
    { id: 'cascade', label: 'GRC & KRI Cascade' },
    { id: 'appetite', label: 'Risk & Regulatory' },
    { id: 'handoff', label: 'GRC-SOC Handoff' },
    { id: 'assurance', label: 'Audit & Crisis Comms' },
    { id: 'resources', label: 'Resources & Workshop' },
  ],
  workshopSteps: [
    { id: 'kri-cascade', label: 'KRI Cascade' },
    { id: 'exception-triage', label: 'Exception Register' },
  ],
  startHere: {
    step: 'kri-cascade',
    text: 'Assign each Key Risk Indicator to the board, CISO or operational level in the KRI Cascade and set its status against the framework thresholds.',
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.PqcGrcModule })),
}

export default resolveManifest(manifest)
