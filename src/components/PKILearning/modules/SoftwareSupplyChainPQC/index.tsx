// SPDX-License-Identifier: AGPL-3.0-only
import type { FC } from 'react'
import { Users, FileSearch, Scale } from 'lucide-react'
import { SoftwareSupplyChainIntroduction } from './components/SoftwareSupplyChainIntroduction'
import { SoftwareSupplyChainExercises } from './components/SoftwareSupplyChainExercises'
import { RolesAndThresholds } from './workshop/RolesAndThresholds'
import { ProvenanceChainCheck } from './workshop/ProvenanceChainCheck'
import { TransitionPlanner } from './workshop/TransitionPlanner'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'

const PARTS: WorkshopPart[] = [
  {
    id: 'roles-and-thresholds',
    title: 'Step 1: Roles and Thresholds',
    description:
      'Set the number of keys and the threshold for each update role (TUF) or choose which Uptane repository an attacker controls, and see which roles the attacker can sign for, with the specification sentence behind each line.',
    icon: Users,
  },
  {
    id: 'provenance-chain-check',
    title: 'Step 2: Provenance Chain Check',
    description:
      'Trace one artifact from build to verification: pick the signature algorithm and the encoding, see which documents specify that pair, and mark the verification checks the SLSA page lists.',
    icon: FileSearch,
  },
  {
    id: 'transition-planner',
    title: 'Step 3: Transition Planner',
    description:
      'Choose a verifier that can or cannot change, a transition option and an algorithm, and see the raw public key and signature sizes from the algorithm registry next to the source line for each option.',
    icon: Scale,
  },
]

export const SoftwareSupplyChainPQCModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    description="The signature links of a software supply chain read from their documents: a status map, the TUF and Uptane update frameworks, SLSA and in-toto provenance, and changing an algorithm after a verifier has shipped."
    learn={(api) => <SoftwareSupplyChainIntroduction onNavigateToWorkshop={api.goToWorkshop} />}
    exercises={(api) => (
      <SoftwareSupplyChainExercises
        onNavigateToWorkshop={api.goToWorkshop}
        onSetWorkshopConfig={(config) => api.openWorkshopStep(config.step, { ...config })}
      />
    )}
    workshopParts={PARTS}
    renderWorkshopStep={(index, configKey) => {
      switch (index) {
        case 0:
          return <RolesAndThresholds key={`roles-${configKey}`} />
        case 1:
          return <ProvenanceChainCheck key={`prov-${configKey}`} />
        case 2:
          return <TransitionPlanner key={`plan-${configKey}`} />
        default:
          return null
      }
    }}
  />
)
