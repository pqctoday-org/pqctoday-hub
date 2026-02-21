/* eslint-disable security/detect-object-injection */
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Trash2, BarChart3, Grid3X3, GitCompare, Clock } from 'lucide-react'
import { QuantumThreatsIntroduction } from './components/QuantumThreatsIntroduction'
import { QuantumThreatsExercises, type WorkshopConfig } from './components/QuantumThreatsExercises'
import { SecurityLevelDegradation } from './workshop/SecurityLevelDegradation'
import { AlgorithmVulnerabilityMatrix } from './workshop/AlgorithmVulnerabilityMatrix'
import { KeySizeAnalyzer } from './workshop/KeySizeAnalyzer'
import { HNDLTimeline } from './workshop/HNDLTimeline'
import { useModuleStore } from '../../../../store/useModuleStore'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

const MODULE_ID = 'quantum-threats'

const PARTS = [
  {
    id: 'security-levels',
    title: 'Step 1: Security Level Degradation',
    description: 'See how quantum attacks reduce algorithm security.',
    icon: BarChart3,
  },
  {
    id: 'vulnerability-matrix',
    title: 'Step 2: Vulnerability Matrix',
    description: 'Full algorithm vs. quantum attack comparison.',
    icon: Grid3X3,
  },
  {
    id: 'key-size-analyzer',
    title: 'Step 3: Key Size Analyzer',
    description: 'Compare two algorithms side-by-side.',
    icon: GitCompare,
  },
  {
    id: 'hndl-timeline',
    title: 'Step 4: HNDL Timeline',
    description: 'Calculate your migration deadline.',
    icon: Clock,
  },
]

export const QuantumThreatsModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState('learn')
  const [currentPart, setCurrentPart] = useState(0)
  const [workshopConfig, setWorkshopConfig] = useState<WorkshopConfig | null>(null)
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

  // Navigate from Learn/Exercises to Workshop tab
  const navigateToWorkshop = useCallback(() => {
    markStepComplete(MODULE_ID, activeTab)
    setActiveTab('workshop')
  }, [activeTab, markStepComplete])

  // Exercise pre-configuration
  const handleSetWorkshopConfig = useCallback((config: WorkshopConfig) => {
    setCurrentPart(config.step)
    setWorkshopConfig(config)
    setConfigKey((prev) => prev + 1)
  }, [])

  // Part navigation within the Workshop tab
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

  // Reset handler
  const handleReset = () => {
    if (confirm('Restart Quantum Threats Module?')) {
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
          <h1 className="text-3xl font-bold text-gradient">Quantum Threat Mechanics</h1>
          <p className="text-muted-foreground mt-2">
            How quantum computers break RSA, ECC, and weaken AES — and why PQC algorithms survive.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="learn">Learn</TabsTrigger>
          <TabsTrigger value="workshop">Workshop</TabsTrigger>
          <TabsTrigger value="exercises">Exercises</TabsTrigger>
        </TabsList>

        {/* Learn Tab */}
        <TabsContent value="learn">
          <QuantumThreatsIntroduction onNavigateToWorkshop={navigateToWorkshop} />
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
            <div className="glass-panel p-8 min-h-[600px] animate-fade-in">
              <div className="mb-6 border-b border-border pb-4">
                <h2 className="text-2xl font-bold text-foreground">{PARTS[currentPart].title}</h2>
                <p className="text-muted-foreground">{PARTS[currentPart].description}</p>
              </div>
              {currentPart === 0 && (
                <SecurityLevelDegradation
                  key={`security-${configKey}`}
                  initialAlgorithm={workshopConfig?.algorithmA}
                />
              )}
              {currentPart === 1 && <AlgorithmVulnerabilityMatrix />}
              {currentPart === 2 && (
                <KeySizeAnalyzer
                  key={`keysize-${configKey}`}
                  initialAlgorithmA={workshopConfig?.algorithmA}
                  initialAlgorithmB={workshopConfig?.algorithmB}
                />
              )}
              {currentPart === 3 && <HNDLTimeline />}
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
              <button
                onClick={() => handlePartChange(Math.min(PARTS.length - 1, currentPart + 1))}
                disabled={currentPart === PARTS.length - 1}
                className="px-6 py-3 min-h-[44px] bg-primary text-black font-bold rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                Next Step &rarr;
              </button>
            </div>
          </div>
        </TabsContent>

        {/* Exercises Tab */}
        <TabsContent value="exercises">
          <QuantumThreatsExercises
            onNavigateToWorkshop={navigateToWorkshop}
            onSetWorkshopConfig={handleSetWorkshopConfig}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
