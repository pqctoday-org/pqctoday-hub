// SPDX-License-Identifier: AGPL-3.0-only
// OWNER: Scaffold
import type { FC } from 'react'
import { FileSearch, Scale } from 'lucide-react'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import { CertIntroduction } from '@/components/PKILearning/modules/CryptoProductCertification/components/CertIntroduction'
import { CertExercises } from '@/components/PKILearning/modules/CryptoProductCertification/components/CertExercises'
import { SECTION_COMPONENTS } from './components/sectionRegistry'
import { STEP_COMPONENTS } from './workshop/stepRegistry'
import { ALL_EXERCISES } from './data/allExercises'
import manifest from './manifest'

/**
 * One part per manifest workshop step, SAME ORDER (workshopStepsDrift.test.ts).
 * Path scope lives on the manifest; the shell hides off-path steps.
 */
const PARTS: WorkshopPart[] = [
  {
    id: 'cc-claim-decoder',
    title: 'Decode the certificate claim',
    description:
      'Decode a Common Criteria claim: the EAL, each named augmentation, and what the claim does and does not cover.',
    icon: FileSearch,
  },
  {
    id: 'eidas-trace',
    title: 'Regulation-to-certificate trace',
    description:
      'Distinguish eIDAS obligations from the selected EUCC evidence route and Protection Profile in each scenario.',
    icon: Scale,
  },
]

const stepIndex = (stepId: string): number =>
  (manifest.workshopSteps ?? []).findIndex((s) => s.id === stepId)

export const CcEuccCertificationModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    description="Common Criteria, EUCC and eIDAS in depth, with distinct roles: CC supplies evaluation criteria; EUCC is an EU scheme using CC; eIDAS supplies separate legal requirements for applicable trust services and devices. Choose the CC, EUCC or eIDAS path below."
    learn={(api) => (
      <CertIntroduction
        manifest={manifest}
        sections={SECTION_COMPONENTS}
        onNavigateToWorkshop={() => api.goToWorkshop()}
      />
    )}
    exercises={(api) => (
      <CertExercises
        exercises={ALL_EXERCISES}
        hasPaths={Boolean(manifest.learnPaths?.length)}
        onOpenStep={(stepId, config) => {
          const index = stepIndex(stepId)
          if (index >= 0) api.openWorkshopStep(index, config)
        }}
      />
    )}
    workshopParts={PARTS}
    renderWorkshopStep={(index, configKey, config) => {
      const id = PARTS.at(index)?.id
      const Step = id ? STEP_COMPONENTS.get(id) : undefined
      return Step ? <Step key={`${id}-${configKey}`} config={config} /> : null
    }}
  />
)
