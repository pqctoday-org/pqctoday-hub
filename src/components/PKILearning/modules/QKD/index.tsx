// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Trash2, Radio, Hash, Globe, Network, Server } from 'lucide-react'
import { QKDIntroduction } from './components/QKDIntroduction'
import { QKDExercises, type WorkshopConfig } from './components/QKDExercises'
import { BB84Simulator } from './workshop/BB84Simulator'
import { PostProcessingDemo } from './workshop/PostProcessingDemo'
import { DeploymentExplorer } from './workshop/DeploymentExplorer'
import { ProtocolIntegrationDemo } from './workshop/ProtocolIntegrationDemo'
import { HSMKeyDerivationDemo } from './workshop/HSMKeyDerivationDemo'
import { useModuleStore } from '@/store/useModuleStore'
import { getModuleDeepLink, useSyncDeepLink } from '@/hooks/useModuleDeepLink'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ModuleReferencesTab } from '../../common/ModuleReferencesTab'
import { ModuleMigrateTab } from '../../common/ModuleMigrateTab'
import { ModuleVisualTab } from '../../common/ModuleVisualTab'
import { WorkshopStepHeader } from '../../common/WorkshopStepHeader'
import { GlossaryAutoWrap } from '@/components/PKILearning/common/GlossaryAutoWrap'
import { Button } from '@/components/ui/button'

const MODULE_ID = 'qkd'

const PARTS = [
  {
    id: 'bb84-simulator',
    title: 'Part 1: BB84 Protocol',
    description: 'Visual simulation of the BB84 quantum key distribution protocol.',
    icon: Radio,
  },
  {
    id: 'post-processing',
    title: 'Part 2: Post-Processing',
    description: 'Error correction, privacy amplification, and hybrid key derivation.',
    icon: Hash,
  },
  {
    id: 'deployment-explorer',
    title: 'Part 3: Global Deployments',
    description: 'Interactive explorer of worldwide QKD deployments and adoption trends.',
    icon: Globe,
  },
  {
    id: 'protocol-integration',
    title: 'Part 4: QKD + Classical Protocols',
    description: 'Integrate QKD keys into TLS 1.3, IKEv2, MACsec, and SSH nonce/PSK fields.',
    icon: Network,
  },
  {
    id: 'hsm-derivation',
    title: 'Part 5: HSM Key Derivation',
    description: 'Use QKD secret as NIST SP 800-108 key material inside an HSM (PKCS#11).',
    icon: Server,
  },
]

export const QKDModule: React.FC = () => {
  const deepLink = getModuleDeepLink({ maxStep: PARTS.length - 1 })
  const [activeTab, setActiveTab] = useState(deepLink.initialTab)
  const [currentPart, setCurrentPart] = useState(deepLink.initialStep)
  useSyncDeepLink(activeTab, currentPart)
  const [workshopConfig, setWorkshopConfig] = useState<WorkshopConfig | null>(null)
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

  const handleSetWorkshopConfig = useCallback((config: WorkshopConfig) => {
    setCurrentPart(config.part)
    setWorkshopConfig(config)
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
    if (confirm('Restart Quantum Key Distribution Module?')) {
      setCurrentPart(0)
      setWorkshopConfig(null)
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
          <h1 className="text-3xl font-bold text-gradient">Quantum Key Distribution</h1>
          <p className="text-muted-foreground mt-2">
            Explore QKD fundamentals, BB84 protocol simulation, classical post-processing, and
            global deployment landscape.
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
            <QKDIntroduction onNavigateToWorkshop={navigateToWorkshop} />
          </GlossaryAutoWrap>
        </TabsContent>

        <TabsContent value="visual">
          <ModuleVisualTab moduleId={MODULE_ID} />
        </TabsContent>

        <TabsContent value="workshop">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Reset button */}
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
              <div className="flex justify-between relative min-w-max sm:min-w-0">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border -z-10 hidden sm:block" />

                {PARTS.map((part, idx) => {
                  const Icon = part.icon
                  return (
                    <Button
                      variant="ghost"
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
                <BB84Simulator
                  key={`bb84-${configKey}`}
                  initialEveEnabled={workshopConfig?.eveEnabled}
                  initialNumQubits={workshopConfig?.numQubits}
                />
              )}
              {currentPart === 1 && <PostProcessingDemo key={`post-${configKey}`} />}
              {currentPart === 2 && <DeploymentExplorer key={`deploy-${configKey}`} />}
              {currentPart === 3 && (
                <ProtocolIntegrationDemo
                  key={`protocol-${configKey}`}
                  initialProtocol={workshopConfig?.protocol}
                />
              )}
              {currentPart === 4 && <HSMKeyDerivationDemo key={`hsm-${configKey}`} />}
            </div>

            {/* Part Navigation */}
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
                  Complete Module ✓
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
          <QKDExercises
            onNavigateToWorkshop={navigateToWorkshop}
            onSetWorkshopConfig={handleSetWorkshopConfig}
          />
        </TabsContent>

        <TabsContent value="references">
          <ModuleReferencesTab moduleId="qkd" />
        </TabsContent>
        <TabsContent value="tools">
          <ModuleMigrateTab moduleId={MODULE_ID} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
