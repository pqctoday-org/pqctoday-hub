// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Trash2, Shield, Terminal, GitCompareArrows } from 'lucide-react'
import { VPNSSHIntroduction } from './components/VPNSSHIntroduction'
import { VPNSSHExercises, type SimulationConfig } from './components/VPNSSHExercises'
import { SSHConfigGenerator } from './components/SSHConfigGenerator'
import { IKEv2HandshakeSimulator } from './simulate/IKEv2HandshakeSimulator'
import { SSHKeyExchangeSimulator } from './simulate/SSHKeyExchangeSimulator'
import { ProtocolComparisonTable } from './simulate/ProtocolComparisonTable'
import { useModuleStore } from '@/store/useModuleStore'
import { getModuleDeepLink, useSyncDeepLink } from '@/hooks/useModuleDeepLink'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import type { IKEv2Mode } from './data/ikev2Constants'
import type { SSHKexAlgorithm } from './data/sshConstants'
import { ModuleReferencesTab } from '../../common/ModuleReferencesTab'
import { ModuleMigrateTab } from '../../common/ModuleMigrateTab'
import { ModuleVisualTab } from '../../common/ModuleVisualTab'
import { WorkshopStepHeader } from '../../common/WorkshopStepHeader'
import { GlossaryAutoWrap } from '@/components/PKILearning/common/GlossaryAutoWrap'
import { Button } from '@/components/ui/button'

const MODULE_ID = 'vpn-ssh-pqc'

const PARTS = [
  {
    id: 'ikev2-handshake',
    title: 'Step 1: IKEv2 Handshake',
    description: 'Step through IKEv2 handshake in Classical, Hybrid, and Pure PQC modes.',
    icon: Shield,
  },
  {
    id: 'ssh-key-exchange',
    title: 'Step 2: SSH Key Exchange',
    description: 'Compare SSH KEX algorithms: curve25519, sntrup761, and mlkem768.',
    icon: Terminal,
  },
  {
    id: 'protocol-comparison',
    title: 'Step 3: Protocol Comparison',
    description: 'IKEv2 vs SSH vs WireGuard vs TLS 1.3 — sizes, RTTs, and features.',
    icon: GitCompareArrows,
  },
]

export const VPNSSHModule: React.FC = () => {
  const deepLink = getModuleDeepLink({
    validTabs: ['learn', 'visual', 'workshop', 'exercises', 'references', 'tools'],
    maxStep: PARTS.length - 1,
  })
  const [activeTab, setActiveTab] = useState(deepLink.initialTab)
  const [currentPart, setCurrentPart] = useState(deepLink.initialStep)
  useSyncDeepLink(activeTab, currentPart)
  const [initialIKEv2Mode, setInitialIKEv2Mode] = useState<IKEv2Mode | undefined>(undefined)
  const [initialSSHKex, setInitialSSHKex] = useState<SSHKexAlgorithm | undefined>(undefined)
  const [configKey, setConfigKey] = useState(0)
  const startTimeRef = useRef(0)
  const { updateModuleProgress, markStepComplete } = useModuleStore()

  // Track module as in-progress on mount
  useEffect(() => {
    startTimeRef.current = Date.now()
    updateModuleProgress(MODULE_ID, {
      status: 'in-progress',
      lastVisited: Date.now(),
    })

    // Accumulate time on unmount
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

  // Track tab visits as completed steps
  const handleTabChange = useCallback(
    (tab: string) => {
      markStepComplete(MODULE_ID, activeTab)
      setActiveTab(tab)
    },
    [activeTab, markStepComplete]
  )

  // Navigate from Learn/Exercises to Simulate tab
  const navigateToSimulate = useCallback(() => {
    markStepComplete(MODULE_ID, activeTab)
    setActiveTab('workshop')
  }, [activeTab, markStepComplete])

  // Exercise pre-configuration
  const setSimulationConfig = useCallback((config: SimulationConfig) => {
    setCurrentPart(config.step)
    if (config.ikev2Mode !== undefined) {
      setInitialIKEv2Mode(config.ikev2Mode)
    }
    if (config.sshKex !== undefined) {
      setInitialSSHKex(config.sshKex)
    }
    setConfigKey((prev) => prev + 1)
  }, [])

  // Part navigation within the Simulate tab
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

  // Reset handler
  const handleReset = () => {
    if (confirm('Restart VPN/IPsec & SSH Module?')) {
      setCurrentPart(0)
      setInitialIKEv2Mode(undefined)
      setInitialSSHKex(undefined)
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
          <h1 className="text-3xl font-bold text-gradient">VPN/IPsec &amp; SSH PQC</h1>
          <p className="text-muted-foreground mt-2">
            Explore post-quantum key exchange in IKEv2, SSH, and WireGuard protocols.
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

        {/* Learn Tab */}
        <TabsContent value="learn">
          <GlossaryAutoWrap>
            <VPNSSHIntroduction onNavigateToSimulate={navigateToSimulate} />
          </GlossaryAutoWrap>
        </TabsContent>

        {/* Visual Tab */}
        <TabsContent value="visual">
          <ModuleVisualTab moduleId={MODULE_ID} />
        </TabsContent>

        {/* Simulate Tab */}
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
              {currentPart === 0 && (
                <IKEv2HandshakeSimulator
                  key={`ikev2-${configKey}`}
                  initialMode={initialIKEv2Mode}
                />
              )}
              {currentPart === 1 && (
                <SSHKeyExchangeSimulator key={`ssh-${configKey}`} initialKex={initialSSHKex} />
              )}
              {currentPart === 2 && <ProtocolComparisonTable key={`compare-${configKey}`} />}
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
                  Complete Module ✓
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

        {/* Exercises Tab */}
        <TabsContent value="exercises">
          <VPNSSHExercises
            onNavigateToSimulate={navigateToSimulate}
            onSetSimulationConfig={setSimulationConfig}
          />
          <div className="mt-6">
            <SSHConfigGenerator />
          </div>
        </TabsContent>
        {/* References Tab */}
        <TabsContent value="references">
          <ModuleReferencesTab moduleId="vpn-ssh-pqc" />
        </TabsContent>
        <TabsContent value="tools">
          <ModuleMigrateTab moduleId={MODULE_ID} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
