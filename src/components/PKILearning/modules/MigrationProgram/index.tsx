// SPDX-License-Identifier: GPL-3.0-only
import type { FC } from 'react'
import { Map, MessageSquare, Target, BookOpen } from 'lucide-react'
import { Introduction } from './components/Introduction'
import { RoadmapBuilder } from './components/RoadmapBuilder'
import { StakeholderCommsPlanner } from './components/StakeholderCommsPlanner'
import { KPITrackerTemplate } from './components/KPITrackerTemplate'
import { DeploymentPlaybook } from './components/DeploymentPlaybook'
import { MigrationProgramExercises } from './MigrationProgramExercises'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'

const PARTS: WorkshopPart[] = [
  {
    id: 'roadmap-builder',
    title: 'Step 1: Roadmap Builder',
    description: 'Build a PQC migration roadmap with milestones overlaid on regulatory deadlines.',
    icon: Map,
  },
  {
    id: 'stakeholder-comms',
    title: 'Step 2: Stakeholder Comms',
    description: 'Create a stakeholder communication plan for your PQC migration program.',
    icon: MessageSquare,
  },
  {
    id: 'kpi-tracker',
    title: 'Step 3: KPI Tracker',
    description: 'Design a migration program KPI tracker with live data integration.',
    icon: Target,
  },
  {
    id: 'deployment-playbook',
    title: 'Step 4: Deployment Playbook',
    description:
      'Step-by-step execution checklist covering pre-migration, migration, and post-migration gates.',
    icon: BookOpen,
  },
]

export const MigrationProgramModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    title="Migration Program Management"
    description="Plan, execute, and track enterprise-wide PQC migration programs with structured frameworks and stakeholder alignment."
    learn={(api) => <Introduction onNavigateToWorkshop={api.goToWorkshop} />}
    exercises={(api) => <MigrationProgramExercises onNavigateToWorkshop={api.goToWorkshop} />}
    workshopParts={PARTS}
    renderWorkshopStep={(index, configKey) => {
      switch (index) {
        case 0:
          return <RoadmapBuilder key={`roadmap-${configKey}`} />
        case 1:
          return <StakeholderCommsPlanner key={`comms-${configKey}`} />
        case 2:
          return <KPITrackerTemplate key={`kpi-${configKey}`} />
        case 3:
          return <DeploymentPlaybook key={`playbook-${configKey}`} />
        default:
          return null
      }
    }}
  />
)
