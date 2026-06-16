// SPDX-License-Identifier: GPL-3.0-only
import type { FC } from 'react'
import { Calculator, Award } from 'lucide-react'
import { Introduction } from './components/Introduction'
import { TeamSizingCalculator } from './components/TeamSizingCalculator'
import { CryptoChampionBuilder } from './components/CryptoChampionBuilder'
import { SkillsTeamStructureExercises } from './SkillsTeamStructureExercises'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'

const PARTS: WorkshopPart[] = [
  {
    id: 'team-sizing',
    title: 'Step 1: Team Sizing Calculator',
    description:
      'Convert your cryptographic estate size into a program FTE estimate using the 1-FTE-per-500-instances heuristic.',
    icon: Calculator,
  },
  {
    id: 'crypto-champions',
    title: 'Step 2: Crypto Champion Roster',
    description:
      'Assign one crypto champion per platform team and track their four readiness commitments.',
    icon: Award,
  },
]

export const SkillsTeamStructureModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    title="Building Your PQC Team"
    description="Staff a post-quantum migration program: the core roles, an estate-driven sizing heuristic, build/borrow/buy sourcing, the four training levels, and the Crypto Champion Program."
    learn={(api) => <Introduction onNavigateToWorkshop={api.goToWorkshop} />}
    exercises={(api) => <SkillsTeamStructureExercises onNavigateToWorkshop={api.goToWorkshop} />}
    workshopParts={PARTS}
    renderWorkshopStep={(index, configKey) => {
      switch (index) {
        case 0:
          return <TeamSizingCalculator key={`team-sizing-${configKey}`} />
        case 1:
          return <CryptoChampionBuilder key={`crypto-champions-${configKey}`} />
        default:
          return null
      }
    }}
  />
)
