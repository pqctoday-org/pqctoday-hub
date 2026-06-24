// SPDX-License-Identifier: GPL-3.0-only
import type { FC } from 'react'
import { Trash2, ClipboardCheck, Archive } from 'lucide-react'
import { VerificationClosureIntroduction } from './components/VerificationClosureIntroduction'
import { VerificationClosureExercises } from './components/VerificationClosureExercises'
import { DecommissionChecklist } from './workshop/DecommissionChecklist'
import { CoveragePlanner } from './workshop/CoveragePlanner'
import { ClosureHandoverRegister } from './workshop/ClosureHandoverRegister'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'

const PARTS: WorkshopPart[] = [
  {
    id: 'decommission-checklist',
    title: 'Step 1: Decommission Checklist',
    description: 'Retire one classical asset: deprecate → remove → verify removed → log.',
    icon: Trash2,
  },
  {
    id: 'coverage-planner',
    title: 'Step 2: Verification Coverage Planner',
    description: 'Decide which systems to verify and what proof per tier.',
    icon: ClipboardCheck,
  },
  {
    id: 'closure-handover-register',
    title: 'Step 3: Closure & Handover Register',
    description: 'Transfer standing capabilities to permanent owners and close.',
    icon: Archive,
  },
]

export const VerificationClosureModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    title="Decommissioning & Program Closure"
    description="Retire classical cryptography on a defensible schedule, prove the migration happened from observed behaviour, and hand the program to business-as-usual."
    learn={(api) => <VerificationClosureIntroduction onNavigateToWorkshop={api.goToWorkshop} />}
    exercises={(api) => <VerificationClosureExercises onNavigateToWorkshop={api.goToWorkshop} />}
    workshopParts={PARTS}
    renderWorkshopStep={(index, configKey) => {
      switch (index) {
        case 0:
          return <DecommissionChecklist key={`decommission-${configKey}`} />
        case 1:
          return <CoveragePlanner key={`coverage-${configKey}`} />
        case 2:
          return <ClosureHandoverRegister key={`closure-${configKey}`} />
        default:
          return null
      }
    }}
  />
)
