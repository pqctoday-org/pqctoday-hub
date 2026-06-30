// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
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
export type { RoadmapOutput } from './types'
import type { RoadmapOutput } from './types'

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

export const MigrationProgramModule: FC = () => {
  const [roadmapOutput, setRoadmapOutput] = useState<RoadmapOutput | null>(null)

  return (
    <ModuleShell
      manifest={manifest}
      title="Migration Program Management"
      description="Plan, execute, and track enterprise-wide PQC migration programs with structured frameworks and stakeholder alignment."
      learn={(api) => <Introduction onNavigateToWorkshop={api.goToWorkshop} />}
      exercises={(api) => <MigrationProgramExercises onNavigateToWorkshop={api.goToWorkshop} />}
      workshopParts={PARTS}
      onReset={() => setRoadmapOutput(null)}
      renderWorkshopStep={(index, configKey) => {
        switch (index) {
          case 0:
            return <RoadmapBuilder key={`roadmap-${configKey}`} onOutput={setRoadmapOutput} />
          case 1:
            return (
              <StakeholderCommsPlanner key={`comms-${configKey}`} roadmapOutput={roadmapOutput} />
            )
          case 2:
            return <KPITrackerTemplate key={`kpi-${configKey}`} roadmapOutput={roadmapOutput} />
          case 3:
            return (
              <DeploymentPlaybook key={`playbook-${configKey}`} roadmapOutput={roadmapOutput} />
            )
          default:
            return null
        }
      }}
    />
  )
}
