// SPDX-License-Identifier: AGPL-3.0-only
// OWNER: Scaffold
import type { FC } from 'react'
import { Link } from 'react-router'
import { Layers } from 'lucide-react'
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
    id: 'fips-level-planner',
    title: 'Level and boundary planner',
    description:
      'Plan the FIPS 140-3 security level and module boundary for the appliance and cloud-partition variants of the anchor HSM.',
    icon: Layers,
  },
]

const stepIndex = (stepId: string): number =>
  (manifest.workshopSteps ?? []).findIndex((s) => s.id === stepId)

export const Fips1403CertificationModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    description={
      <>
        FIPS 140-3 and the CMVP in depth: what a certificate proves, how to read one, and what
        adding post-quantum cryptography changes for a validated module. Start with{' '}
        <Link className="text-primary underline" to="/learn/crypto-product-certification">
          Cryptographic Product Certification: Fundamentals
        </Link>{' '}
        for the fundamentals every scheme shares; PCI PTS HSM is covered in{' '}
        <Link className="text-primary underline" to="/learn/pci-certification">
          PCI Certification
        </Link>
        .
      </>
    }
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
