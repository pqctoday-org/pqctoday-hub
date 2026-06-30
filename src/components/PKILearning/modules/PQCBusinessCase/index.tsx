// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import type { FC } from 'react'
import { Calculator, ShieldAlert, Presentation, TrendingDown } from 'lucide-react'
import { Introduction } from './components/Introduction'
import { ROICalculator } from './components/ROICalculator'
import { BreachScenarioSimulator } from './components/BreachScenarioSimulator'
import { BoardPitchBuilder } from './components/BoardPitchBuilder'
import { CostOfInactionAnalyzer } from './components/CostOfInactionAnalyzer'
import { PQCBusinessCaseExercises } from './PQCBusinessCaseExercises'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'

export interface ROIOutput {
  totalCostUSD: number
  roiPercent: number
  paybackMonths: number
  breachCostSavingsUSD: number
}

export interface BreachOutput {
  classicalCostUSD: number
  quantumCostUSD: number
  deltaUSD: number
}

const PARTS: WorkshopPart[] = [
  {
    id: 'roi-calculator',
    title: 'Step 1: ROI Calculator',
    description: 'Calculate the return on investment for PQC migration across your infrastructure.',
    icon: Calculator,
  },
  {
    id: 'breach-simulator',
    title: 'Step 2: Breach Scenario Simulator',
    description: 'Compare breach costs today vs. quantum-enabled breaches of tomorrow.',
    icon: ShieldAlert,
  },
  {
    id: 'board-pitch',
    title: 'Step 3: Board Pitch Builder',
    description: 'Generate a board-ready executive brief for PQC investment approval.',
    icon: Presentation,
  },
  {
    id: 'cost-of-inaction',
    title: 'Step 4: Cost of Inaction',
    description:
      'Model the compounding cost of delaying PQC migration — breach risk, complexity premiums, and regulatory penalties over 5 years.',
    icon: TrendingDown,
  },
]

export const PQCBusinessCaseModule: FC = () => {
  const [roiOutput, setROIOutput] = useState<ROIOutput | null>(null)
  const [breachOutput, setBreachOutput] = useState<BreachOutput | null>(null)

  return (
    <ModuleShell
      manifest={manifest}
      title="Building the PQC Business Case"
      description="Quantify costs, model ROI, and build compelling investment cases for post-quantum cryptography migration."
      learn={(api) => <Introduction onNavigateToWorkshop={api.goToWorkshop} />}
      exercises={(api) => <PQCBusinessCaseExercises onNavigateToWorkshop={api.goToWorkshop} />}
      workshopParts={PARTS}
      onReset={() => {
        setROIOutput(null)
        setBreachOutput(null)
      }}
      renderWorkshopStep={(index, configKey) => {
        switch (index) {
          case 0:
            return <ROICalculator key={`roi-${configKey}`} onOutput={setROIOutput} />
          case 1:
            return (
              <BreachScenarioSimulator key={`breach-${configKey}`} onOutput={setBreachOutput} />
            )
          case 2:
            return (
              <BoardPitchBuilder
                key={`board-${configKey}`}
                roiOutput={roiOutput}
                breachOutput={breachOutput}
              />
            )
          case 3:
            return (
              <CostOfInactionAnalyzer key={`inaction-${configKey}`} breachOutput={breachOutput} />
            )
          default:
            return null
        }
      }}
    />
  )
}
