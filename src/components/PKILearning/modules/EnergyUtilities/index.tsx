// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Trash2, Network, Factory, Key, AlertTriangle, Map } from 'lucide-react'
import { EnergyUtilitiesIntroduction } from './components/EnergyUtilitiesIntroduction'
import {
  EnergyUtilitiesExercises,
  type WorkshopConfig,
} from './components/EnergyUtilitiesExercises'
import { ProtocolSecurityAnalyzer } from './workshop/ProtocolSecurityAnalyzer'
import { SubstationMigrationPlanner } from './workshop/SubstationMigrationPlanner'
import { SmartMeterKeyManager } from './workshop/SmartMeterKeyManager'
import { SafetyRiskScorer } from './workshop/SafetyRiskScorer'
import { GridMigrationRoadmap } from './workshop/GridMigrationRoadmap'
import { useModuleStore } from '@/store/useModuleStore'
import { getModuleDeepLink, useSyncDeepLink } from '@/hooks/useModuleDeepLink'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ModuleReferencesTab } from '../../common/ModuleReferencesTab'
import { ModuleMigrateTab } from '../../common/ModuleMigrateTab'
import { ModuleVisualTab } from '../../common/ModuleVisualTab'
import { WorkshopStepHeader } from '../../common/WorkshopStepHeader'
import {
  DEFAULT_SUBSTATION,
  DEFAULT_FLEET,
  DEFAULT_UTILITY,
  type SubstationProfile,
  type SmartMeterFleetConfig,
  type UtilityProfile,
  type SafetyRiskResult,
} from './data/energyConstants'

const MODULE_ID = 'energy-utilities-pqc'

const PARTS = [
  {
    id: 'protocol-security-analyzer',
    title: 'Step 1: Protocol Analyzer',
    description:
      'Assess PQC readiness of energy protocols \u2014 IEC 61850, DNP3, Modbus, DLMS/COSEM.',
    icon: Network,
  },
  {
    id: 'substation-migration-planner',
    title: 'Step 2: Substation Planner',
    description:
      'Plan PQC migration for IEC 61850 substations across protection, control, and metering zones.',
    icon: Factory,
  },
  {
    id: 'smart-meter-key-manager',
    title: 'Step 3: Meter Key Manager',
    description:
      'Plan PQC key rotation for smart meter fleets of 1M\u201320M devices using DLMS/COSEM.',
    icon: Key,
  },
  {
    id: 'safety-risk-scorer',
    title: 'Step 4: Risk Scorer',
    description:
      'Score safety and environmental consequences of cryptographic failures in energy systems.',
    icon: AlertTriangle,
  },
  {
    id: 'grid-migration-roadmap',
    title: 'Step 5: Grid Roadmap',
    description:
      'Generate a utility-wide PQC migration roadmap with NERC CIP milestones and budget estimates.',
    icon: Map,
  },
]

export const EnergyUtilitiesModule: React.FC = () => {
  const deepLink = getModuleDeepLink({ maxStep: PARTS.length - 1 })
  const [activeTab, setActiveTab] = useState(deepLink.initialTab)
  const [currentPart, setCurrentPart] = useState(deepLink.initialStep)
  useSyncDeepLink(activeTab, currentPart)
  const [configKey, setConfigKey] = useState(0)
  const startTimeRef = useRef(0)
  const { updateModuleProgress, markStepComplete } = useModuleStore()

  // ── Shared state lifted from workshop steps ──────────────────────────────
  const [substationProfile, setSubstationProfile] = useState<SubstationProfile>({
    ...DEFAULT_SUBSTATION,
  })
  const [meterFleetConfig, setMeterFleetConfig] = useState<SmartMeterFleetConfig>({
    ...DEFAULT_FLEET,
  })
  const [utilityProfile, setUtilityProfile] = useState<UtilityProfile>({ ...DEFAULT_UTILITY })
  const [riskResults, setRiskResults] = useState<SafetyRiskResult[]>([])

  // ── Time tracking ────────────────────────────────────────────────────────
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

  // ── Tab change ───────────────────────────────────────────────────────────
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

  // ── Step navigation ──────────────────────────────────────────────────────
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

  // ── Step completion handler for workshop steps ───────────────────────────
  const handleStepComplete = useCallback(() => {
    const partIds = PARTS.map((p) => p.id)
    markStepComplete(MODULE_ID, partIds[currentPart], currentPart)
    if (currentPart < PARTS.length - 1) {
      setCurrentPart(currentPart + 1)
    }
  }, [currentPart, markStepComplete])

  // ── Reset ────────────────────────────────────────────────────────────────
  const handleReset = () => {
    if (confirm('Restart Energy & Utilities PQC module?')) {
      setSubstationProfile({ ...DEFAULT_SUBSTATION })
      setMeterFleetConfig({ ...DEFAULT_FLEET })
      setUtilityProfile({ ...DEFAULT_UTILITY })
      setRiskResults([])
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
          <h1 className="text-3xl font-bold text-gradient">Energy &amp; Utilities PQC</h1>
          <p className="text-muted-foreground mt-2">
            PQC migration for power grids and utilities: NERC CIP compliance, IEC 61850/62351
            substation security, DNP3/Modbus protocol hardening, smart meter key management at
            scale, and environmental/safety risk scoring.
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

        {/* ── Learn Tab ───────────────────────────────────────────────── */}
        <TabsContent value="learn">
          <EnergyUtilitiesIntroduction onNavigateToWorkshop={navigateToWorkshop} />
        </TabsContent>

        {/* ── Workshop Tab ────────────────────────────────────────────── */}

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

            {/* Step Progress */}
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
                <ProtocolSecurityAnalyzer
                  key={`protocol-${configKey}`}
                  onComplete={handleStepComplete}
                />
              )}
              {currentPart === 1 && (
                <SubstationMigrationPlanner
                  key={`substation-${configKey}`}
                  profile={substationProfile}
                  onProfileChange={setSubstationProfile}
                  onComplete={handleStepComplete}
                />
              )}
              {currentPart === 2 && (
                <SmartMeterKeyManager
                  key={`meter-${configKey}`}
                  config={meterFleetConfig}
                  onConfigChange={setMeterFleetConfig}
                  onComplete={handleStepComplete}
                />
              )}
              {currentPart === 3 && (
                <SafetyRiskScorer
                  key={`safety-${configKey}`}
                  riskResults={riskResults}
                  onRiskResultsChange={setRiskResults}
                  onComplete={handleStepComplete}
                />
              )}
              {currentPart === 4 && (
                <GridMigrationRoadmap
                  key={`roadmap-${configKey}`}
                  utilityProfile={utilityProfile}
                  onUtilityProfileChange={setUtilityProfile}
                  substationProfile={substationProfile}
                  meterFleetConfig={meterFleetConfig}
                  riskResults={riskResults}
                  onComplete={handleStepComplete}
                />
              )}
            </div>

            {/* Step Navigation */}
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

        {/* ── Exercises Tab ───────────────────────────────────────────── */}
        <TabsContent value="exercises">
          <EnergyUtilitiesExercises
            onNavigateToWorkshop={navigateToWorkshop}
            onSetWorkshopConfig={handleSetWorkshopConfig}
          />
        </TabsContent>

        {/* ── References Tab ──────────────────────────────────────────── */}
        <TabsContent value="references">
          <ModuleReferencesTab moduleId={MODULE_ID} />
        </TabsContent>

        {/* ── Tools Tab ───────────────────────────────────────────────── */}
        <TabsContent value="tools">
          <ModuleMigrateTab moduleId={MODULE_ID} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
