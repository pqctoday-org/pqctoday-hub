// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Trash2,
  Database,
  FileCheck,
  Lock,
  UserCheck,
  ShoppingCart,
  Network,
  Calculator,
} from 'lucide-react'
import { Introduction } from './components/Introduction'
import { AISecurityExercises, type WorkshopConfig } from './components/AISecurityExercises'
import { DataProtectionAnalyzer } from './workshop/DataProtectionAnalyzer'
import { DataAuthenticityVerifier } from './workshop/DataAuthenticityVerifier'
import { ModelWeightVault } from './workshop/ModelWeightVault'
import { AgentAuthDesigner } from './workshop/AgentAuthDesigner'
import { AgenticCommerceSimulator } from './workshop/AgenticCommerceSimulator'
import { Agent2AgentProtocol } from './workshop/Agent2AgentProtocol'
import { ScaleEncryptionPlanner } from './workshop/ScaleEncryptionPlanner'
import { useModuleStore } from '@/store/useModuleStore'
import { getModuleDeepLink, useSyncDeepLink } from '@/hooks/useModuleDeepLink'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ModuleReferencesTab } from '../../common/ModuleReferencesTab'
import { ModuleMigrateTab } from '../../common/ModuleMigrateTab'
import { ModuleVisualTab } from '../../common/ModuleVisualTab'
import { WorkshopStepHeader } from '../../common/WorkshopStepHeader'
import { GlossaryAutoWrap } from '@/components/PKILearning/common/GlossaryAutoWrap'
import { Button } from '@/components/ui/button'

const MODULE_ID = 'ai-security-pqc'

const PARTS = [
  {
    id: 'data-protection-analyzer',
    title: 'Step 1: Data Protection Analyzer',
    description:
      'Audit AI pipeline crypto operations — identify quantum-vulnerable touchpoints and HNDL exposure at each stage.',
    icon: Database,
  },
  {
    id: 'data-authenticity-verifier',
    title: 'Step 2: Data Authenticity Verifier',
    description:
      'Configure verification layers against synthetic data contamination. Visualize model collapse and compare signing overheads.',
    icon: FileCheck,
  },
  {
    id: 'model-weight-vault',
    title: 'Step 3: Model Weight Vault',
    description:
      'Configure encryption, key wrapping, and signing for model weights. Compare classical vs PQC overhead.',
    icon: Lock,
  },
  {
    id: 'agent-auth-designer',
    title: 'Step 4: Agent Auth Designer',
    description:
      'Design authentication architectures and delegation chains for AI agents with PQC credentials.',
    icon: UserCheck,
  },
  {
    id: 'agentic-commerce-simulator',
    title: 'Step 5: Agentic Commerce Simulator',
    description:
      'Step through agent-to-agent transaction flows with quantum overlay to identify vulnerable crypto.',
    icon: ShoppingCart,
  },
  {
    id: 'agent-to-agent-protocol',
    title: 'Step 6: Agent-to-Agent Protocol',
    description: 'Design PQC-secured communication protocols for autonomous agent interactions.',
    icon: Network,
  },
  {
    id: 'scale-encryption-planner',
    title: 'Step 7: Scale Encryption Planner',
    description:
      'Calculate PQC migration requirements at enterprise scale — key counts, KMS ops, HNDL risk windows.',
    icon: Calculator,
  },
]

export const AISecurityPQCModule: React.FC = () => {
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
    if (confirm('Restart AI Security & PQC Module?')) {
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
          <h1 className="text-3xl font-bold text-gradient">AI Security &amp; PQC</h1>
          <p className="text-muted-foreground mt-2">
            Quantum threats to AI systems — data pipeline protection, model weight security, agent
            authentication, agentic commerce, and encryption at scale.
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
              {currentPart === 0 && <DataProtectionAnalyzer key={`dpa-${configKey}`} />}
              {currentPart === 1 && <DataAuthenticityVerifier key={`dav-${configKey}`} />}
              {currentPart === 2 && <ModelWeightVault key={`mwv-${configKey}`} />}
              {currentPart === 3 && <AgentAuthDesigner key={`aad-${configKey}`} />}
              {currentPart === 4 && <AgenticCommerceSimulator key={`acs-${configKey}`} />}
              {currentPart === 5 && <Agent2AgentProtocol key={`a2a-${configKey}`} />}
              {currentPart === 6 && <ScaleEncryptionPlanner key={`sep-${configKey}`} />}
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
                  variant="gradient"
                  onClick={() => markStepComplete(MODULE_ID, PARTS[currentPart].id)}
                  className="px-6 py-3 min-h-[44px] font-bold rounded-lg transition-colors"
                >
                  Complete Module
                </Button>
              ) : (
                <Button
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
          <AISecurityExercises
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
