// SPDX-License-Identifier: GPL-3.0-only
// OWNER: Scaffold
import type { FC } from 'react'
import { ClipboardCheck } from 'lucide-react'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import { CertIntroduction } from '@/components/PKILearning/modules/CryptoProductCertification/components/CertIntroduction'
import { CertExercises } from '@/components/PKILearning/modules/CryptoProductCertification/components/CertExercises'
import { SECTION_COMPONENTS } from './components/sectionRegistry'
import { STEP_COMPONENTS } from './workshop/stepRegistry'
import { ALL_EXERCISES } from './data/allExercises'
import manifest from './manifest'

/**
 * One part per manifest workshop step, SAME ORDER (workshopStepsDrift.test.ts).
 */
const PARTS: WorkshopPart[] = [
  {
    id: 'pci-evidence-review',
    title: 'Payment HSM evidence review',
    description:
      'Review a payment HSM’s evidence: PTS listing, Security Policy, FIPS certificate and KMO/PIN assessment scope.',
    icon: ClipboardCheck,
  },
]

const stepIndex = (stepId: string): number =>
  (manifest.workshopSteps ?? []).findIndex((s) => s.id === stepId)

export const PciCertificationModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    description="PCI PTS HSM and the payment operating stack in depth: what a device approval proves, how to read it, and what adding post-quantum cryptography changes for a payment HSM. Start with LM-065 for the fundamentals every scheme shares; FIPS 140-3 is covered in LM-067."
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
