// SPDX-License-Identifier: GPL-3.0-only
// OWNER: Scaffold
import type { FC } from 'react'
import {
  ArrowRightLeft,
  ClipboardCheck,
  FileSearch,
  Frame,
  GitCompareArrows,
  Globe,
  Layers,
  ListChecks,
  Scale,
} from 'lucide-react'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import { CertIntroduction } from './components/CertIntroduction'
import { CertExercises } from './components/CertExercises'
import { STEP_COMPONENTS } from './workshop/stepRegistry'
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
    id: 'fips-level-planner',
    title: 'Level and boundary planner',
    description:
      'Plan the FIPS 140-3 security level and module boundary for the appliance and cloud-partition variants of the anchor HSM.',
    icon: Layers,
  },
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
  {
    id: 'pci-evidence-review',
    title: 'Payment HSM evidence review',
    description:
      'Review a payment HSM’s evidence: PTS listing, Security Policy, FIPS certificate and KMO/PIN assessment scope.',
    icon: ClipboardCheck,
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
    learn={(api) => <CertIntroduction onNavigateToWorkshop={() => api.goToWorkshop()} />}
    exercises={(api) => (
      <CertExercises
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
