// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Trash2, Calculator, ShieldAlert, Presentation } from 'lucide-react'
import { Introduction } from './components/Introduction'
import { ROICalculator } from './components/ROICalculator'
import { BreachScenarioSimulator } from './components/BreachScenarioSimulator'
import { BoardPitchBuilder } from './components/BoardPitchBuilder'
import { useModuleStore } from '@/store/useModuleStore'
import { getModuleDeepLink, useSyncDeepLink } from '@/hooks/useModuleDeepLink'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ModuleReferencesTab } from '../../common/ModuleReferencesTab'
import { ModuleMigrateTab } from '../../common/ModuleMigrateTab'
import { ModuleVisualTab } from '../../common/ModuleVisualTab'
import { WorkshopStepHeader } from '../../common/WorkshopStepHeader'

const MODULE_ID = 'pqc-business-case'

const PARTS = [
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
]

interface BusinessCaseExercise {
  id: string
  title: string
  scenario: string
  prompt: string
  badge: string
  badgeColor: string
}

const EXERCISES: BusinessCaseExercise[] = [
  {
    id: 'cost-justification',
    title: '1. Cost Justification for CFO',
    scenario:
      'Your CFO asks why the organization should invest $2M in PQC migration when "quantum computers are years away." Prepare a cost justification using breach cost data and compliance deadlines.',
    prompt:
      'Use the ROI Calculator (Step 1) to model the total cost of inaction vs. proactive migration. Consider HNDL risk for data already being harvested today.',
    badge: 'Financial',
    badgeColor: 'bg-primary/20 text-primary border-primary/50',
  },
  {
    id: 'regulatory-urgency',
    title: '2. Regulatory Deadline Pressure',
    scenario:
      'Your organization operates in a regulated industry (finance or healthcare) and your country has announced mandatory PQC deadlines. Build a case showing the cost of non-compliance vs. early adoption.',
    prompt:
      'Use the Breach Scenario Simulator (Step 2) to model quantum-amplified breach costs including regulatory fines. Compare with the migration investment required.',
    badge: 'Compliance',
    badgeColor: 'bg-status-warning/20 text-status-warning border-status-warning/50',
  },
  {
    id: 'board-presentation',
    title: '3. Board Presentation Package',
    scenario:
      'You have 10 minutes at the next board meeting to secure PQC migration funding. Create a complete executive brief that covers risk, cost-benefit, timeline, and recommended actions.',
    prompt:
      'Complete all three workshop steps, then use the Board Pitch Builder (Step 3) to generate a polished board memo. Export it as a document you could present.',
    badge: 'Executive',
    badgeColor: 'bg-secondary/20 text-secondary border-secondary/50',
  },
]

export const PQCBusinessCaseModule: React.FC = () => {
  const deepLink = getModuleDeepLink({ maxStep: PARTS.length - 1 })
  const [activeTab, setActiveTab] = useState(deepLink.initialTab)
  const [currentPart, setCurrentPart] = useState(deepLink.initialStep)
  useSyncDeepLink(activeTab, currentPart)
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
      const elapsedMins = elapsedMs / 60000
      if (elapsedMins > 0) {
        const current = useModuleStore.getState().modules[MODULE_ID]
        updateModuleProgress(MODULE_ID, {
          timeSpent: (current?.timeSpent || 0) + elapsedMins,
        })
      }
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
    if (confirm('Restart PQC Business Case Module?')) {
      setCurrentPart(0)
      startTimeRef.current = Date.now()
      updateModuleProgress(MODULE_ID, {
        status: 'in-progress',
        completedSteps: [],
        timeSpent: 0,
      })
    }
  }

  const handleExerciseNavigate = useCallback(
    (step: number) => {
      setCurrentPart(step)
      markStepComplete(MODULE_ID, activeTab)
      setActiveTab('workshop')
    },
    [activeTab, markStepComplete]
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Building the PQC Business Case</h1>
          <p className="text-muted-foreground mt-2">
            Quantify costs, model ROI, and build compelling investment cases for post-quantum
            cryptography migration.
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
          <Introduction onNavigateToWorkshop={navigateToWorkshop} />
        </TabsContent>

        <TabsContent value="visual">
          <ModuleVisualTab moduleId={MODULE_ID} />
        </TabsContent>

        <TabsContent value="workshop">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex justify-end">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-3 py-2 bg-destructive/10 text-destructive rounded hover:bg-destructive/20 transition-colors text-sm border border-destructive/20"
              >
                <Trash2 size={16} />
                Reset
              </button>
            </div>

            {/* Part Progress Steps */}
            <div className="overflow-x-auto px-2 sm:px-0">
              <div className="flex justify-between relative min-w-max sm:min-w-0">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border -z-10 hidden sm:block" />

                {PARTS.map((part, idx) => {
                  const Icon = part.icon
                  return (
                    <button
                      key={part.id}
                      onClick={() => handlePartChange(idx)}
                      className={`flex flex-col items-center gap-2 group px-1 sm:px-2 ${idx === currentPart ? 'text-primary' : 'text-muted-foreground'}`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors bg-background font-bold
                          ${
                            idx === currentPart
                              ? 'border-primary text-primary shadow-[0_0_15px_hsl(var(--primary)/0.3)]'
                              : idx < currentPart
                                ? 'border-success text-success'
                                : 'border-border text-muted-foreground'
                          }`}
                      >
                        <Icon size={18} />
                      </div>
                      <span className="text-sm font-medium hidden md:block">
                        {part.title.split(':')[0]}
                      </span>
                    </button>
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
              {currentPart === 0 && <ROICalculator />}
              {currentPart === 1 && <BreachScenarioSimulator />}
              {currentPart === 2 && <BoardPitchBuilder />}
            </div>

            {/* Part Navigation */}
            <div className="flex flex-col sm:flex-row justify-between gap-3">
              <button
                onClick={() => handlePartChange(Math.max(0, currentPart - 1))}
                disabled={currentPart === 0}
                className="px-6 py-3 min-h-[44px] rounded-lg border border-border hover:bg-muted disabled:opacity-50 transition-colors text-foreground"
              >
                &larr; Previous Step
              </button>
              {currentPart === PARTS.length - 1 ? (
                <button
                  onClick={() => markStepComplete(MODULE_ID, PARTS[currentPart].id)}
                  className="px-6 py-3 min-h-[44px] bg-accent text-accent-foreground font-bold rounded-lg hover:bg-accent/90 transition-colors"
                >
                  Complete Module
                </button>
              ) : (
                <button
                  onClick={() => handlePartChange(currentPart + 1)}
                  className="px-6 py-3 min-h-[44px] bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Next Step &rarr;
                </button>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="exercises">
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="glass-panel p-6">
              <h2 className="text-xl font-bold text-gradient mb-2">Business Case Exercises</h2>
              <p className="text-muted-foreground text-sm">
                Work through these scenarios to practice building PQC investment cases. Each
                exercise guides you through the workshop tools &mdash; click &quot;Go to
                Workshop&quot; to begin.
              </p>
            </div>

            <div className="space-y-4">
              {EXERCISES.map((exercise) => (
                <div key={exercise.id} className="glass-panel p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold text-foreground">{exercise.title}</h3>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded border font-bold ${exercise.badgeColor}`}
                        >
                          {exercise.badge}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/80 mb-2">{exercise.scenario}</p>
                      <p className="text-xs text-muted-foreground">
                        <strong>How to approach:</strong> {exercise.prompt}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        const stepMap: Record<string, number> = {
                          'cost-justification': 0,
                          'regulatory-urgency': 1,
                          'board-presentation': 2,
                        }
                        handleExerciseNavigate(stepMap[exercise.id] ?? 0)
                      }}
                      className="px-4 py-2 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors text-sm shrink-0"
                    >
                      Go to Workshop
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
