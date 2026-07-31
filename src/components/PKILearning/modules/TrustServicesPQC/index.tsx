// SPDX-License-Identifier: GPL-3.0-only
import type { FC } from 'react'
import { Clock, GitCompareArrows, KeyRound } from 'lucide-react'
import { TrustServicesIntroduction } from './components/TrustServicesIntroduction'
import { SignatureLongevityCalculator } from './workshop/SignatureLongevityCalculator'
import { SupersessionExplorer } from './workshop/SupersessionExplorer'
import { HybridSuitePicker } from './workshop/HybridSuitePicker'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'

const PARTS: WorkshopPart[] = [
  {
    id: 'longevity-calculator',
    title: 'Step 1: Signature Longevity Calculator',
    description:
      'Set how long a signature must remain evaluable and see which degradation stages fall inside that window — and when every signature already in the archive must be re-timestamped.',
    icon: Clock,
  },
  {
    id: 'supersession-explorer',
    title: 'Step 2: Standards Supersession Explorer',
    description:
      'The same ETSI standard before and after post-quantum algorithms existed — crypto agility argued from primary documents rather than principle.',
    icon: GitCompareArrows,
  },
  {
    id: 'hybrid-suite-picker',
    title: 'Step 3: Hybrid Suite Picker',
    description:
      'The hybrid combinations ETSI recommends (TS 119 312 V2.1.1 Table 3.3), and why the PQC partner is determined by the strength of the classical component.',
    icon: KeyRound,
  },
]

export const TrustServicesPQCModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    description="Qualified signatures, timestamping and proof of existence, long-term validation and re-timestamping, trust service provider conformity, and the ETSI cryptographic suites that just gained post-quantum modes."
    learn={(api) => <TrustServicesIntroduction onNavigateToWorkshop={api.goToWorkshop} />}
    workshopParts={PARTS}
    renderWorkshopStep={(index, configKey) => {
      switch (index) {
        case 0:
          return <SignatureLongevityCalculator key={`longevity-${configKey}`} />
        case 1:
          return <SupersessionExplorer key={`supersession-${configKey}`} />
        case 2:
          return <HybridSuitePicker key={`hybrid-${configKey}`} />
        default:
          return null
      }
    }}
  />
)
