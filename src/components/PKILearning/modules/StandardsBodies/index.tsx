// SPDX-License-Identifier: GPL-3.0-only
import { useState, type FC } from 'react'
import { Puzzle, Search, Link, Grid3x3, Lightbulb } from 'lucide-react'
import { Introduction } from './components/Introduction'
import { BodyClassifier } from './components/BodyClassifier'
import { OrganizationExplorer } from './components/OrganizationExplorer'
import { StandardsCertChain } from './components/StandardsCertChain'
import { CoverageGrid } from './components/CoverageGrid'
import { ScenarioChallenge } from './components/ScenarioChallenge'
import type { ClassifyResult } from './components/BodyClassifier'
import type { ChainAnswers } from './components/StandardsCertChain'
import type { GridSelection } from './components/CoverageGrid'
import type { ScenarioAnswer } from './components/ScenarioChallenge'
import { StandardsBodiesExercises } from './StandardsBodiesExercises'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'

const PARTS: WorkshopPart[] = [
  {
    id: 'body-classifier',
    title: 'Step 1: Body Classifier',
    description:
      'Classify 12 organizations by type, scope, and authority. Get color-coded feedback for each.',
    icon: Puzzle,
  },
  {
    id: 'org-explorer',
    title: 'Step 2: Organization Explorer',
    description:
      'Deep-dive into 12 key standards and certification bodies — founding, decision-making, and PQC outputs.',
    icon: Search,
  },
  {
    id: 'chain-builder',
    title: 'Step 3: Standards → Certification → Compliance Chain',
    description:
      'Trace the chain from algorithm standard to certification program to compliance mandate in 4 real scenarios.',
    icon: Link,
  },
  {
    id: 'coverage-grid',
    title: 'Step 4: Regional Coverage Grid',
    description:
      'Interactive 5-region × 4-type matrix. Click any cell to see which bodies operate there.',
    icon: Grid3x3,
  },
  {
    id: 'scenario-challenge',
    title: 'Step 5: Scenario Challenge',
    description:
      '5 scored workplace scenarios. Select the right body type, organization, and standard. Detailed explanations included.',
    icon: Lightbulb,
  },
]

/**
 * Workshop step bodies with module-level lifted state, so a step restores its
 * prior answers when you navigate away and back (only one step renders at a
 * time). Keyed by configKey in the shell, so a Reset remounts this wrapper and
 * clears every slice — matching the golden master's `setConfigKey` + cleared
 * lifted state.
 */
const StandardsBodiesWorkshopSteps: FC<{ index: number }> = ({ index }) => {
  const [classifierResults, setClassifierResults] = useState<ClassifyResult[]>([])
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null)
  const [chainAnswers, setChainAnswers] = useState<ChainAnswers>({})
  const [gridSelection, setGridSelection] = useState<GridSelection | null>(null)
  const [scenarioAnswers, setScenarioAnswers] = useState<ScenarioAnswer[]>([])

  switch (index) {
    case 0:
      return <BodyClassifier results={classifierResults} onResultsChange={setClassifierResults} />
    case 1:
      return <OrganizationExplorer selectedOrgId={selectedOrgId} onOrgSelect={setSelectedOrgId} />
    case 2:
      return <StandardsCertChain answers={chainAnswers} onAnswersChange={setChainAnswers} />
    case 3:
      return <CoverageGrid selection={gridSelection} onSelect={setGridSelection} />
    case 4:
      return <ScenarioChallenge answers={scenarioAnswers} onAnswersChange={setScenarioAnswers} />
    default:
      return null
  }
}

export const StandardsBodiesModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    description="Understand who creates PQC standards, who certifies products, and who mandates compliance — worldwide and by region."
    learn={(api) => <Introduction onNavigateToWorkshop={api.goToWorkshop} />}
    exercises={(api) => <StandardsBodiesExercises onNavigateToWorkshop={api.goToWorkshop} />}
    workshopParts={PARTS}
    renderWorkshopStep={(index, configKey) => (
      <StandardsBodiesWorkshopSteps key={`steps-${configKey}`} index={index} />
    )}
  />
)
