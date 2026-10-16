// SPDX-License-Identifier: AGPL-3.0-only
import type { FC } from 'react'
import { Sigma, FlaskConical } from 'lucide-react'
import { Introduction } from './components/Introduction'
import { FheExercises } from './components/FheExercises'
import { FheHsmFlows } from './workshop/FheHsmFlows'
import { FheConceptsWorkshop } from './workshop/FheConceptsWorkshop'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'
import type { FheFlowId } from './data/fheHsmFlows'
import {
  LIFECYCLE_FLOW_ID,
  LIFECYCLE_STEP,
  type LifecycleView,
} from './workshop/fheRotationSharedData'

const PARTS: WorkshopPart[] = [
  {
    id: 'fhe-hsm-flows',
    title: 'Step 1: FHE + HSM Flows',
    description:
      'Step through eight scenarios: CKKS and TFHE single-HSM custody, OpenFHE and Lattigo threshold FHE, what fits in the HSM, Kreyvium transciphering, CKKS key rotation, and CKKS shared (2-of-2) decryption. Toggle the quantum overlay to see which links break.',
    icon: Sigma,
  },
  {
    id: 'fhe-concepts',
    title: 'Step 2: FHE concepts, hands-on',
    description:
      'Six interactive views: the noise budget and bootstrapping in CKKS and TFHE, encoding and rounding, turning a program into a data-oblivious FHE circuit, streaming the CKKS evaluation keys out of the token chunk by chunk, key rotation without decrypting stored data, and shared (2-of-2) decryption by two tokens, with measured numbers.',
    icon: FlaskConical,
  },
]

export const HomomorphicEncryptionModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    description="Fully homomorphic encryption, the ISO/IEC 28033 draft schemes, and how an HSM holds the FHE secret key: compute on encrypted data without trusting the hardware."
    learn={(api) => (
      <Introduction
        onNavigateToWorkshop={api.goToWorkshop}
        onOpenLifecycleView={(view, family) => {
          // switch to the Workshop tab, then land on the step and pass the view through
          const step = LIFECYCLE_STEP[family] // eslint-disable-line security/detect-object-injection
          api.goToWorkshop(step)
          api.openWorkshopStep(step, { family, view })
        }}
      />
    )}
    exercises={(api) => (
      <FheExercises
        onNavigateToWorkshop={api.goToWorkshop}
        onNavigateToLearn={() => api.goToTab('learn')}
      />
    )}
    workshopParts={PARTS}
    renderWorkshopStep={(index, configKey, config) => {
      const view = config?.view as LifecycleView | undefined
      switch (index) {
        case 0:
          return (
            <FheHsmFlows
              key={`fhe-hsm-${configKey}`}
              initialFlowId={
                view && config?.family === 'flows'
                  ? (LIFECYCLE_FLOW_ID[view] as FheFlowId) // eslint-disable-line security/detect-object-injection
                  : undefined
              }
            />
          )
        case 1:
          return (
            <FheConceptsWorkshop
              key={`fhe-concepts-${configKey}`}
              initialCard={view && config?.family === 'concepts' ? view : undefined}
            />
          )
        default:
          return null
      }
    }}
  />
)
