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

function ExercisesTab() {
  const exercises = [
    {
      title: 'Scenario: Multinational Vendor PQC Certification Strategy',
      prompt:
        "Your HSM vendor sells products to US federal agencies, EU government entities, and a Korean telecom. For each market: (1) US: Which certification program must your FIPS 203/204/205 implementation pass? Which body administers it, and which body wrote the underlying standard? (2) EU: If the customer requires CC-based certification, which EU scheme applies? Which body issues EUCC certificates, and which body maintains the Agreed Cryptographic Mechanisms (ACM) list? (3) Korea: Which national PQC competition produced Korea's approved algorithms? Which government agency ran the competition, and which algorithms were selected?\n\nUse the Organization Explorer (Step 2) to research each body, and the Coverage Grid (Step 4) to map which certification bodies operate in each region.",
    },
    {
      title: 'Scenario: IETF vs NIST — Protocol Integration Decision',
      prompt:
        'Your engineering team is adding PQC to a TLS 1.3 implementation. They ask: "Should we follow the NIST standard or the IETF standard?" Help them understand the relationship: (1) Which organization published the ML-KEM algorithm (FIPS 203)? What type of body is it — standards body, regulatory agency, or certification body? (2) Which IETF working group handles PQC integration into TLS? What is the key exchange draft/RFC they produced? (3) Are these in conflict, or complementary? How do NIST algorithm standards feed into IETF protocol standards? Sketch the relationship.\n\nUse the Standards→Cert→Compliance Chain (Step 3, Scenario 4) and the Organization Explorer (Step 2) to compare NIST vs IETF decision-making processes.',
    },
    {
      title: 'Scenario: Compliance Framework Authorship Audit',
      prompt:
        'Your legal team is preparing a PQC compliance brief and lists the following mandates. For each, identify: (a) which organization authored it, (b) whether that organization is governmental or non-governmental, (c) whether compliance is mandatory or advisory, and (d) what underlying technical standards it references:\n\n• FIPS 140-3\n• CNSA 2.0\n• ETSI TS 103 744\n• NIS2 Directive\n• ANSSI PQC Position Paper\n\nUse the Body Classifier (Step 1) to verify your classifications, and the Organization Explorer (Step 2) to find the decision-making process and PQC outputs for each authoring organization.',
    },
  ]

  return (
    <div className="w-full space-y-6">
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-foreground mb-2">Standards Bodies — Exercises</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Apply what you learned in the workshop to these real-world scenarios. Use the Workshop tab
          tools to model your answers.
        </p>
        <div className="space-y-4">
          {exercises.map((exercise, idx) => (
            <div key={idx} className="glass-panel p-5 space-y-3">
              <h3 className="text-lg font-semibold text-foreground">{exercise.title}</h3>
              <p className="text-sm text-foreground/80 whitespace-pre-line">{exercise.prompt}</p>
              <div className="bg-muted/50 rounded-lg p-3 border border-border">
                <p className="text-xs text-muted-foreground italic">
                  Reference the Workshop steps listed in the prompt. Use the Organization Explorer
                  (Step 2) as your primary reference for organization details.
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

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

  const navigateToWorkshop = useCallback(() => {
    markStepComplete(MODULE_ID, activeTab)
    setActiveTab('workshop')
  }, [activeTab, markStepComplete])

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
              <div className="flex justify-between relative min-w-max sm:min-w-0">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border -z-10 hidden sm:block" />
                {PARTS.map((part, idx) => {
                  const Icon = part.icon
                  return (
                    <Button
                      variant="ghost"
                      key={part.id}
                      onClick={() => handlePartChange(idx)}
                      className={`flex flex-col items-center gap-2 group px-1 sm:px-2 ${
                        idx === currentPart ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors bg-background font-bold
                          ${
                            idx === currentPart
                              ? 'border-primary text-primary shadow-[0_0_15px_hsl(var(--primary)/0.3)]'
                              : idx < currentPart
                                ? 'border-status-success text-status-success'
                                : 'border-border text-muted-foreground'
                          }`}
                      >
                        <Icon size={18} />
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
              >
                &larr; Previous Step
              </Button>
              {currentPart === PARTS.length - 1 ? (
                <Button
                  variant="ghost"
                  onClick={() => markStepComplete(MODULE_ID, PARTS[currentPart].id)}
                  className="px-6 py-3 min-h-[44px] bg-accent text-accent-foreground font-bold rounded-lg hover:bg-accent/90 transition-colors"
                >
                  Complete Module
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  onClick={() => handlePartChange(currentPart + 1)}
                  className="px-6 py-3 min-h-[44px] bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Next Step &rarr;
                </Button>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="exercises">
          <ExercisesTab />
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
