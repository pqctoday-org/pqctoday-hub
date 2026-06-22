// SPDX-License-Identifier: GPL-3.0-only
import type { FC } from 'react'
import { BarChart3, GitMerge } from 'lucide-react'
import { Introduction } from './components/Introduction'
import { KriCascadeBuilder } from './components/KriCascadeBuilder'
import { ExceptionRegisterTriage } from './components/ExceptionRegisterTriage'
import { PqcGrcExercises } from './PqcGrcExercises'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'

const PARTS: WorkshopPart[] = [
  {
    id: 'kri-cascade',
    title: 'Step 1: KRI Cascade',
    description:
      'Assign each Key Risk Indicator to the board, CISO, or operational level and set its status against the framework thresholds.',
    icon: BarChart3,
  },
  {
    id: 'exception-triage',
    title: 'Step 2: Exception Register',
    description:
      'Triage deferral entries into the SOC suppression list, escalating any exception that is stale or lacks a remediation plan.',
    icon: GitMerge,
  },
]

export const PqcGrcModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    description="Make the post-quantum migration governable, measurable, and auditable: the KRI cascade, risk appetite, regulatory horizon, and the GRC-SOC handoff."
    learn={(api) => <Introduction onNavigateToWorkshop={api.goToWorkshop} />}
    exercises={(api) => <PqcGrcExercises onNavigateToWorkshop={api.goToWorkshop} />}
    workshopParts={PARTS}
    renderWorkshopStep={(index) => {
      switch (index) {
        case 0:
          return <KriCascadeBuilder />
        case 1:
          return <ExceptionRegisterTriage />
        default:
          return null
      }
    }}
  />
)
