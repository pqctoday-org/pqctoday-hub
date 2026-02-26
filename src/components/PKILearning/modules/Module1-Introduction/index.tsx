/* eslint-disable security/detect-object-injection */
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Trash2, BarChart3, KeyRound, PenLine, Shapes } from 'lucide-react'
import { useModuleStore } from '@/store/useModuleStore'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { PQC101Module } from './PQC101Module'
import { ModuleReferencesTab } from '../../common/ModuleReferencesTab'
import { ModuleMigrateTab } from '../../common/ModuleMigrateTab'
import { AlgorithmFamilyWorkshop } from './AlgorithmFamilyWorkshop'
import { AlgorithmComparisonTable } from './AlgorithmComparisonTable'
import { KeyGenWorkshop } from './KeyGenWorkshop'
import { SignatureDemo } from './SignatureDemo'
import { PQC101Exercises, type WorkshopConfig } from './PQC101Exercises'

const MODULE_ID = 'pqc-101'

const PARTS = [
  {
    id: 'algorithm-families',
    title: 'Step 1: Why PQC Works',
    description:
      'Explore why lattice, hash-based, and code-based algorithms resist quantum computers.',
    icon: Shapes,
  },
  {
    id: 'algorithm-comparison',
    title: 'Step 2: Algorithm Comparison',
    description: 'Compare classical and post-quantum algorithms side-by-side.',
    icon: BarChart3,
  },
  {
    id: 'key-generation',
    title: 'Step 3: Key Generation',
    description: 'Generate a real key pair with OpenSSL and observe size differences.',
    icon: KeyRound,
  },
  {
    id: 'signature-demo',
    title: 'Step 4: Signature Demo',
    description: 'Sign a message and see how digital signatures prove authenticity.',
    icon: PenLine,
  },
]

export const Module1: React.FC = () => {
  const { markStepComplete, updateModuleProgress } = useModuleStore()
  const [activeTab, setActiveTab] = useState(() => {
    const tab = new URLSearchParams(window.location.search).get('tab')
    return tab === 'learn' || tab === 'workshop' ? tab : 'learn'
  })
  const [currentPart, setCurrentPart] = useState(0)
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
      const partIds = PARTS.map((p) => p.id)
      if (newPart > currentPart) {
        markStepComplete(MODULE_ID, partIds[currentPart])
      }
      setCurrentPart(newPart)
    },
    [currentPart, markStepComplete]
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
          <TabsTrigger value="learn">Learn</TabsTrigger>
          <TabsTrigger value="workshop">Workshop</TabsTrigger>
          <TabsTrigger value="exercises">Exercises</TabsTrigger>
          <TabsTrigger value="references">References</TabsTrigger>
          <TabsTrigger value="tools">Tools & Products</TabsTrigger>
        </TabsList>

        {/* Learn Tab */}
        <TabsContent value="learn">
          <PQC101Module />
          <div className="mt-6 flex justify-end">
            <button
              onClick={navigateToWorkshop}
              className="px-6 py-2 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 transition-colors"
            >
              Go to Workshop &rarr;
            </button>
          </div>
        </TabsContent>

        {/* Workshop Tab */}
        <TabsContent value="workshop">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Reset button */}
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
            <div className="glass-panel p-8 min-h-[400px] md:min-h-[600px] animate-fade-in">
              <div className="mb-6 border-b border-border pb-4">
                <h2 className="text-2xl font-bold text-foreground">{PARTS[currentPart].title}</h2>
                <p className="text-muted-foreground">{PARTS[currentPart].description}</p>
              </div>
              {currentPart === 0 && (
                <AlgorithmFamilyWorkshop
                  key={`families-${configKey}`}
                  onComplete={() => markStepComplete(MODULE_ID, 'algorithm-families')}
                />
              )}
              {currentPart === 1 && <AlgorithmComparisonTable key={`comparison-${configKey}`} />}
              {currentPart === 2 && (
                <KeyGenWorkshop
                  key={`keygen-${configKey}`}
                  onComplete={() => markStepComplete(MODULE_ID, 'key-generation')}
                />
              )}
              {currentPart === 3 && (
                <SignatureDemo
                  key={`sigdemo-${configKey}`}
                  onComplete={() => markStepComplete(MODULE_ID, 'signature-demo')}
                />
              )}
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
                  Complete Module ✓
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
