// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect, type FC } from 'react'
import { Sigma, FlaskConical } from 'lucide-react'
import { Introduction } from './components/Introduction'
import { FheExercises } from './components/FheExercises'
import { FheHsmFlows } from './workshop/FheHsmFlows'
import { FheConceptsWorkshop } from './workshop/FheConceptsWorkshop'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'
import { canUseFheAdvancedPath, defaultFheLearnPath } from './learnPath'
import { usePersonaStore } from '@/store/usePersonaStore'
import { useModuleStore } from '@/store/useModuleStore'
import type { FheFlowId } from './data/fheHsmFlows'
import {
  LIFECYCLE_FLOW_ID,
  LIFECYCLE_STEP,
  type LifecycleView,
} from './workshop/fheRotationSharedData'

const PARTS: WorkshopPart[] = [
  {
    id: 'fhe-concepts',
    title: 'Step 1: FHE concepts lab',
    description:
      'Build the foundation first: compare noise behavior, encode and round values, and turn ordinary programs into data-oblivious FHE circuits. Advanced-path learners can also inspect streaming, rotation and shared decryption.',
    icon: FlaskConical,
  },
  {
    id: 'fhe-hsm-flows',
    title: 'Step 2: Advanced HSM custody lab',
    description:
      'Follow guided custody scenarios, see where every key and ciphertext resides, and inspect the exact limits of controlled and threshold decryption evidence.',
    icon: Sigma,
  },
]

export const HomomorphicEncryptionModule: FC = () => {
  const persona = usePersonaStore((state) => state.selectedPersona)
  const activePath = useModuleStore((state) => state.modules[manifest.id]?.activeLearnPath)
  const setActiveLearnPath = useModuleStore((state) => state.setActiveLearnPath)

  useEffect(() => {
    const advancedIsUnavailable = activePath === 'hsm-custody' && !canUseFheAdvancedPath(persona)
    if (!activePath || advancedIsUnavailable) {
      setActiveLearnPath(manifest.id, defaultFheLearnPath(persona))
    }
  }, [activePath, persona, setActiveLearnPath])

  return (
    <ModuleShell
      manifest={manifest}
      description="Understand fully homomorphic encryption before choosing the optional advanced path for HSM custody, controlled decryption and assurance evidence."
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
              <FheConceptsWorkshop
                key={`fhe-concepts-${configKey}`}
                initialCard={view && config?.family === 'concepts' ? view : undefined}
              />
            )
          case 1:
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
          default:
            return null
        }
      }}
    />
  )
}
