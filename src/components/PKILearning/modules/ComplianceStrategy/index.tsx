// SPDX-License-Identifier: GPL-3.0-only
import type { FC } from 'react'
import { useState } from 'react'
import { Globe, CheckSquare, CalendarRange, ShieldCheck } from 'lucide-react'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'
import { Introduction } from './components/Introduction'
import { JurisdictionMapper } from './components/JurisdictionMapper'
import { AuditReadinessChecklist } from './components/AuditReadinessChecklist'
import { ComplianceTimelineBuilder } from './components/ComplianceTimelineBuilder'
import { RegulatoryGapAssessment } from './components/RegulatoryGapAssessment'
import { ComplianceStrategyExercises } from './ComplianceStrategyExercises'

const PARTS: WorkshopPart[] = [
  {
    id: 'jurisdiction-mapper',
    title: 'Step 1: Jurisdiction Mapper',
    description: 'Map applicable PQC frameworks and deadlines across your operating jurisdictions.',
    icon: Globe,
  },
  {
    id: 'audit-readiness',
    title: 'Step 2: Audit Readiness',
    description: 'Build a compliance audit readiness checklist for your PQC migration.',
    icon: CheckSquare,
  },
  {
    id: 'compliance-timeline',
    title: 'Step 3: Compliance Timeline',
    description:
      'Build a compliance timeline overlaying framework deadlines with your migration milestones.',
    icon: CalendarRange,
  },
  {
    id: 'regulatory-gap-assessment',
    title: 'Step 4: Regulatory Gap Assessment',
    description:
      'Identify compliance gaps across your selected jurisdictions and generate a prioritized remediation plan.',
    icon: ShieldCheck,
  },
]

export const ComplianceStrategyModule: FC = () => {
  // Shared cross-STEP state: Step 1 (JurisdictionMapper) selects jurisdictions
  // and dismisses frameworks; Steps 3-4 consume them. Held in the module FC so
  // it survives step changes; the original Reset cleared both, hence onReset.
  const [selectedJurisdictions, setSelectedJurisdictions] = useState<string[]>([])
  const [dismissedFrameworks, setDismissedFrameworks] = useState<Set<string>>(new Set())

  return (
    <ModuleShell
      manifest={manifest}
      description="Navigate the complex landscape of PQC compliance requirements across jurisdictions and frameworks."
      learn={(api) => <Introduction onNavigateToWorkshop={() => api.goToWorkshop()} />}
      exercises={(api) => (
        <ComplianceStrategyExercises onNavigateToWorkshop={() => api.goToWorkshop()} />
      )}
      workshopParts={PARTS}
      onReset={() => {
        setSelectedJurisdictions([])
        setDismissedFrameworks(new Set())
      }}
      renderWorkshopStep={(index, configKey) => {
        switch (index) {
          case 0:
            return (
              <JurisdictionMapper
                key={`jurisdiction-${configKey}`}
                selectedJurisdictions={selectedJurisdictions}
                onJurisdictionsChange={setSelectedJurisdictions}
                dismissedFrameworks={dismissedFrameworks}
                onDismissedFrameworksChange={setDismissedFrameworks}
              />
            )
          case 1:
            return <AuditReadinessChecklist key={`audit-${configKey}`} />
          case 2:
            return (
              <ComplianceTimelineBuilder
                key={`timeline-${configKey}`}
                selectedJurisdictions={selectedJurisdictions}
                dismissedFrameworkIds={dismissedFrameworks}
              />
            )
          case 3:
            return (
              <RegulatoryGapAssessment
                key={`gap-${configKey}`}
                selectedJurisdictions={selectedJurisdictions}
              />
            )
          default:
            return null
        }
      }}
    />
  )
}
