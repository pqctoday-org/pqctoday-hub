// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Trash2, Map, Clock, Container, Shield, Activity, GitBranch } from 'lucide-react'
import { Introduction } from './components/Introduction'
import { PlatformEngExercises, type WorkshopConfig } from './components/PlatformEngExercises'
import { PipelineCryptoInventory } from './workshop/PipelineCryptoInventory'
import { QuantumThreatTimeline } from './workshop/QuantumThreatTimeline'
import { ContainerSigningMigration } from './workshop/ContainerSigningMigration'
import { PolicyAsCodeEnforcer } from './workshop/PolicyAsCodeEnforcer'
import { CryptoPostureMonitor } from './workshop/CryptoPostureMonitor'
import { PlatformMigrationPlanner } from './workshop/PlatformMigrationPlanner'
import { useModuleStore } from '@/store/useModuleStore'
import { getModuleDeepLink, useSyncDeepLink } from '@/hooks/useModuleDeepLink'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ModuleReferencesTab } from '../../common/ModuleReferencesTab'
import { ModuleMigrateTab } from '../../common/ModuleMigrateTab'
import { ModuleVisualTab } from '../../common/ModuleVisualTab'
import { WorkshopStepHeader } from '../../common/WorkshopStepHeader'
import { GlossaryAutoWrap } from '@/components/PKILearning/common/GlossaryAutoWrap'
import { Button } from '@/components/ui/button'

const MODULE_ID = 'platform-eng-pqc'

const PARTS = [
  {
    id: 'pipeline-crypto-inventory',
    title: 'Step 1: Pipeline Crypto Inventory',
    description:
      'Map every cryptographic primitive embedded in your CI/CD pipeline from source control to runtime. Identify HNDL exposure per stage.',
    icon: Map,
  },
  {
    id: 'quantum-threat-timeline',
    title: 'Step 2: Quantum Threat Timeline',
    description:
      'Model HNDL risk for each pipeline asset under different CRQC arrival scenarios. Understand why short-lived certs do not eliminate harvest risk.',
    icon: Clock,
  },
  {
    id: 'container-signing-migration',
    title: 'Step 3: Container Signing Migration',
    description:
      'Compare OCI artifact signing tools by PQC readiness. Walk through the ECDSA → ML-DSA migration path for cosign and Notation.',
    icon: Container,
  },
  {
    id: 'policy-as-code-enforcer',
    title: 'Step 4: Policy-as-Code Enforcer',
    description:
      'OPA and Kyverno rules that block quantum-vulnerable algorithm OIDs at Kubernetes admission time. Maps to SLSA supply chain levels.',
    icon: Shield,
  },
  {
    id: 'crypto-posture-monitor',
    title: 'Step 5: Crypto Posture Monitor',
    description:
      'Four-panel monitor: Prometheus metrics, SIEM queries, capacity planning calculators, and ACME certificate lifecycle with cert-manager v1.17+.',
    icon: Activity,
  },
  {
    id: 'platform-migration-planner',
    title: 'Step 6: Platform Migration Planner',
    description:
      'Six-phase migration runway: inventory → Root CA → TLS key exchange → artifact signing → CI identity → policy cut-over. Includes rollback decision tree.',
    icon: GitBranch,
  },
]

export const PlatformEngPQCModule: React.FC = () => {
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
    if (confirm('Restart Platform Engineering & PQC Module?')) {
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
          <h1 className="text-3xl font-bold text-gradient">Platform Engineering &amp; PQC</h1>
          <p className="text-muted-foreground mt-2">
            Inventory, migrate, and monitor every cryptographic primitive in your software delivery
            pipeline — CI/CD crypto assets, container signing, IaC defaults, policy enforcement, and
            posture monitoring with a quantum threat lens.
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
              {currentPart === 0 && <PipelineCryptoInventory key={`pipeline-${configKey}`} />}
              {currentPart === 1 && <QuantumThreatTimeline key={`timeline-${configKey}`} />}
              {currentPart === 2 && <ContainerSigningMigration key={`signing-${configKey}`} />}
              {currentPart === 3 && <PolicyAsCodeEnforcer key={`policy-${configKey}`} />}
              {currentPart === 4 && <CryptoPostureMonitor key={`monitor-${configKey}`} />}
              {currentPart === 5 && <PlatformMigrationPlanner key={`migration-${configKey}`} />}
            </div>

            {/* Part Navigation */}
            <div className="flex flex-col sm:flex-row justify-between gap-3">
              <Button
                data-workshop-target="learn-stepper-prev"
                variant="ghost"
                onClick={() => handlePartChange(Math.max(0, currentPart - 1))}
                disabled={currentPart === 0}
                className="px-6 py-3 min-h-[44px] rounded-lg border border-border hover:bg-muted disabled:opacity-50 transition-colors text-foreground"
              >
                &larr; Previous Step
              </Button>
              {currentPart === PARTS.length - 1 ? (
                <Button
                  data-workshop-target="learn-stepper-complete"
                  variant="gradient"
                  onClick={() => markStepComplete(MODULE_ID, PARTS[currentPart].id)}
                  className="px-6 py-3 min-h-[44px] font-bold rounded-lg transition-colors"
                >
                  Complete Module
                </Button>
              ) : (
                <Button
                  data-workshop-target="learn-stepper-next"
                  variant="gradient"
                  onClick={() => handlePartChange(currentPart + 1)}
                  className="px-6 py-3 min-h-[44px] font-bold rounded-lg transition-colors"
                >
                  Next Step &rarr;
                </Button>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="exercises">
          <PlatformEngExercises
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
