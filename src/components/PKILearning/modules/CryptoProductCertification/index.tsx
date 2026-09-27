// SPDX-License-Identifier: GPL-3.0-only
// OWNER: Scaffold
import type { FC } from 'react'
import { ArrowRightLeft, Frame, GitCompareArrows, Globe, ListChecks } from 'lucide-react'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import { CertIntroduction } from './components/CertIntroduction'
import { CertExercises } from './components/CertExercises'
import { STEP_COMPONENTS } from './workshop/stepRegistry'
import { SECTION_COMPONENTS } from './components/sectionRegistry'
import { ALL_EXERCISES } from './data/allExercises'
import manifest from './manifest'

/**
 * One part per manifest workshop step, SAME ORDER (workshopStepsDrift.test.ts).
 * Path scope and the optional flag live on the manifest; the shell hides
 * off-path steps and labels optional ones.
 */
const PARTS: WorkshopPart[] = [
  {
    id: 'scheme-selector',
    title: 'Which scheme answers the question?',
    description:
      'Match each claim to the scheme whose certificate can answer it: FIPS 140-3, Common Criteria, EUCC or PCI.',
    icon: ListChecks,
  },
  {
    id: 'boundary-drawer',
    title: 'Draw the certification boundary',
    description:
      'Decide what a certificate covers on the fictional Orrin N7 network HSM: client SDK, network service, appliance, firmware, crypto library and tenant partition.',
    icon: Frame,
  },
  {
    id: 'capstone',
    title: 'One product, four markets',
    description:
      'Plan one product for four markets: your path at full depth, the other three schemes at applicability level.',
    icon: Globe,
  },
  {
    id: 'change-analyzer',
    title: 'PQC change analyzer',
    description: 'Analyse what adding PQC changes for the product in each scheme.',
    icon: GitCompareArrows,
  },
  {
    id: 'evidence-exchange',
    title: 'Evidence exchange demo',
    description: 'A synthetic teaching demo of electronic certification-evidence exchange.',
    icon: ArrowRightLeft,
  },
]

const stepIndex = (stepId: string): number =>
  (manifest.workshopSteps ?? []).findIndex((s) => s.id === stepId)

export const CryptoProductCertificationModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    description="What a FIPS 140-3, Common Criteria, EUCC or PCI certificate proves, how to read one, and how to add post-quantum cryptography to a certified product without losing certification."
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
