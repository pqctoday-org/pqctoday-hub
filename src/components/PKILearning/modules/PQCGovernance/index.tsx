// SPDX-License-Identifier: GPL-3.0-only
import type { FC } from 'react'
import { Users, FileText, BarChart3, GitBranch } from 'lucide-react'
import { Introduction } from './components/Introduction'
import { RACIBuilder } from './components/RACIBuilder'
import { PolicyTemplateGenerator } from './components/PolicyTemplateGenerator'
import { KPIDashboardBuilder } from './components/KPIDashboardBuilder'
import { EscalationFramework } from './components/EscalationFramework'
import { PQCGovernanceExercises } from './PQCGovernanceExercises'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'

const PARTS: WorkshopPart[] = [
  {
    id: 'raci-builder',
    title: 'Step 1: RACI Matrix',
    description: 'Define roles and responsibilities for your PQC migration program.',
    icon: Users,
  },
  {
    id: 'policy-generator',
    title: 'Step 2: Policy Generator',
    description: 'Generate PQC policy templates customized to your organization.',
    icon: FileText,
  },
  {
    id: 'kpi-dashboard',
    title: 'Step 3: KPI Dashboard',
    description: 'Design a governance KPI dashboard to track your PQC migration progress.',
    icon: BarChart3,
  },
  {
    id: 'escalation-framework',
    title: 'Step 4: Escalation Framework',
    description:
      'Define escalation tiers and evaluate policy exception requests with a structured risk scoring tool.',
    icon: GitBranch,
  },
]

export const PQCGovernanceModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    description="Establish governance frameworks, define roles, and create policies that guide your organization's PQC transition."
    learn={(api) => <Introduction onNavigateToWorkshop={api.goToWorkshop} />}
    exercises={(api) => <PQCGovernanceExercises onNavigateToWorkshop={api.goToWorkshop} />}
    workshopParts={PARTS}
    renderWorkshopStep={(index, configKey) => {
      switch (index) {
        case 0:
          return <RACIBuilder key={`raci-${configKey}`} />
        case 1:
          return <PolicyTemplateGenerator key={`policy-${configKey}`} />
        case 2:
          return <KPIDashboardBuilder key={`kpi-${configKey}`} />
        case 3:
          return <EscalationFramework key={`escalation-${configKey}`} />
        default:
          return null
      }
    }}
  />
)
