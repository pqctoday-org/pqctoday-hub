// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Trash2, Clock, ClipboardList, Grid3X3 } from 'lucide-react'
import { Introduction } from './components/Introduction'
import { CRQCScenarioPlanner } from './components/CRQCScenarioPlanner'
import { RiskRegisterBuilder } from './components/RiskRegisterBuilder'
import { RiskHeatmapGenerator } from './components/RiskHeatmapGenerator'
import { useModuleStore } from '@/store/useModuleStore'
import { getModuleDeepLink, useSyncDeepLink } from '@/hooks/useModuleDeepLink'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ModuleReferencesTab } from '../../common/ModuleReferencesTab'
import { ModuleMigrateTab } from '../../common/ModuleMigrateTab'
import { ModuleVisualTab } from '../../common/ModuleVisualTab'
import { WorkshopStepHeader } from '../../common/WorkshopStepHeader'
import { GlossaryAutoWrap } from '@/components/PKILearning/common/GlossaryAutoWrap'

const MODULE_ID = 'pqc-risk-management'

const PARTS = [
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
    description: 'Build a quantum risk register for your organization\u2019s cryptographic assets.',
    icon: ClipboardList,
  },
  {
    id: 'risk-heatmap',
    title: 'Step 3: Risk Heatmap',
    description:
      'Assign risk treatments, model residual risk, and prioritize your PQC migration order.',
    icon: Grid3X3,
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

function ExercisesTab() {
  const exercises = [
    {
      title: 'Scenario: Financial Services HNDL',
      prompt:
        'Your bank stores wire transfer records encrypted with RSA-2048. Records must be retained for 7 years. A CRQC is estimated to arrive in 2034. Calculate the HNDL exposure window and recommend a migration timeline.',
    },
    {
      title: 'Scenario: Healthcare Data at Risk',
      prompt:
        'A hospital system uses ECDSA P-256 for signing electronic health records that must remain valid for 30 years. Identify the risk category, estimate a risk score (1\u201325), and propose a mitigation strategy.',
    },
    {
      title: 'Scenario: Government Compliance Deadline',
      prompt:
        'Your agency must comply with CNSA 2.0 by 2030. You have 200+ systems using RSA-3072 and AES-128. Build a prioritized risk register with at least 4 entries covering different asset types and threat vectors.',
    },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-foreground mb-2">Risk Management Exercises</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Apply what you learned in the workshop to these real-world scenarios. Use the Workshop tab
          tools to model your answers.
        </p>
        <div className="space-y-4">
          {exercises.map((exercise, idx) => (
            <div key={idx} className="glass-panel p-5 space-y-3">
              <h3 className="text-lg font-semibold text-foreground">{exercise.title}</h3>
              <p className="text-sm text-foreground/80">{exercise.prompt}</p>
              <div className="bg-muted/50 rounded-lg p-3 border border-border">
                <p className="text-xs text-muted-foreground italic">
                  Use the CRQC Scenario Planner (Step 1) and Risk Register Builder (Step 2) in the
                  Workshop tab to model your response.
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export const PQCRiskManagementModule: React.FC = () => {
  const deepLink = getModuleDeepLink({ maxStep: PARTS.length - 1 })
  const [activeTab, setActiveTab] = useState(deepLink.initialTab)
  const [currentPart, setCurrentPart] = useState(deepLink.initialStep)
  useSyncDeepLink(activeTab, currentPart)
  const [configKey, setConfigKey] = useState(0)
  const [riskEntries, setRiskEntries] = useState<RiskEntry[]>([])
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
    if (confirm('Restart PQC Risk Management Module?')) {
      setCurrentPart(0)
      setRiskEntries([])
      setConfigKey((prev) => prev + 1)
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
          <h1 className="text-3xl font-bold text-gradient">PQC Risk Management</h1>
          <p className="text-muted-foreground mt-2">
            Identify, quantify, and prioritize quantum computing risks to your organization&rsquo;s
            cryptographic infrastructure.
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
              {currentPart === 0 && <CRQCScenarioPlanner key={`crqc-${configKey}`} />}
              {currentPart === 1 && (
                <RiskRegisterBuilder
                  key={`register-${configKey}`}
                  riskEntries={riskEntries}
                  onRiskEntriesChange={setRiskEntries}
                />
              )}
              {currentPart === 2 && (
                <RiskHeatmapGenerator key={`heatmap-${configKey}`} riskEntries={riskEntries} />
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
          <ModuleReferencesTab moduleId="pqc-risk-management" />
        </TabsContent>
        <TabsContent value="tools">
          <ModuleMigrateTab moduleId={MODULE_ID} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
