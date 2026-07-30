// SPDX-License-Identifier: GPL-3.0-only
import type { FC } from 'react'
import { ShieldCheck, Landmark, FileBadge } from 'lucide-react'
import { GovernmentDefenseIntroduction } from './components/GovernmentDefenseIntroduction'
import { SuiteComparator } from './workshop/SuiteComparator'
import { MandateExplorer } from './workshop/MandateExplorer'
import { FpkiProfilePair } from './workshop/FpkiProfilePair'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'

const PARTS: WorkshopPart[] = [
  {
    id: 'suite-comparator',
    title: 'Step 1: CNSA 1.0 → 2.0 Comparator',
    description:
      'Compare the two suites line by line — every public-key purpose is replaced, the symmetric primitives are essentially untouched.',
    icon: ShieldCheck,
  },
  {
    id: 'mandate-explorer',
    title: 'Step 2: Federal Mandate Explorer',
    description:
      'Work out which instruments bind a system — National Security System, federal civilian, or a nonfederal system handling CUI — and whether it has a dated deadline at all.',
    icon: Landmark,
  },
  {
    id: 'fpki-profile-pair',
    title: 'Step 3: Federal PKI Profile Pair',
    description:
      'The classical Common Policy certificate profile beside the draft ML-DSA/ML-KEM profile, and why a draft is not something to hold a supplier to.',
    icon: FileBadge,
  },
]

export const GovernmentDefensePQCModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    description="CNSA 2.0 and its dated mandates, National Security Systems and CSfC, Federal PKI and the draft post-quantum certificate profile, and the procurement rules that push all of it down the supply chain."
    learn={(api) => <GovernmentDefenseIntroduction onNavigateToWorkshop={api.goToWorkshop} />}
    workshopParts={PARTS}
    renderWorkshopStep={(index, configKey) => {
      switch (index) {
        case 0:
          return <SuiteComparator key={`suite-${configKey}`} />
        case 1:
          return <MandateExplorer key={`mandate-${configKey}`} />
        case 2:
          return <FpkiProfilePair key={`fpki-${configKey}`} />
        default:
          return null
      }
    }}
  />
)
