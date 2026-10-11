// SPDX-License-Identifier: GPL-3.0-only
import type { FC } from 'react'
import { Sigma, FlaskConical } from 'lucide-react'
import { Introduction } from './components/Introduction'
import { FheExercises } from './components/FheExercises'
import { FheHsmFlows } from './workshop/FheHsmFlows'
import { FheConceptsWorkshop } from './workshop/FheConceptsWorkshop'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'

const PARTS: WorkshopPart[] = [
  {
    id: 'fhe-hsm-flows',
    title: 'Step 1: FHE + HSM Flows',
    description:
      'Step through six scenarios: CKKS and TFHE single-HSM custody, OpenFHE and Lattigo threshold FHE, what fits in the HSM, and Kreyvium transciphering. Toggle the quantum overlay to see which links break.',
    icon: Sigma,
  },
  {
    id: 'fhe-concepts',
    title: 'Step 2: FHE concepts, hands-on',
    description:
      'Four interactive views: the noise budget and bootstrapping in CKKS and TFHE, encoding and rounding, turning a program into a data-oblivious FHE circuit, and streaming the CKKS evaluation keys out of the token chunk by chunk, with measured times.',
    icon: FlaskConical,
  },
]

export const HomomorphicEncryptionModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    description="Fully homomorphic encryption, the ISO/IEC 28033 draft schemes, and how an HSM holds the FHE secret key: compute on encrypted data without trusting the hardware."
    learn={(api) => <Introduction onNavigateToWorkshop={api.goToWorkshop} />}
    exercises={(api) => (
      <FheExercises
        onNavigateToWorkshop={api.goToWorkshop}
        onNavigateToLearn={() => api.goToTab('learn')}
      />
    )}
    workshopParts={PARTS}
    renderWorkshopStep={(index, configKey) => {
      switch (index) {
        case 0:
          return <FheHsmFlows key={`fhe-hsm-${configKey}`} />
        case 1:
          return <FheConceptsWorkshop key={`fhe-concepts-${configKey}`} />
        default:
          return null
      }
    }}
  />
)
