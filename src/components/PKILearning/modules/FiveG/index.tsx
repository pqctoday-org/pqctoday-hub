// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Trash2, Shield, Lock, Server } from 'lucide-react'
import { SuciFlow } from './SuciFlow'
import { AuthFlow } from './AuthFlow'
import { ProvisioningFlow } from './ProvisioningFlow'
import { FiveGIntroduction } from './components/FiveGIntroduction'
import { FiveGExercises } from './components/FiveGExercises'
import type { SimulationConfig } from './components/FiveGExercises'
import { useModuleStore } from '@/store/useModuleStore'
import { getModuleDeepLink } from '@/hooks/useModuleDeepLink'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ModuleReferencesTab } from '../../common/ModuleReferencesTab'
import { ModuleMigrateTab } from '../../common/ModuleMigrateTab'
import { ModuleVisualTab } from '../../common/ModuleVisualTab'
import { WorkshopStepHeader } from '../../common/WorkshopStepHeader'
import { GlossaryAutoWrap } from '@/components/PKILearning/common/GlossaryAutoWrap'
import { Button } from '@/components/ui/button'

const MODULE_ID = '5g-security'

const PARTS = [
  {
    id: 'suci',
    title: 'Part 1: SUCI Deconcealment',
    description: 'Subscriber Privacy: ECIES (Profile A/B) & KEM (Profile C).',
    icon: Shield,
  },
  {
    id: 'auth',
    title: 'Part 2: 5G-AKA Authentication',
    description: 'Mutual Authentication & MILENAGE Algorithm.',
    icon: Lock,
  },
  {
    id: 'provisioning',
    title: 'Part 3: SIM Key Provisioning',
    description: 'Supply Chain Security & Key Lifecycle.',
    icon: Server,
  },
]

export const FiveGModule: React.FC = () => {
  const deepLink = getModuleDeepLink({
    maxStep: PARTS.length - 1,
    validTabs: ['learn', 'visual', 'workshop', 'exercises', 'references', 'tools'],
  })

  // Parse 5G-specific deep-link params on mount
  const urlParams = new URLSearchParams(window.location.search)
  const profileParam = urlParams.get('profile')
  const pqcModeParam = urlParams.get('pqcMode')
  const parsedProfile =
    profileParam === 'A' || profileParam === 'B' || profileParam === 'C'
      ? (profileParam as 'A' | 'B' | 'C')
      : undefined
  const parsedPqcMode =
    pqcModeParam === 'hybrid' || pqcModeParam === 'pure'
      ? (pqcModeParam as 'hybrid' | 'pure')
      : undefined

  const [activeTab, setActiveTab] = useState(deepLink.initialTab)
  const [currentPart, setCurrentPart] = useState(deepLink.initialStep)
  const [initialProfile, setInitialProfile] = useState<'A' | 'B' | 'C' | undefined>(parsedProfile)
  const [initialPqcMode, setInitialPqcMode] = useState<'hybrid' | 'pure' | undefined>(parsedPqcMode)
  // Track current SuciFlow profile/pqcMode to keep URL in sync
  const [currentProfile, setCurrentProfile] = useState<'A' | 'B' | 'C'>(parsedProfile ?? 'A')
  const [currentPqcMode, setCurrentPqcMode] = useState<'hybrid' | 'pure'>(parsedPqcMode ?? 'hybrid')

  // Sync tab, step, profile, pqcMode to URL (replaces useSyncDeepLink)
  useEffect(() => {
    const url = new URL(window.location.href)
    if (activeTab !== 'learn') {
      url.searchParams.set('tab', activeTab)
    } else {
      url.searchParams.delete('tab')
    }
    if (currentPart > 0) {
      url.searchParams.set('step', String(currentPart))
    } else {
      url.searchParams.delete('step')
    }
    // Only include profile/pqcMode when on the simulate tab showing SUCI (part 0)
    if (activeTab === 'workshop' && currentPart === 0) {
      if (currentProfile !== 'A') {
        url.searchParams.set('profile', currentProfile)
      } else {
        url.searchParams.delete('profile')
      }
      if (currentProfile === 'C' && currentPqcMode !== 'hybrid') {
        url.searchParams.set('pqcMode', currentPqcMode)
      } else {
        url.searchParams.delete('pqcMode')
      }
    } else {
      url.searchParams.delete('profile')
      url.searchParams.delete('pqcMode')
    }
    window.history.replaceState(null, '', url.toString())
  }, [activeTab, currentPart, currentProfile, currentPqcMode])

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

  // Exercise pre-configuration: set part, profile, and PQC mode
  const setSimulationConfig = useCallback((config: SimulationConfig) => {
    setCurrentPart(config.part)
    if (config.profile !== undefined) {
      setInitialProfile(config.profile)
      setCurrentProfile(config.profile)
    }
    if (config.pqcMode !== undefined) {
      setInitialPqcMode(config.pqcMode)
      setCurrentPqcMode(config.pqcMode)
    }
    setConfigKey((prev) => prev + 1)
  }, [])

  // Part navigation within the Simulate tab
  const handlePartChange = useCallback(
    (newPart: number) => {
      const partIds = ['suci', 'auth', 'provisioning']
      if (newPart > currentPart) {
        markStepComplete(MODULE_ID, partIds[currentPart], currentPart)
      }
      setCurrentPart(newPart)
    },
    [currentPart, markStepComplete]
  )

  // Reset handler (scoped to Simulate tab state)
  const handleReset = () => {
    if (confirm('Restart 5G Security Module?')) {
      setCurrentPart(0)
      setInitialProfile(undefined)
      setInitialPqcMode(undefined)
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
          <h1 className="text-3xl font-bold text-gradient">5G Security Architecture</h1>
          <p className="text-muted-foreground mt-2">
            Master 3GPP security: Privacy, Authentication, and Provisioning.
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
            <FiveGIntroduction onNavigateToSimulate={navigateToSimulate} />
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
                <SuciFlow
                  key={`suci-${configKey}`}
                  onBack={() => {}}
                  initialProfile={initialProfile}
                  initialPqcMode={initialPqcMode}
                  onProfileChange={setCurrentProfile}
                  onPqcModeChange={setCurrentPqcMode}
                />
              )}
              {currentPart === 1 && <AuthFlow onBack={() => setCurrentPart(0)} />}
              {currentPart === 2 && <ProvisioningFlow onBack={() => setCurrentPart(1)} />}
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
          <FiveGExercises
            onNavigateToSimulate={navigateToSimulate}
            onSetSimulationConfig={setSimulationConfig}
          />
        </TabsContent>
        {/* References Tab */}
        <TabsContent value="references">
          <ModuleReferencesTab moduleId="5g-security" />
        </TabsContent>
        <TabsContent value="tools">
          <ModuleMigrateTab moduleId={MODULE_ID} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
