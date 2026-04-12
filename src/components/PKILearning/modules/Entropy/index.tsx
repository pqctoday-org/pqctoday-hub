// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Trash2,
  Dice5,
  BarChart3,
  ShieldCheck,
  Atom,
  Combine,
  ArrowLeft,
  ArrowRight,
  Check,
} from 'lucide-react'
import { EntropyIntroduction } from './components/EntropyIntroduction'
import { EntropyExercises, type WorkshopConfig } from './components/EntropyExercises'
import { RandomGenerationDemo } from './workshop/RandomGenerationDemo'
import { EntropyTestingDemo } from './workshop/EntropyTestingDemo'
import { ESVWalkthroughDemo } from './workshop/ESVWalkthroughDemo'
import { QRNGDemo } from './workshop/QRNGDemo'
import { SourceCombiningDemo } from './workshop/SourceCombiningDemo'
import { Button } from '@/components/ui/button'
import { useModuleStore } from '@/store/useModuleStore'
import { getModuleDeepLink, useSyncDeepLink } from '@/hooks/useModuleDeepLink'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ModuleReferencesTab } from '../../common/ModuleReferencesTab'
import { ModuleMigrateTab } from '../../common/ModuleMigrateTab'
import { ModuleVisualTab } from '../../common/ModuleVisualTab'
import { WorkshopStepHeader } from '../../common/WorkshopStepHeader'
import { GlossaryAutoWrap } from '@/components/PKILearning/common/GlossaryAutoWrap'

const MODULE_ID = 'entropy-randomness'

const PARTS = [
  {
    id: 'random-generation',
    title: 'Step 1: Random Byte Generation',
    description: 'Generate and compare random bytes from Web Crypto API and OpenSSL WASM.',
    icon: Dice5,
  },
  {
    id: 'entropy-testing',
    title: 'Step 2: Entropy Testing',
    description: 'Run simplified SP 800-90B statistical tests on generated random data.',
    icon: BarChart3,
  },
  {
    id: 'esv-walkthrough',
    title: 'Step 3: ESV Validation',
    description: 'Walk through the NIST Entropy Source Validation process.',
    icon: ShieldCheck,
  },
  {
    id: 'qrng-comparison',
    title: 'Step 4: QRNG Exploration',
    description: 'Compare pre-fetched quantum random data with local TRNG output.',
    icon: Atom,
  },
  {
    id: 'source-combining',
    title: 'Step 5: Combining Sources',
    description: 'Combine TRNG and QRNG entropy using the SP 800-90C XOR+conditioning framework.',
    icon: Combine,
  },
]

export const EntropyModule: React.FC = () => {
  const deepLink = getModuleDeepLink({ maxStep: PARTS.length - 1 })
  const [activeTab, setActiveTab] = useState(deepLink.initialTab)
  const [currentPart, setCurrentPart] = useState(deepLink.initialStep)
  useSyncDeepLink(activeTab, currentPart)
  const [configKey, setConfigKey] = useState(0)
  const [exerciseConfig, setExerciseConfig] = useState<WorkshopConfig | null>(null)
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
    setExerciseConfig(config)
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
    if (confirm('Restart Entropy & Randomness Module?')) {
      setCurrentPart(0)
      setConfigKey((prev) => prev + 1)
      setExerciseConfig(null)
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
          <h1 className="text-3xl font-bold text-gradient">Entropy &amp; Randomness</h1>
          <p className="text-muted-foreground mt-2">
            Master entropy sources, DRBG mechanisms, and quantum randomness — NIST SP 800-90
            standards, entropy testing, TRNG vs QRNG, and combining sources for defense-in-depth.
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
            <EntropyIntroduction onNavigateToWorkshop={navigateToWorkshop} />
          </GlossaryAutoWrap>
        </TabsContent>

        <TabsContent value="visual">
          <ModuleVisualTab moduleId={MODULE_ID} />
        </TabsContent>

        <TabsContent value="workshop">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex justify-end">
              <Button variant="destructive" size="sm" onClick={handleReset}>
                <Trash2 size={16} className="mr-2" />
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
                      key={part.id}
                      variant="ghost"
                      onClick={() => handlePartChange(idx)}
                      className={`flex flex-col items-center gap-2 h-auto py-2 px-1 sm:px-2 ${idx === currentPart ? 'text-primary' : 'text-muted-foreground'}`}
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
              {currentPart === 0 && <RandomGenerationDemo key={`rng-${configKey}`} />}
              {currentPart === 1 && (
                <EntropyTestingDemo
                  key={`test-${configKey}`}
                  initialSampleType={exerciseConfig?.sampleType}
                />
              )}
              {currentPart === 2 && <ESVWalkthroughDemo key={`esv-${configKey}`} />}
              {currentPart === 3 && <QRNGDemo key={`qrng-${configKey}`} />}
              {currentPart === 4 && <SourceCombiningDemo key={`combine-${configKey}`} />}
            </div>

            {/* Part Navigation */}
            <div className="flex flex-col sm:flex-row justify-between gap-3">
              <Button
                variant="outline"
                onClick={() => handlePartChange(Math.max(0, currentPart - 1))}
                disabled={currentPart === 0}
                className="min-h-[44px]"
              >
                <ArrowLeft size={16} className="mr-2" />
                Previous Step
              </Button>
              {currentPart === PARTS.length - 1 ? (
                <Button
                  variant="gradient"
                  onClick={() => markStepComplete(MODULE_ID, PARTS[currentPart].id)}
                  className="min-h-[44px]"
                >
                  <Check size={16} className="mr-2" />
                  Complete Module
                </Button>
              ) : (
                <Button
                  variant="gradient"
                  onClick={() => handlePartChange(currentPart + 1)}
                  className="min-h-[44px]"
                >
                  Next Step
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="exercises">
          <EntropyExercises
            onNavigateToWorkshop={navigateToWorkshop}
            onSetWorkshopConfig={handleSetWorkshopConfig}
          />
        </TabsContent>

        <TabsContent value="references">
          <ModuleReferencesTab moduleId="entropy-randomness" />
        </TabsContent>
        <TabsContent value="tools">
          <ModuleMigrateTab moduleId={MODULE_ID} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
