// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Trash2, Globe, CheckSquare, CalendarRange } from 'lucide-react'
import { Introduction } from './components/Introduction'
import { JurisdictionMapper } from './components/JurisdictionMapper'
import { AuditReadinessChecklist } from './components/AuditReadinessChecklist'
import { ComplianceTimelineBuilder } from './components/ComplianceTimelineBuilder'
import { useModuleStore } from '@/store/useModuleStore'
import { getModuleDeepLink, useSyncDeepLink } from '@/hooks/useModuleDeepLink'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ModuleReferencesTab } from '../../common/ModuleReferencesTab'
import { ModuleMigrateTab } from '../../common/ModuleMigrateTab'
import { ModuleVisualTab } from '../../common/ModuleVisualTab'
import { WorkshopStepHeader } from '../../common/WorkshopStepHeader'
import { GlossaryAutoWrap } from '@/components/PKILearning/common/GlossaryAutoWrap'

const MODULE_ID = 'compliance-strategy'

const PARTS = [
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
]

function ExercisesTab() {
  const exercises = [
    {
      title: 'Scenario: Multi-Jurisdiction Financial Institution',
      prompt:
        'Your bank operates in the US, EU, and Singapore. CNSA 2.0 requires PQC for NSS by 2030, ETSI has hybrid recommendations, and MAS (Singapore) is monitoring NIST standards. Map the overlapping requirements and identify the earliest binding deadline. What compliance conflicts exist between jurisdictions?',
    },
    {
      title: 'Scenario: Government Contractor Audit',
      prompt:
        'Your company supplies software to the US DoD and must comply with CMMC Level 3 and CNSA 2.0. An audit is scheduled for Q3 2027. Build an audit readiness checklist covering cryptographic inventory, policy documentation, and technical controls. Identify the top 5 gaps most auditors flag.',
    },
    {
      title: 'Scenario: Healthcare PQC Compliance Timeline',
      prompt:
        'A hospital network must protect patient records (30-year retention) while complying with HIPAA and the upcoming NIST deprecation of RSA/ECC by 2030. Build a compliance timeline that includes assessment, hybrid deployment, and full PQC migration phases. Where does the HNDL risk window overlap with compliance deadlines?',
    },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-foreground mb-2">Compliance Strategy Exercises</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Apply what you learned in the workshop to these real-world compliance scenarios. Use the
          Workshop tab tools to model your answers.
        </p>
        <div className="space-y-4">
          {exercises.map((exercise, idx) => (
            <div key={idx} className="glass-panel p-5 space-y-3">
              <h3 className="text-lg font-semibold text-foreground">{exercise.title}</h3>
              <p className="text-sm text-foreground/80">{exercise.prompt}</p>
              <div className="bg-muted/50 rounded-lg p-3 border border-border">
                <p className="text-xs text-muted-foreground italic">
                  Use the Jurisdiction Mapper (Step 1), Audit Readiness Checklist (Step 2), and
                  Compliance Timeline Builder (Step 3) in the Workshop tab to model your response.
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export const ComplianceStrategyModule: React.FC = () => {
  const deepLink = getModuleDeepLink({ maxStep: PARTS.length - 1 })
  const [activeTab, setActiveTab] = useState(deepLink.initialTab)
  const [currentPart, setCurrentPart] = useState(deepLink.initialStep)
  useSyncDeepLink(activeTab, currentPart)
  const [configKey, setConfigKey] = useState(0)
  const [selectedJurisdictions, setSelectedJurisdictions] = useState<string[]>([])
  const [dismissedFrameworks, setDismissedFrameworks] = useState<Set<string>>(new Set())
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
    if (confirm('Restart Compliance & Regulatory Strategy Module?')) {
      setCurrentPart(0)
      setConfigKey((prev) => prev + 1)
      setSelectedJurisdictions([])
      setDismissedFrameworks(new Set())
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
          <h1 className="text-3xl font-bold text-gradient">Compliance &amp; Regulatory Strategy</h1>
          <p className="text-muted-foreground mt-2">
            Navigate the complex landscape of PQC compliance requirements across jurisdictions and
            frameworks.
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
              {currentPart === 0 && (
                <JurisdictionMapper
                  key={`jurisdiction-${configKey}`}
                  selectedJurisdictions={selectedJurisdictions}
                  onJurisdictionsChange={setSelectedJurisdictions}
                  dismissedFrameworks={dismissedFrameworks}
                  onDismissedFrameworksChange={setDismissedFrameworks}
                />
              )}
              {currentPart === 1 && <AuditReadinessChecklist key={`audit-${configKey}`} />}
              {currentPart === 2 && (
                <ComplianceTimelineBuilder
                  key={`timeline-${configKey}`}
                  selectedJurisdictions={selectedJurisdictions}
                  dismissedFrameworkIds={dismissedFrameworks}
                />
              )}
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
          <ExercisesTab />
        </TabsContent>

        <TabsContent value="references">
          <ModuleReferencesTab moduleId="compliance-strategy" />
        </TabsContent>
        <TabsContent value="tools">
          <ModuleMigrateTab moduleId={MODULE_ID} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
