// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Puzzle, Search, Link, Grid3x3, Lightbulb, Trash2 } from 'lucide-react'
import { Introduction } from './components/Introduction'
import { BodyClassifier } from './components/BodyClassifier'
import { OrganizationExplorer } from './components/OrganizationExplorer'
import { StandardsCertChain } from './components/StandardsCertChain'
import { CoverageGrid } from './components/CoverageGrid'
import { ScenarioChallenge } from './components/ScenarioChallenge'
import { useModuleStore } from '@/store/useModuleStore'
import { getModuleDeepLink, useSyncDeepLink } from '@/hooks/useModuleDeepLink'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ModuleReferencesTab } from '../../common/ModuleReferencesTab'
import { ModuleMigrateTab } from '../../common/ModuleMigrateTab'
import { ModuleVisualTab } from '../../common/ModuleVisualTab'
import { WorkshopStepHeader } from '../../common/WorkshopStepHeader'
import type { ClassifyResult } from './components/BodyClassifier'
import type { ChainAnswers } from './components/StandardsCertChain'
import type { GridSelection } from './components/CoverageGrid'
import type { ScenarioAnswer } from './components/ScenarioChallenge'
import { GlossaryAutoWrap } from '@/components/PKILearning/common/GlossaryAutoWrap'
import { Button } from '@/components/ui/button'
import { StandardsBodiesExercises } from './StandardsBodiesExercises'

const MODULE_ID = 'standards-bodies'

const PARTS = [
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

export const StandardsBodiesModule: React.FC = () => {
  const deepLink = getModuleDeepLink({ maxStep: PARTS.length - 1 })
  const [activeTab, setActiveTab] = useState(deepLink.initialTab)
  const [currentPart, setCurrentPart] = useState(deepLink.initialStep)
  useSyncDeepLink(activeTab, currentPart)
  const [configKey, setConfigKey] = useState(0)

  // Lifted state for workshop steps (reset clears all)
  const [classifierResults, setClassifierResults] = useState<ClassifyResult[]>([])
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null)
  const [chainAnswers, setChainAnswers] = useState<ChainAnswers>({})
  const [gridSelection, setGridSelection] = useState<GridSelection | null>(null)
  const [scenarioAnswers, setScenarioAnswers] = useState<ScenarioAnswer[]>([])

  const startTimeRef = useRef(0)
  const { updateModuleProgress, markStepComplete } = useModuleStore()

  useEffect(() => {
    startTimeRef.current = Date.now()
    updateModuleProgress(MODULE_ID, {
      status: 'in-progress',
      lastVisited: Date.now(),
    })

    return () => {
      const elapsedMs = Date.now() - startTimeRef.current
      const elapsed = elapsedMs / 60000
      const current = useModuleStore.getState().modules[MODULE_ID]
      updateModuleProgress(MODULE_ID, {
        timeSpent: (current?.timeSpent || 0) + elapsed,
      })
    }
  }, [updateModuleProgress])

  const handleTabChange = useCallback(
    (tab: string) => {
      markStepComplete(MODULE_ID, activeTab)
      setActiveTab(tab)
    },
    [activeTab, markStepComplete]
  )

  const navigateToWorkshop = useCallback(
    (step?: number) => {
      markStepComplete(MODULE_ID, activeTab)
      if (step !== undefined) setCurrentPart(step)
      setActiveTab('workshop')
    },
    [activeTab, markStepComplete]
  )

  const handlePartChange = useCallback(
    (newPart: number) => {
      const partIds = PARTS.map((p) => p.id)
      if (newPart > currentPart) {
        markStepComplete(MODULE_ID, partIds[currentPart])
      }
      setCurrentPart(newPart)
    },
    [currentPart, markStepComplete]
  )

  const handleReset = () => {
    if (confirm('Restart Standards, Certification & Compliance Bodies module?')) {
      setCurrentPart(0)
      setConfigKey((prev) => prev + 1)
      setClassifierResults([])
      setSelectedOrgId(null)
      setChainAnswers({})
      setGridSelection(null)
      setScenarioAnswers([])
      startTimeRef.current = Date.now()
      updateModuleProgress(MODULE_ID, {
        status: 'in-progress',
        completedSteps: [],
        timeSpent: 0,
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient">
            Standards, Certification &amp; Compliance Bodies
          </h1>
          <p className="text-muted-foreground mt-2">
            Understand who creates PQC standards, who certifies products, and who mandates
            compliance — worldwide and by region.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="learn">Learn</TabsTrigger>
          <TabsTrigger value="visual">Visual</TabsTrigger>
          <TabsTrigger value="workshop">Workshop</TabsTrigger>
          <TabsTrigger value="exercises">Exercises</TabsTrigger>
          <TabsTrigger value="references">References</TabsTrigger>
          <TabsTrigger value="tools">Tools &amp; Products</TabsTrigger>
        </TabsList>

        <TabsContent value="learn">
          <GlossaryAutoWrap>
            <Introduction onNavigateToWorkshop={navigateToWorkshop} />
          </GlossaryAutoWrap>
        </TabsContent>

        <TabsContent value="visual">
          <ModuleVisualTab moduleId={MODULE_ID} />
        </TabsContent>

        <TabsContent value="workshop">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex justify-end">
              <Button
                variant="ghost"
                onClick={handleReset}
                className="flex items-center gap-2 px-3 py-2 bg-destructive/10 text-destructive rounded hover:bg-destructive/20 transition-colors text-sm border border-destructive/20"
              >
                <Trash2 size={16} />
                Reset
              </Button>
            </div>

            {/* Step Progress Indicator */}
            <div className="overflow-x-auto px-2 sm:px-0">
              <div className="flex justify-evenly relative min-w-0">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border -z-10 hidden sm:block" />
                {PARTS.map((part, idx) => {
                  const Icon = part.icon
                  return (
                    <Button
                      variant="ghost"
                      key={part.id}
                      onClick={() => handlePartChange(idx)}
                      className={`flex flex-col items-center gap-1 group px-1 sm:px-2 py-1 h-auto ${
                        idx === currentPart ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors bg-background font-bold
                          ${
                            idx === currentPart
                              ? 'border-primary text-primary shadow-[0_0_15px_hsl(var(--primary)/0.3)]'
                              : idx < currentPart
                                ? 'border-status-success text-status-success'
                                : 'border-border text-muted-foreground'
                          }`}
                      >
                        <Icon size={16} />
                      </div>
                      <span className="text-sm font-medium hidden md:block">
                        {part.title.split(':')[0]}
                      </span>
                    </Button>
                  )
                })}
              </div>
            </div>

            {/* Content Area */}
            <div className="glass-panel p-4 sm:p-6 md:p-8 min-h-[400px] md:min-h-[600px] animate-fade-in">
              <WorkshopStepHeader
                moduleId={MODULE_ID}
                stepId={PARTS[currentPart].id}
                stepTitle={PARTS[currentPart].title}
                stepDescription={PARTS[currentPart].description}
                stepIndex={currentPart}
                totalSteps={PARTS.length}
              />

              {currentPart === 0 && (
                <BodyClassifier
                  key={`classifier-${configKey}`}
                  results={classifierResults}
                  onResultsChange={setClassifierResults}
                />
              )}
              {currentPart === 1 && (
                <OrganizationExplorer
                  key={`explorer-${configKey}`}
                  selectedOrgId={selectedOrgId}
                  onOrgSelect={setSelectedOrgId}
                />
              )}
              {currentPart === 2 && (
                <StandardsCertChain
                  key={`chain-${configKey}`}
                  answers={chainAnswers}
                  onAnswersChange={setChainAnswers}
                />
              )}
              {currentPart === 3 && (
                <CoverageGrid
                  key={`grid-${configKey}`}
                  selection={gridSelection}
                  onSelect={setGridSelection}
                />
              )}
              {currentPart === 4 && (
                <ScenarioChallenge
                  key={`scenarios-${configKey}`}
                  answers={scenarioAnswers}
                  onAnswersChange={setScenarioAnswers}
                />
              )}
            </div>

            {/* Step Navigation */}
            <div className="flex flex-col sm:flex-row justify-between gap-3">
              <Button
                variant="ghost"
                onClick={() => handlePartChange(Math.max(0, currentPart - 1))}
                disabled={currentPart === 0}
                className="px-6 py-3 min-h-[44px] rounded-lg border border-border hover:bg-muted disabled:opacity-50 transition-colors text-foreground"
                data-workshop-target="learn-stepper-prev"
              >
                &larr; Previous Step
              </Button>
              {currentPart === PARTS.length - 1 ? (
                <Button
                  variant="gradient"
                  onClick={() => markStepComplete(MODULE_ID, PARTS[currentPart].id)}
                  className="px-6 py-3 min-h-[44px] font-bold rounded-lg transition-colors"
                  data-workshop-target="learn-stepper-complete"
                >
                  Complete Module
                </Button>
              ) : (
                <Button
                  variant="gradient"
                  onClick={() => handlePartChange(currentPart + 1)}
                  className="px-6 py-3 min-h-[44px] font-bold rounded-lg transition-colors"
                  data-workshop-target="learn-stepper-next"
                >
                  Next Step &rarr;
                </Button>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="exercises">
          <StandardsBodiesExercises onNavigateToWorkshop={navigateToWorkshop} />
        </TabsContent>

        <TabsContent value="references">
          <ModuleReferencesTab moduleId={MODULE_ID} />
        </TabsContent>

        <TabsContent value="tools">
          <ModuleMigrateTab moduleId={MODULE_ID} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
