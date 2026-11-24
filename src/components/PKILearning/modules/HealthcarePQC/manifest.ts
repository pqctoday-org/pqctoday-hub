// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'
import { resolveManifest } from '@/components/PKILearning/manifest/resolve'

const manifest: ModuleManifest = {
  id: 'healthcare-pqc',
  whyThisMatters:
    "Patient biometric and genomic data doesn't expire — a compromised health record is compromised forever, making healthcare one of the starkest harvest-now-decrypt-later cases in any industry.",
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
  startHere: {
    step: 'patient-privacy-mapper',
    text: 'Map a data category in the Patient Privacy Mapper: pediatric, genomic and mental-health records use illustrative planning lifetimes to explore HNDL exposure.',
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.HealthcarePQCModule })),
}

export default resolveManifest(manifest)
