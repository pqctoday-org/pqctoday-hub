// SPDX-License-Identifier: GPL-3.0-only
import type { FC } from 'react'
import { Fingerprint, FlaskConical, HeartPulse, Activity, Building2 } from 'lucide-react'
import { HealthcarePQCIntroduction } from './components/HealthcarePQCIntroduction'
import { HealthcarePQCExercises } from './components/HealthcarePQCExercises'
import { BiometricVaultAssessor } from './workshop/BiometricVaultAssessor'
import { PharmaIPCalculator } from './workshop/PharmaIPCalculator'
import { PatientPrivacyMapper } from './workshop/PatientPrivacyMapper'
import { DeviceSafetySimulator } from './workshop/DeviceSafetySimulator'
import { HospitalMigrationPlanner } from './workshop/HospitalMigrationPlanner'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'

const PARTS: WorkshopPart[] = [
  {
    id: 'biometric-vault',
    title: 'Step 1: Biometric Vault Assessor',
    description:
      'Assess the quantum risk of biometric data stores — fingerprints, iris scans, DNA profiles — that are permanently compromised once decrypted.',
    icon: Fingerprint,
  },
  {
    id: 'pharma-ip-calculator',
    title: 'Step 2: Pharma IP Calculator',
    description:
      'Model the Harvest Now, Decrypt Later financial exposure for pharmaceutical intellectual property worth billions in R&D.',
    icon: FlaskConical,
  },
  {
    id: 'patient-privacy-mapper',
    title: 'Step 3: Patient Privacy Mapper',
    description:
      'Map healthcare data categories to their true lifecycle duration and calculate HNDL windows for pediatric, genomic, and mental health records.',
    icon: HeartPulse,
  },
  {
    id: 'device-safety-simulator',
    title: 'Step 4: Device Safety Simulator',
    description:
      'Simulate quantum attack scenarios on medical devices where cryptographic failure equals patient harm or death.',
    icon: Activity,
  },
  {
    id: 'hospital-migration-planner',
    title: 'Step 5: Hospital Migration Planner',
    description:
      'Build a phased PQC migration plan for a complete hospital network with compliance milestones and budget estimates.',
    icon: Building2,
  },
]

export const HealthcarePQCModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    description="Biometric data permanence, pharmaceutical IP protection, patient privacy lifecycles, medical device safety, and hospital network migration."
    learn={(api) => <HealthcarePQCIntroduction onNavigateToWorkshop={api.goToWorkshop} />}
    exercises={(api) => (
      <HealthcarePQCExercises
        onNavigateToWorkshop={api.goToWorkshop}
        onSetWorkshopConfig={(config) => api.openWorkshopStep(config.step, { ...config })}
      />
    )}
    workshopParts={PARTS}
    renderWorkshopStep={(index, configKey) => {
      switch (index) {
        case 0:
          return <BiometricVaultAssessor key={`biometric-${configKey}`} />
        case 1:
          return <PharmaIPCalculator key={`pharma-${configKey}`} />
        case 2:
          return <PatientPrivacyMapper key={`privacy-${configKey}`} />
        case 3:
          return <DeviceSafetySimulator key={`device-${configKey}`} />
        case 4:
          return <HospitalMigrationPlanner key={`migration-${configKey}`} />
        default:
          return null
      }
    }}
  />
)
