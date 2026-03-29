// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Trash2, Radio, Satellite, ShieldCheck, Plane, Scale, Rocket } from 'lucide-react'
import { AerospaceIntroduction } from './components/AerospaceIntroduction'
import { AerospaceExercises, type WorkshopConfig } from './components/AerospaceExercises'
import { AvionicsProtocolAnalyzer } from './workshop/AvionicsProtocolAnalyzer'
import { SatelliteLinkBudgetCalculator } from './workshop/SatelliteLinkBudgetCalculator'
import { CertificationImpactAnalyzer } from './workshop/CertificationImpactAnalyzer'
import { FleetInteroperabilityMatrix } from './workshop/FleetInteroperabilityMatrix'
import { ExportControlClassifier } from './workshop/ExportControlClassifier'
import { MissionCryptoLifecyclePlanner } from './workshop/MissionCryptoLifecyclePlanner'
import { useModuleStore } from '@/store/useModuleStore'
import { getModuleDeepLink, useSyncDeepLink } from '@/hooks/useModuleDeepLink'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ModuleReferencesTab } from '../../common/ModuleReferencesTab'
import { ModuleMigrateTab } from '../../common/ModuleMigrateTab'
import { ModuleVisualTab } from '../../common/ModuleVisualTab'
import { WorkshopStepHeader } from '../../common/WorkshopStepHeader'
import { GlossaryAutoWrap } from '@/components/PKILearning/common/GlossaryAutoWrap'

const MODULE_ID = 'aerospace-pqc'

const PARTS = [
  {
    id: 'avionics-protocol-analyzer',
    title: 'Step 1: Avionics Protocol Analyzer',
    description:
      'Evaluate PQC signature and key exchange overhead against avionics communication protocol message limits — ACARS, CPDLC, ADS-B, ARINC 429/664, MIL-STD-1553, and Link 16.',
    icon: Radio,
  },
  {
    id: 'satellite-link-budget',
    title: 'Step 2: Satellite Link Budget Calculator',
    description:
      'Configure satellite mission profiles across LEO, MEO, GEO, and HEO orbits. Calculate PQC bandwidth overhead, handshake latency, and SEU-adjusted key refresh intervals.',
    icon: Satellite,
  },
  {
    id: 'certification-impact-analyzer',
    title: 'Step 3: Certification Impact Analyzer',
    description:
      'Estimate DO-178C recertification cost, timeline, and MC/DC test case explosion for adding PQC to avionics systems at each Design Assurance Level.',
    icon: ShieldCheck,
  },
  {
    id: 'fleet-interoperability-matrix',
    title: 'Step 4: Fleet Interoperability Matrix',
    description:
      'Build a mixed-generation fleet and visualize PQC data link interoperability — native, gateway-mediated, or legacy unprotected.',
    icon: Plane,
  },
  {
    id: 'export-control-classifier',
    title: 'Step 5: Export Control Classifier',
    description:
      'Classify PQC-equipped aerospace products under ITAR, EAR, and Wassenaar regimes for different export destinations.',
    icon: Scale,
  },
  {
    id: 'mission-crypto-lifecycle',
    title: 'Step 6: Mission Crypto Lifecycle Planner',
    description:
      'Build a multi-decade crypto lifecycle plan from design through decommission for aircraft, satellites, and UAVs.',
    icon: Rocket,
  },
]

export const AerospacePQCModule: React.FC = () => {
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

  const handleSetWorkshopConfig = useCallback((config: WorkshopConfig) => {
    setCurrentPart(config.step)
    setConfigKey((prev) => prev + 1)
  }, [])

  const handlePartChange = useCallback(
    (newPart: number) => {
      const partIds = PARTS.map((p) => p.id)
      if (newPart > currentPart) {
        markStepComplete(MODULE_ID, partIds[currentPart], currentPart)
      }
      setCurrentPart(newPart)
    },
    [currentPart, markStepComplete]
  )

  const handleReset = () => {
    if (confirm('Restart Aerospace PQC Module?')) {
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
          <h1 className="text-3xl font-bold text-gradient">Aerospace PQC</h1>
          <p className="text-muted-foreground mt-2">
            Rad-hardened avionics, satellite link budgets, DO-326A certification, ITAR/EAR export
            controls, and multi-decade fleet interoperability across ground, airborne, and space
            segments.
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
          <AerospaceIntroduction onNavigateToWorkshop={navigateToWorkshop} />
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
              {currentPart === 0 && <AvionicsProtocolAnalyzer key={`protocol-${configKey}`} />}
              {currentPart === 1 && (
                <SatelliteLinkBudgetCalculator key={`satellite-${configKey}`} />
              )}
              {currentPart === 2 && (
                <CertificationImpactAnalyzer key={`certification-${configKey}`} />
              )}
              {currentPart === 3 && <FleetInteroperabilityMatrix key={`fleet-${configKey}`} />}
              {currentPart === 4 && <ExportControlClassifier key={`export-${configKey}`} />}
              {currentPart === 5 && (
                <MissionCryptoLifecyclePlanner key={`lifecycle-${configKey}`} />
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
          <AerospaceExercises
            onNavigateToWorkshop={navigateToWorkshop}
            onSetWorkshopConfig={handleSetWorkshopConfig}
          />
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
