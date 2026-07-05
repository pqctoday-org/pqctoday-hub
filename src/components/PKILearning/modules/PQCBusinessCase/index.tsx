// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import type { FC } from 'react'
import { BarChart3, Calculator, ShieldAlert, Presentation, TrendingDown } from 'lucide-react'
import { Introduction } from './components/Introduction'
import { CostModelExplorer } from './components/CostModelExplorer'
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

export interface InactionOutput {
  costOfInactionUSD: number
  delayYears: number
}

const PARTS: WorkshopPart[] = [
  {
    id: 'cost-model-explorer',
    title: 'Step 1: Cost Model Explorer',
    description:
      'See how the six costing models diverge on one scenario before you commit to any single number.',
    icon: BarChart3,
  },
  {
    id: 'roi-calculator',
    title: 'Step 2: ROI Calculator',
    description: 'Calculate the return on investment for PQC migration across your infrastructure.',
    icon: Calculator,
  },
  {
    id: 'breach-simulator',
    title: 'Step 3: Breach Scenario Simulator',
    description: 'Compare breach costs today vs. quantum-enabled breaches of tomorrow.',
    icon: ShieldAlert,
  },
  {
    id: 'cost-of-inaction',
    title: 'Step 4: Cost of Inaction',
    description:
      'Model the compounding cost of delaying PQC migration — breach risk, complexity premiums, and regulatory penalties over 5 years.',
    icon: TrendingDown,
  },
  {
    id: 'board-pitch',
    title: 'Step 5: Board Pitch Builder',
    description:
      'Assemble a board-ready executive brief for PQC investment approval, populated from the earlier steps.',
    icon: Presentation,
  },
]

export const PQCBusinessCaseModule: FC = () => {
  const [roiOutput, setROIOutput] = useState<ROIOutput | null>(null)
  const [breachOutput, setBreachOutput] = useState<BreachOutput | null>(null)
  const [inactionOutput, setInactionOutput] = useState<InactionOutput | null>(null)

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
        setInactionOutput(null)
      }}
      renderWorkshopStep={(index, configKey) => {
        switch (index) {
          case 0:
            return <CostModelExplorer key={`explorer-${configKey}`} />
          case 1:
            return <ROICalculator key={`roi-${configKey}`} onOutput={setROIOutput} />
          case 2:
            return (
              <BreachScenarioSimulator key={`breach-${configKey}`} onOutput={setBreachOutput} />
            )
          case 3:
            return (
              <CostOfInactionAnalyzer
                key={`inaction-${configKey}`}
                breachOutput={breachOutput}
                onOutput={setInactionOutput}
              />
            )
          case 4:
            return (
              <BoardPitchBuilder
                key={`board-${configKey}`}
                roiOutput={roiOutput}
                breachOutput={breachOutput}
                inactionOutput={inactionOutput}
              />
            )
          default:
            return null
        }
      }}
    />
  )
}
