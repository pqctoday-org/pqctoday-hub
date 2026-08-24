// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'healthcare-pqc',
  contentVersion: 3,
  lm_id: 'LM-041',
  title: 'Healthcare PQC',
  description:
    'Healthcare-specific PQC challenges: biometric data permanence, pharmaceutical IP protection, patient privacy lifecycles, medical device safety, and hospital network migration.',
  whyThisMatters:
    "Patient biometric and genomic data doesn't expire — a compromised health record is compromised forever, making healthcare one of the starkest harvest-now-decrypt-later cases in any industry.",
  duration: '60 min',
  difficulty: 'intermediate',
  frameworkPhase: 'p5',
  track: 'Industries',
  trackOrder: 2,
  learnSections: [
    { id: 'biometric-threat', label: 'Biometric Data Permanence' },
    { id: 'pharma-ip', label: 'Pharma IP Protection' },
    { id: 'patient-privacy', label: 'Patient Privacy Rights' },
    { id: 'device-safety', label: 'Medical Device & PQC' },
    { id: 'healthcare-migration', label: 'Healthcare PQC Migration' },
  ],
  workshopSteps: [
    { id: 'biometric-vault', label: 'Biometric Vault Assessor' },
    { id: 'pharma-ip-calculator', label: 'Pharma IP Calculator' },
    { id: 'patient-privacy-mapper', label: 'Patient Privacy Mapper' },
    { id: 'device-safety-simulator', label: 'Device Safety Simulator' },
    { id: 'hospital-migration-planner', label: 'Hospital Migration Planner' },
  ],
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.HealthcarePQCModule })),
}

export default manifest
