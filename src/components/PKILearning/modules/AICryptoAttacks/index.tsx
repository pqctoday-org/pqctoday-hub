// SPDX-License-Identifier: AGPL-3.0-only
import type { FC } from 'react'
import { Search, KeyRound, Activity, ListChecks, Shield } from 'lucide-react'
import { AICryptoAttacksIntroduction } from './components/AICryptoAttacksIntroduction'
import { AICryptoAttacksExercises } from './components/AICryptoAttacksExercises'
import { SecretHunt } from './workshop/SecretHunt'
import { KeyPolicyReview } from './workshop/KeyPolicyReview'
import { TraceLearning } from './workshop/TraceLearning'
import { ClaimSorter } from './workshop/ClaimSorter'
import { DefencePlanner } from './workshop/DefencePlanner'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'

const PARTS: WorkshopPart[] = [
  {
    id: 'secret-hunt',
    title: 'Step 1: Secret Hunt (CI & Repo Hygiene)',
    description:
      'Inspect a Hub-made sample repository with EXAMPLE_FAKE_ placeholders, run pattern rules, see which leaks evade simple regexes, and apply defensive remediations.',
    icon: Search,
  },
  {
    id: 'key-policy-review',
    title: 'Step 2: KMS & HSM Key-Policy Review',
    description:
      'Audit PKCS #11 v3.2 templates and cloud Managed HSM policies for wrap-export and IAM-separation gaps without generating API call sequences or exporting keys.',
    icon: KeyRound,
  },
  {
    id: 'trace-learning',
    title: 'Step 3: Synthetic Trace Learning Lab',
    description:
      'Vary synthetic clock jitter, masking order, and trace count on in-page generated waves to see why physical access and attack-based evaluation matter.',
    icon: Activity,
  },
  {
    id: 'claim-sorter',
    title: 'Step 4: Claim & Rubric Sorter',
    description:
      'Classify 12 statements about AI and cryptography into demonstrated, reported, or hypothesised and full vs reduced scope, revealing the primary source and rubric.',
    icon: ListChecks,
  },
  {
    id: 'defence-planner',
    title: 'Step 5: Layered Defence Planner',
    description:
      'Select controls per layer for a wallet backend, cloud KMS app, or embedded firmware signer and inspect residual risk boundaries.',
    icon: Shield,
  },
]

export const AICryptoAttacksModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    description="Evidence-bounded assessment of AI threats across software secret leakage, cryptographic implementation flaws, side-channel trace learning, KMS/HSM policy, and mathematical cryptanalysis as of 2026-11-21."
    learn={(api) => <AICryptoAttacksIntroduction onNavigateToWorkshop={api.goToWorkshop} />}
    exercises={(api) => (
      <AICryptoAttacksExercises
        onNavigateToWorkshop={api.goToWorkshop}
        onSetWorkshopConfig={(config) => api.openWorkshopStep(config.step, { ...config })}
      />
    )}
    workshopParts={PARTS}
    renderWorkshopStep={(index, configKey) => {
      switch (index) {
        case 0:
          return <SecretHunt key={`secret-hunt-${configKey}`} />
        case 1:
          return <KeyPolicyReview key={`key-policy-${configKey}`} />
        case 2:
          return <TraceLearning key={`trace-learning-${configKey}`} />
        case 3:
          return <ClaimSorter key={`claim-sorter-${configKey}`} />
        case 4:
          return <DefencePlanner key={`defence-planner-${configKey}`} />
        default:
          return null
      }
    }}
  />
)
