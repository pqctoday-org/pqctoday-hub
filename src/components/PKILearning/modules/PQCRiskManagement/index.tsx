// SPDX-License-Identifier: GPL-3.0-only
import type { FC } from 'react'
import { useState } from 'react'
import { Clock, ClipboardList, Grid3X3, GitCompareArrows } from 'lucide-react'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'
import { Introduction } from './components/Introduction'
import { CRQCScenarioPlanner } from './components/CRQCScenarioPlanner'
import { RiskRegisterBuilder } from './components/RiskRegisterBuilder'
import { RiskHeatmapGenerator } from './components/RiskHeatmapGenerator'
import { ComplianceGapAnalysis } from './components/ComplianceGapAnalysis'
import { PQCRiskManagementExercises } from './PQCRiskManagementExercises'

const PARTS: WorkshopPart[] = [
  {
    id: 'crqc-scenario-planner',
    title: 'Step 1: CRQC Scenario Planner',
    description:
      'Model when a cryptographically relevant quantum computer could arrive and its cascading impacts.',
    icon: Clock,
  },
  {
    id: 'risk-register-builder',
    title: 'Step 2: Risk Register Builder',
    description: 'Build a quantum risk register for your organization’s cryptographic assets.',
    icon: ClipboardList,
  },
  {
    id: 'risk-heatmap',
    title: 'Step 3: Risk Heatmap',
    description:
      'Assign risk treatments, model residual risk, and prioritize your PQC migration order.',
    icon: Grid3X3,
  },
  {
    id: 'compliance-gap-analysis',
    title: 'Step 4: Compliance Gap Analysis',
    description:
      'Map your risk register against CNSA 2.0 and NIST IR 8547 deadlines to identify compliance gaps.',
    icon: GitCompareArrows,
  },
]

interface RiskEntry {
  id: string
  assetName: string
  currentAlgorithm: string
  threatVector: string
  likelihood: number
  impact: number
  mitigation: string
}

export const PQCRiskManagementModule: FC = () => {
  // riskEntries is shared cross-STEP state: Step 2 (RiskRegisterBuilder) builds
  // the register that Steps 3 and 4 consume. Held in the module FC so it
  // survives step changes; the original Reset cleared it, hence the onReset slot.
  const [riskEntries, setRiskEntries] = useState<RiskEntry[]>([])

  return (
    <ModuleShell
      manifest={manifest}
      description="Identify, quantify, and prioritize quantum computing risks to your organization’s cryptographic infrastructure."
      learn={(api) => <Introduction onNavigateToWorkshop={() => api.goToWorkshop()} />}
      exercises={(api) => (
        <PQCRiskManagementExercises onNavigateToWorkshop={() => api.goToWorkshop()} />
      )}
      workshopParts={PARTS}
      onReset={() => setRiskEntries([])}
      renderWorkshopStep={(index, configKey) => {
        switch (index) {
          case 0:
            return <CRQCScenarioPlanner key={`crqc-${configKey}`} />
          case 1:
            return (
              <RiskRegisterBuilder
                key={`register-${configKey}`}
                riskEntries={riskEntries}
                onRiskEntriesChange={setRiskEntries}
              />
            )
          case 2:
            return <RiskHeatmapGenerator key={`heatmap-${configKey}`} riskEntries={riskEntries} />
          case 3:
            return (
              <ComplianceGapAnalysis key={`compliance-${configKey}`} riskEntries={riskEntries} />
            )
          default:
            return null
        }
      }}
    />
  )
}
