// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Trash2, ClipboardCheck, ScrollText, Network, Package } from 'lucide-react'
import { Introduction } from './components/Introduction'
import { InfrastructureSelector } from './components/InfrastructureSelector'
import { VendorScorecardBuilder } from './components/VendorScorecardBuilder'
import { ContractClauseGenerator } from './components/ContractClauseGenerator'
import { SupplyChainRiskMatrix } from './components/SupplyChainRiskMatrix'
import { useModuleStore } from '@/store/useModuleStore'
import { getModuleDeepLink, useSyncDeepLink } from '@/hooks/useModuleDeepLink'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ModuleReferencesTab } from '../../common/ModuleReferencesTab'
import { ModuleMigrateTab } from '../../common/ModuleMigrateTab'
import { ModuleVisualTab } from '../../common/ModuleVisualTab'
import { WorkshopStepHeader } from '../../common/WorkshopStepHeader'

const MODULE_ID = 'vendor-risk'

const PARTS = [
  {
    id: 'infrastructure-selector',
    title: 'Step 1: Your Infrastructure',
    description: 'Select the products in your infrastructure from the Migrate catalog.',
    icon: Package,
  },
  {
    id: 'vendor-scorecard',
    title: 'Step 2: Vendor Scorecard',
    description: 'Score your vendors on PQC readiness dimensions.',
    icon: ClipboardCheck,
  },
  {
    id: 'contract-clauses',
    title: 'Step 3: Contract Clauses',
    description: 'Generate PQC-ready contract clauses for vendor agreements.',
    icon: ScrollText,
  },
  {
    id: 'supply-chain-matrix',
    title: 'Step 4: Supply Chain Matrix',
    description: 'Map vendor dependencies across your infrastructure layers.',
    icon: Network,
  },
]

function ExercisesTab() {
  const exercises = [
    {
      title: 'Scenario: Critical Vendor Without PQC Roadmap',
      prompt:
        'Your organization relies on a TLS termination appliance vendor that has no published PQC roadmap. The vendor provides FIPS 140-3 validated modules but only supports classical algorithms. You need to present a risk assessment to leadership and draft contract language requiring PQC readiness by 2027. Use the Vendor Scorecard (Step 1) to score this vendor and the Contract Clause Generator (Step 2) to draft the requirements.',
    },
    {
      title: 'Scenario: Supply Chain Crypto Dependency Mapping',
      prompt:
        'Your enterprise uses 40+ software products across 7 infrastructure layers. A recent audit revealed that 60% of products lack CBOM delivery capability and only 25% support hybrid PQC modes. Use the Supply Chain Risk Matrix (Step 3) to visualize your exposure, then identify the 3 highest-risk infrastructure layers and propose a prioritized vendor engagement plan.',
    },
    {
      title: 'Scenario: Multi-Vendor FIPS Validation Gap',
      prompt:
        'Your compliance team discovered that several vendors claim "FIPS compliance" but only have FIPS 140-2 validation (not 140-3). NIST stopped accepting new FIPS 140-2 validation requests in September 2021, making FIPS 140-3 the only path for new CMVP certifications. You need to audit your vendor portfolio and replace FIPS 140-2-only products in critical roles. Score at least 3 vendors using the Vendor Scorecard and generate contract clauses that distinguish between FIPS 140-2 and 140-3 requirements.',
    },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-foreground mb-2">
          Vendor &amp; Supply Chain Risk Exercises
        </h2>
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
                  Use the Vendor Scorecard (Step 1), Contract Clause Generator (Step 2), and Supply
                  Chain Matrix (Step 3) in the Workshop tab to model your response.
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export const VendorRiskModule: React.FC = () => {
  const deepLink = getModuleDeepLink({ maxStep: PARTS.length - 1 })
  const [activeTab, setActiveTab] = useState(deepLink.initialTab)
  const [currentPart, setCurrentPart] = useState(deepLink.initialStep)
  useSyncDeepLink(activeTab, currentPart)
  const [configKey, setConfigKey] = useState(0)
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
    if (confirm('Restart Vendor & Supply Chain Risk Module?')) {
      setCurrentPart(0)
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
          <h1 className="text-3xl font-bold text-gradient">Vendor &amp; Supply Chain Risk</h1>
          <p className="text-muted-foreground mt-2">
            Assess vendor PQC readiness, build scorecards, and manage supply chain cryptographic
            risk.
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
              {currentPart === 0 && <InfrastructureSelector key={`selector-${configKey}`} />}
              {currentPart === 1 && <VendorScorecardBuilder key={`scorecard-${configKey}`} />}
              {currentPart === 2 && <ContractClauseGenerator key={`contract-${configKey}`} />}
              {currentPart === 3 && <SupplyChainRiskMatrix key={`matrix-${configKey}`} />}
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
          <ModuleReferencesTab moduleId="vendor-risk" />
        </TabsContent>
        <TabsContent value="tools">
          <ModuleMigrateTab moduleId={MODULE_ID} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
