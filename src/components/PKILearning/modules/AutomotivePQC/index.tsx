// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Trash2, LayoutGrid, Activity, ShieldCheck, Truck, Key, Calendar } from 'lucide-react'
import { AutomotivePQCIntroduction } from './components/AutomotivePQCIntroduction'
import { AutomotivePQCExercises, type WorkshopConfig } from './components/AutomotivePQCExercises'
import { VehicleArchitectureMapper } from './workshop/VehicleArchitectureMapper'
import { SensorDataIntegritySimulator } from './workshop/SensorDataIntegritySimulator'
import { SafetyCryptoAnalyzer } from './workshop/SafetyCryptoAnalyzer'
import { OTAOrchestrationPlanner } from './workshop/OTAOrchestrationPlanner'
import { CarKeyProtocolExplorer } from './workshop/CarKeyProtocolExplorer'
import { LifecycleMigrationRoadmap } from './workshop/LifecycleMigrationRoadmap'
import { useModuleStore } from '@/store/useModuleStore'
import { getModuleDeepLink, useSyncDeepLink } from '@/hooks/useModuleDeepLink'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ModuleReferencesTab } from '../../common/ModuleReferencesTab'
import { ModuleMigrateTab } from '../../common/ModuleMigrateTab'
import { ModuleVisualTab } from '../../common/ModuleVisualTab'
import { WorkshopStepHeader } from '../../common/WorkshopStepHeader'

const MODULE_ID = 'automotive-pqc'

const PARTS = [
  {
    id: 'vehicle-architecture-mapper',
    title: 'Step 1: Vehicle Architecture Mapper',
    description:
      'Explore domain-based and zonal E/E architectures, ECU zones, bus protocols, and per-zone PQC crypto requirements.',
    icon: LayoutGrid,
  },
  {
    id: 'sensor-data-integrity',
    title: 'Step 2: Sensor Data Integrity Simulator',
    description:
      'Compare signing throughput for LiDAR, radar, camera, and V2X sensors under real automotive data rates and latency budgets.',
    icon: Activity,
  },
  {
    id: 'safety-crypto-analyzer',
    title: 'Step 3: Safety-Crypto Analyzer',
    description:
      'Map ISO 26262 ASIL levels to crypto verification timing and evaluate PQC algorithm feasibility per safety function.',
    icon: ShieldCheck,
  },
  {
    id: 'ota-orchestration-planner',
    title: 'Step 4: OTA Orchestration Planner',
    description:
      'Plan multi-ECU firmware campaigns with dependency ordering, fleet sizing, and PQC signature bandwidth impact.',
    icon: Truck,
  },
  {
    id: 'car-key-protocol-explorer',
    title: 'Step 5: Car Key Protocol Explorer',
    description:
      'Step through CCC Digital Key 3.0 flows over NFC, BLE, and UWB with classical vs PQC size comparison.',
    icon: Key,
  },
  {
    id: 'lifecycle-migration-roadmap',
    title: 'Step 6: Lifecycle Migration Roadmap',
    description:
      'Generate a vehicle-lifecycle PQC migration timeline with regulatory milestones, HSM tiers, and CRQC exposure windows.',
    icon: Calendar,
  },
]

export const AutomotivePQCModule: React.FC = () => {
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
    if (confirm('Restart Automotive PQC Module?')) {
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
          <h1 className="text-3xl font-bold text-gradient">Automotive PQC</h1>
          <p className="text-muted-foreground mt-2">
            V2X PKI migration, sensor data integrity, ISO 26262 safety-crypto intersection, HSM
            lifecycle management, OTA orchestration, digital car keys, and 15-20 year vehicle
            crypto-agility.
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
          <AutomotivePQCIntroduction onNavigateToWorkshop={navigateToWorkshop} />
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
              {currentPart === 0 && <VehicleArchitectureMapper key={`vam-${configKey}`} />}
              {currentPart === 1 && <SensorDataIntegritySimulator key={`sdi-${configKey}`} />}
              {currentPart === 2 && <SafetyCryptoAnalyzer key={`sca-${configKey}`} />}
              {currentPart === 3 && <OTAOrchestrationPlanner key={`ota-${configKey}`} />}
              {currentPart === 4 && <CarKeyProtocolExplorer key={`ckp-${configKey}`} />}
              {currentPart === 5 && <LifecycleMigrationRoadmap key={`lmr-${configKey}`} />}
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
          <AutomotivePQCExercises
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
