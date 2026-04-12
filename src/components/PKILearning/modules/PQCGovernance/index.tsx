// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Trash2, Users, FileText, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Introduction } from './components/Introduction'
import { RACIBuilder } from './components/RACIBuilder'
import { PolicyTemplateGenerator } from './components/PolicyTemplateGenerator'
import { KPIDashboardBuilder } from './components/KPIDashboardBuilder'
import { useModuleStore } from '@/store/useModuleStore'
import { getModuleDeepLink, useSyncDeepLink } from '@/hooks/useModuleDeepLink'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ModuleReferencesTab } from '../../common/ModuleReferencesTab'
import { ModuleMigrateTab } from '../../common/ModuleMigrateTab'
import { ModuleVisualTab } from '../../common/ModuleVisualTab'
import { WorkshopStepHeader } from '../../common/WorkshopStepHeader'
import { GlossaryAutoWrap } from '@/components/PKILearning/common/GlossaryAutoWrap'

const MODULE_ID = 'pqc-governance'

const PARTS = [
  {
    id: 'raci-builder',
    title: 'Step 1: RACI Matrix',
    description: 'Define roles and responsibilities for your PQC migration program.',
    icon: Users,
  },
  {
    id: 'policy-generator',
    title: 'Step 2: Policy Generator',
    description: 'Generate PQC policy templates customized to your organization.',
    icon: FileText,
  },
  {
    id: 'kpi-dashboard',
    title: 'Step 3: KPI Dashboard',
    description: 'Design a governance KPI dashboard to track your PQC migration progress.',
    icon: BarChart3,
  },
]

interface GovernanceExercise {
  id: string
  title: string
  scenario: string
  question: string
  badge: string
  badgeColor: string
}

const EXERCISES: GovernanceExercise[] = [
  {
    id: 'governance-model',
    title: '1. Centralized vs Federated Governance',
    scenario:
      'Your organization has 12 business units across 4 countries. The CISO wants a single PQC policy, but regional teams argue that local compliance requirements (ANSSI in France, BSI in Germany, NIST in the US) demand autonomy. Two business units have already started independent PQC pilots.',
    question:
      'Design a governance model. Should PQC governance be centralized, federated, or hybrid? What decision rights belong at each level?',
    badge: 'Governance Model',
    badgeColor: 'bg-primary/20 text-primary border-primary/50',
  },
  {
    id: 'policy-exception',
    title: '2. Policy Exception Handling',
    scenario:
      'Your newly-published PQC policy mandates ML-KEM-768 for all key exchange by Q4 2027. However, your largest revenue-generating application depends on a vendor library that only supports ECDH. The vendor promises PQC support "in the next major release" but won\'t commit to a date. The compliance deadline is 14 months away.',
    question:
      'Draft an exception process. What criteria should the governance board use to evaluate this request? What compensating controls would you require?',
    badge: 'Exception Process',
    badgeColor: 'bg-warning/20 text-warning border-warning/50',
  },
  {
    id: 'kpi-reporting',
    title: '3. Board-Level KPI Reporting',
    scenario:
      'The board has asked for a quarterly PQC migration status update. Your migration program spans 200+ systems, 15 vendor dependencies, and 3 compliance frameworks. The board meeting is 45 minutes and PQC gets a 10-minute slot. The CFO wants cost metrics, the CRO wants risk reduction, and the CTO wants technical progress.',
    question:
      'Design a single-page KPI dashboard for the board. Which 4-6 metrics would you prioritize? How would you visualize progress vs. risk?',
    badge: 'Board Reporting',
    badgeColor: 'bg-secondary/20 text-secondary border-secondary/50',
  },
]

const GovernanceExercises: React.FC = () => {
  return (
    <div className="space-y-6 w-full">
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient mb-2">Governance Exercises</h2>
        <p className="text-muted-foreground text-sm">
          Work through these real-world governance scenarios. Each exercise presents a situation
          you&apos;re likely to encounter when establishing PQC governance in an enterprise.
        </p>
      </div>

      <div className="space-y-4">
        {EXERCISES.map((exercise) => (
          <div key={exercise.id} className="glass-panel p-5">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-lg font-bold text-foreground">{exercise.title}</h3>
              <span
                className={`text-[10px] px-2 py-0.5 rounded border font-bold ${exercise.badgeColor}`}
              >
                {exercise.badge}
              </span>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                  Scenario
                </p>
                <p className="text-sm text-foreground/80">{exercise.scenario}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 border border-primary/20">
                <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">
                  Your Task
                </p>
                <p className="text-sm text-foreground/90">{exercise.question}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export const PQCGovernanceModule: React.FC = () => {
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
    if (confirm('Restart PQC Governance & Policy Module?')) {
      setCurrentPart(0)
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
          <h1 className="text-3xl font-bold text-gradient">PQC Governance &amp; Policy</h1>
          <p className="text-muted-foreground mt-2">
            Establish governance frameworks, define roles, and create policies that guide your
            organization&apos;s PQC transition.
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
          <TabsTrigger value="tools">Tools & Products</TabsTrigger>
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
              <Button variant="destructive" size="sm" onClick={handleReset} className="gap-2">
                <Trash2 size={16} />
                Reset
              </Button>
            </div>

            {/* Part Progress Steps */}
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
                      className={`flex flex-col items-center gap-1 group px-1 sm:px-2 py-1 h-auto ${idx === currentPart ? 'text-primary' : 'text-muted-foreground'}`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors bg-background font-bold
                          ${
                            idx === currentPart
                              ? 'border-primary text-primary shadow-[0_0_15px_hsl(var(--primary)/0.3)]'
                              : idx < currentPart
                                ? 'border-success text-success'
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
              {currentPart === 0 && <RACIBuilder />}
              {currentPart === 1 && <PolicyTemplateGenerator />}
              {currentPart === 2 && <KPIDashboardBuilder />}
            </div>

            {/* Part Navigation */}
            <div className="flex flex-col sm:flex-row justify-between gap-3">
              <Button
                variant="outline"
                onClick={() => handlePartChange(Math.max(0, currentPart - 1))}
                disabled={currentPart === 0}
                className="px-6 py-3 min-h-[44px]"
              >
                &larr; Previous Step
              </Button>
              {currentPart === PARTS.length - 1 ? (
                <Button
                  variant="gradient"
                  onClick={() => markStepComplete(MODULE_ID, PARTS[currentPart].id)}
                  className="px-6 py-3 min-h-[44px]"
                >
                  Complete Module
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  onClick={() => handlePartChange(currentPart + 1)}
                  className="px-6 py-3 min-h-[44px]"
                >
                  Next Step &rarr;
                </Button>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="exercises">
          <GovernanceExercises />
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
