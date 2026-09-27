// SPDX-License-Identifier: GPL-3.0-only
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
      'Trace an eIDAS requirement through EUCC and a Protection Profile to a certified device.',
    icon: Scale,
  },
]

const stepIndex = (stepId: string): number =>
  (manifest.workshopSteps ?? []).findIndex((s) => s.id === stepId)

export const CcEuccCertificationModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    description="Common Criteria, EUCC and eIDAS in depth: the evaluation model, EAL claims, Protection Profiles, and how a PQC change travels from regulation to a certified device. Start with LM-065 for the fundamentals the schemes share."
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
