// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Trash2, Cpu, ShieldCheck, Lock, Link2, AlertTriangle } from 'lucide-react'
import { Introduction } from './components/Introduction'
import {
  ConfidentialComputingExercises,
  type WorkshopConfig,
} from './components/ConfidentialComputingExercises'
import { TEEArchitectureExplorer } from './workshop/TEEArchitectureExplorer'
import { AttestationWorkshop } from './workshop/AttestationWorkshop'
import { EncryptionMechanisms } from './workshop/EncryptionMechanisms'
import { TEEHSMTrustedChannel } from './workshop/TEEHSMTrustedChannel'
import { QuantumThreatMigration } from './workshop/QuantumThreatMigration'
import { useModuleStore } from '@/store/useModuleStore'
import { getModuleDeepLink, useSyncDeepLink } from '@/hooks/useModuleDeepLink'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ModuleReferencesTab } from '../../common/ModuleReferencesTab'
import { ModuleMigrateTab } from '../../common/ModuleMigrateTab'

const MODULE_ID = 'confidential-computing'

const PARTS = [
  {
    id: 'tee-architecture-explorer',
    title: 'Step 1: TEE Architecture Explorer',
    description:
      'Compare 7 TEE architectures by isolation scope, encryption, attestation, and PQC readiness.',
    icon: Cpu,
  },
  {
    id: 'attestation-workshop',
    title: 'Step 2: Attestation Workshop',
    description:
      'Step through remote attestation flows for Intel DCAP, ARM CCA, AMD SEV-SNP, and AWS Nitro.',
    icon: ShieldCheck,
  },
  {
    id: 'encryption-mechanisms',
    title: 'Step 3: Encryption Mechanisms',
    description:
      'Explore memory encryption engines, sealing key derivation, and Grover impact on AES key sizes.',
    icon: Lock,
  },
  {
    id: 'tee-hsm-channel',
    title: 'Step 4: TEE-HSM Trusted Channel',
    description:
      'Design mutual attestation and PQC key provisioning between TEE enclaves and HSMs.',
    icon: Link2,
  },
  {
    id: 'quantum-threat-migration',
    title: 'Step 5: Quantum Threat Migration',
    description:
      'Assess quantum risks per TEE component and build a prioritized PQC migration plan.',
    icon: AlertTriangle,
  },
]

export const ConfidentialComputingModule: React.FC = () => {
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
    if (confirm('Restart Confidential Computing & TEEs Module?')) {
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
          <h1 className="text-3xl font-bold text-gradient">Confidential Computing &amp; TEEs</h1>
          <p className="text-muted-foreground mt-2">
            TEE architectures, remote attestation, memory encryption, TEE-HSM integration, and
            quantum threat analysis for confidential computing.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="learn">Learn</TabsTrigger>
          <TabsTrigger value="workshop">Workshop</TabsTrigger>
          <TabsTrigger value="exercises">Exercises</TabsTrigger>
          <TabsTrigger value="references">References</TabsTrigger>
          <TabsTrigger value="tools">Tools &amp; Products</TabsTrigger>
        </TabsList>

        <TabsContent value="learn">
          <Introduction onNavigateToWorkshop={navigateToWorkshop} />
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
              <div className="mb-6 border-b border-border pb-4">
                <h2 className="text-2xl font-bold text-foreground">{PARTS[currentPart].title}</h2>
                <p className="text-muted-foreground">{PARTS[currentPart].description}</p>
              </div>
              {currentPart === 0 && <TEEArchitectureExplorer key={`tee-arch-${configKey}`} />}
              {currentPart === 1 && <AttestationWorkshop key={`attestation-${configKey}`} />}
              {currentPart === 2 && <EncryptionMechanisms key={`encryption-${configKey}`} />}
              {currentPart === 3 && <TEEHSMTrustedChannel key={`tee-hsm-${configKey}`} />}
              {currentPart === 4 && <QuantumThreatMigration key={`quantum-threat-${configKey}`} />}
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
          <ConfidentialComputingExercises
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
