// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Trash2, BarChart3, KeyRound, PenLine, Shapes } from 'lucide-react'
import { useModuleStore } from '@/store/useModuleStore'
import { getModuleDeepLink, useSyncDeepLink } from '@/hooks/useModuleDeepLink'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { usePersonaStore } from '@/store/usePersonaStore'
import { PQC101Module } from './PQC101Module'
import { ModuleReferencesTab } from '../../common/ModuleReferencesTab'
import { ModuleMigrateTab } from '../../common/ModuleMigrateTab'
import { ModuleVisualTab } from '../../common/ModuleVisualTab'
import { WorkshopStepHeader } from '../../common/WorkshopStepHeader'
import { AlgorithmFamilyWorkshop } from './AlgorithmFamilyWorkshop'
import { AlgorithmComparisonTable } from './AlgorithmComparisonTable'
import { KeyGenWorkshop } from './KeyGenWorkshop'
import { SignatureDemo } from './SignatureDemo'
import { PQC101Exercises, type WorkshopConfig } from './PQC101Exercises'
import { GlossaryAutoWrap } from '@/components/PKILearning/common/GlossaryAutoWrap'
import { Button } from '@/components/ui/button'

const MODULE_ID = 'pqc-101'

const PARTS = [
  {
    id: 'algorithm-families',
    title: 'Step 1: Why PQC Works',
    description:
      'Explore why lattice, hash-based, and code-based algorithms resist quantum computers.',
    icon: Shapes,
    difficulty: 'beginner',
  },
  {
    id: 'algorithm-comparison',
    title: 'Step 2: Algorithm Comparison',
    description: 'Compare classical and post-quantum algorithms side-by-side.',
    icon: BarChart3,
    difficulty: 'beginner',
  },
  {
    id: 'key-generation',
    title: 'Step 3: Key Generation',
    description: 'Generate a real key pair with OpenSSL and observe size differences.',
    icon: KeyRound,
    difficulty: 'intermediate',
  },
  {
    id: 'signature-demo',
    title: 'Step 4: Signature Demo',
    description: 'Sign a message and see how digital signatures prove authenticity.',
    icon: PenLine,
    difficulty: 'intermediate',
  },
]

export const Module1: React.FC = () => {
  const { markStepComplete, updateModuleProgress } = useModuleStore()

  const experienceLevel = usePersonaStore((s) => s.experienceLevel)
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  const isCuriousMode = experienceLevel === 'curious' || selectedPersona === 'curious'
  const visibleParts = React.useMemo(() => {
    return isCuriousMode ? PARTS.filter((p) => p.difficulty === 'beginner') : PARTS
  }, [isCuriousMode])

  const deepLink = getModuleDeepLink({
    maxStep: visibleParts.length - 1,
    defaultTab: isCuriousMode ? 'workshop' : 'learn',
  })
  const [activeTab, setActiveTab] = useState(deepLink.initialTab)
  const [currentPart, setCurrentPart] = useState(deepLink.initialStep)
  useSyncDeepLink(activeTab, currentPart)
  const [configKey, setConfigKey] = useState(0)
  const startTimeRef = useRef(0)

  useEffect(() => {
    startTimeRef.current = Date.now()
    updateModuleProgress(MODULE_ID, {
      status: 'in-progress',
      lastVisited: Date.now(),
    })

    return () => {
      const elapsedMins = (Date.now() - startTimeRef.current) / 60000
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
    setCurrentPart(config.step)
    setConfigKey((prev) => prev + 1)
  }, [])

  const handlePartChange = useCallback(
    (newPart: number) => {
      const partIds = visibleParts.map((p) => p.id)
      if (newPart > currentPart) {
        markStepComplete(MODULE_ID, partIds[currentPart], currentPart)
      }
      setCurrentPart(newPart)
    },
    [currentPart, markStepComplete, visibleParts]
  )

  const handleReset = () => {
    if (confirm('Restart PQC 101 Module?')) {
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
          <h1 className="text-3xl font-bold text-gradient">PQC 101: Introduction</h1>
          <p className="text-muted-foreground mt-2">
            Understand the quantum threat, explore NIST PQC standards, and compare classical vs
            post-quantum cryptography.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="w-full sm:w-auto">
          {!isCuriousMode && <TabsTrigger value="learn">Learn</TabsTrigger>}
          <TabsTrigger value="visual">Visual</TabsTrigger>
          <TabsTrigger value="workshop">Workshop</TabsTrigger>
          {!isCuriousMode && <TabsTrigger value="exercises">Exercises</TabsTrigger>}
          {!isCuriousMode && <TabsTrigger value="references">References</TabsTrigger>}
          {!isCuriousMode && <TabsTrigger value="tools">Tools & Products</TabsTrigger>}
        </TabsList>

        {/* Learn Tab (Hidden in Curious Mode) */}
        {!isCuriousMode && (
          <TabsContent value="learn">
            <GlossaryAutoWrap>
              <PQC101Module />
              <div className="mt-6 flex justify-end">
                <Button
                  variant="ghost"
                  onClick={navigateToWorkshop}
                  className="px-6 py-2 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Go to Workshop &rarr;
                </Button>
              </div>
            </GlossaryAutoWrap>
          </TabsContent>
        )}

        {/* Workshop Tab */}

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

                {visibleParts.map((part, idx) => {
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
                stepId={visibleParts[currentPart]?.id ?? ''}
                stepTitle={visibleParts[currentPart]?.title ?? ''}
                stepDescription={visibleParts[currentPart]?.description ?? ''}
                stepIndex={currentPart}
                totalSteps={visibleParts.length}
              />
              {visibleParts[currentPart]?.id === 'algorithm-families' && (
                <AlgorithmFamilyWorkshop
                  key={`families-${configKey}`}
                  onComplete={() => markStepComplete(MODULE_ID, 'algorithm-families')}
                />
              )}
              {visibleParts[currentPart]?.id === 'algorithm-comparison' && (
                <AlgorithmComparisonTable key={`comparison-${configKey}`} />
              )}
              {visibleParts[currentPart]?.id === 'key-generation' && (
                <KeyGenWorkshop
                  key={`keygen-${configKey}`}
                  onComplete={() => markStepComplete(MODULE_ID, 'key-generation')}
                />
              )}
              {visibleParts[currentPart]?.id === 'signature-demo' && (
                <SignatureDemo
                  key={`sigdemo-${configKey}`}
                  onComplete={() => markStepComplete(MODULE_ID, 'signature-demo')}
                />
              )}
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
              {currentPart === visibleParts.length - 1 ? (
                <Button
                  variant="ghost"
                  onClick={() => markStepComplete(MODULE_ID, visibleParts[currentPart].id)}
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

        {/* Exercises Tab */}
        <TabsContent value="exercises">
          <PQC101Exercises
            onNavigateToWorkshop={navigateToWorkshop}
            onSetWorkshopConfig={handleSetWorkshopConfig}
          />
        </TabsContent>

        {/* References Tab */}
        <TabsContent value="references">
          <ModuleReferencesTab moduleId="introduction" />
        </TabsContent>

        {/* Tools & Products Tab */}
        <TabsContent value="tools">
          <ModuleMigrateTab moduleId={MODULE_ID} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
