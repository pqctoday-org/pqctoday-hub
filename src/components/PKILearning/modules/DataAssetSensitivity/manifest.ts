// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'data-asset-sensitivity',
  lm_id: 'LM-005',
  title: 'Data & Asset Sensitivity',
  description:
    'Classify organizational data assets, map compliance obligations (GDPR, HIPAA, DORA, NIS2), apply NIST RMF/ISO 27005/FAIR risk methodologies, and generate a PQC migration priority map.',
  duration: '50 min',
  difficulty: 'intermediate',
  frameworkPhase: ['p1', 'p3'],
  track: 'Strategy',
  trackOrder: 1,
  learnSections: [
    { id: 'classification', label: 'Data Asset Classification' },
    { id: 'compliance', label: 'Compliance Mapping (GDPR, HIPAA, DORA, NIS2)' },
    { id: 'methodology', label: 'Risk Methodology (NIST RMF, ISO 27005, FAIR)' },
  ],
  workshopSteps: [
    { id: 'asset-inventory', label: 'Asset Inventory' },
    { id: 'compliance-matrix', label: 'Compliance Matrix' },
    { id: 'risk-methodology', label: 'Risk Methodology' },
    { id: 'sensitivity-scoring', label: 'Sensitivity Scoring' },
    { id: 'priority-map', label: 'Priority Map' },
  ],
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.DataAssetSensitivityModule })),
}

export default manifest
