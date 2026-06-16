// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'healthcare-pqc',
  lm_id: 'LM-041',
  title: 'Healthcare PQC',
  description:
    'Healthcare-specific PQC challenges: biometric data permanence, pharmaceutical IP protection, patient privacy lifecycles, medical device safety, and hospital network migration.',
  duration: '60 min',
  difficulty: 'intermediate',
  frameworkPhase: 'p5',
  track: 'Industries',
  trackOrder: 2,
  learnSections: [
    { id: 'biometric-threat', label: 'Biometric Data: The Irreplaceable Secret' },
    { id: 'pharma-ip', label: 'Pharmaceutical IP & Research Data Protection' },
    { id: 'patient-privacy', label: 'Patient Privacy as a Fundamental Right' },
    { id: 'device-safety', label: 'Medical Device Safety & PQC' },
    { id: 'healthcare-migration', label: 'Healthcare PQC Migration: A Sector-Wide Challenge' },
  ],
  workshopSteps: [
    { id: 'biometric-vault', label: 'Biometric Vault Assessor' },
    { id: 'pharma-ip-calculator', label: 'Pharma IP Calculator' },
    { id: 'patient-privacy-mapper', label: 'Patient Privacy Mapper' },
    { id: 'device-safety-simulator', label: 'Device Safety Simulator' },
    { id: 'hospital-migration-planner', label: 'Hospital Migration Planner' },
  ],
  load: () => import('./index').then((m) => ({ default: m.HealthcarePQCModule })),
}

export default manifest
