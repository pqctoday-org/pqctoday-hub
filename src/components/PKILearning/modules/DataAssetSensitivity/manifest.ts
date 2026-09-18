// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'data-asset-sensitivity',
  contentVersion: 2,
  lm_id: 'LM-005',
  title: 'Data & Asset Sensitivity',
  description:
    'Classify organizational data assets, map compliance obligations (GDPR, HIPAA, DORA, NIS2), apply NIST RMF/ISO 27005/FAIR risk methodologies, and generate a PQC migration priority map.',
  whyThisMatters:
    "Not every dataset needs to move to PQC on the same timeline — data with a 20-year confidentiality requirement is already vulnerable to harvest-now-decrypt-later, data that expires next year isn't. Classifying by sensitivity turns 'migrate everything' into an actual prioritized plan.",
  duration: '50 min',
  difficulty: 'intermediate',
  frameworkPhase: ['p1', 'p3'],
  track: 'Strategy',
  trackOrder: 1,
  learnSections: [
    { id: 'classification', label: 'Data Asset Classification' },
    { id: 'compliance', label: 'Compliance Mapping' },
    { id: 'methodology', label: 'Risk Methodology' },
  ],
  workshopSteps: [
    { id: 'asset-inventory', label: 'Asset Inventory' },
    { id: 'compliance-matrix', label: 'Compliance Matrix' },
    { id: 'risk-methodology', label: 'Risk Methodology' },
    { id: 'sensitivity-scoring', label: 'Sensitivity Scoring' },
    { id: 'priority-map', label: 'Priority Map' },
  ],
  // Wave B (2026-09-18): derived from the algorithm and standard ids this
  // module's content.ts declares (the References tab's own data), restricted to
  // the STANDARD_TAXONOMY vocabulary so the researcher browse axis and the
  // related-modules engine see it. Re-derive from content.ts; do not hand-tune.
  taxonomy: {
    algorithms: ['ML-DSA', 'ML-KEM'],
    standards: ['NIST SP 800-53', 'NIST SP 800-57', 'NSM-10', 'FIPS 140-3', 'NIST IR 8547'],
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.DataAssetSensitivityModule })),
}

export default manifest
