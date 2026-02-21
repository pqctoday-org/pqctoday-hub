/* eslint-disable security/detect-object-injection */
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Trash2, KeyRound, GitBranch, ShieldAlert } from 'lucide-react'
import { StatefulSigsIntroduction } from './components/StatefulSigsIntroduction'
import { StatefulSigsExercises, type WorkshopConfig } from './components/StatefulSigsExercises'
import { LMSKeyGenDemo } from './workshop/LMSKeyGenDemo'
import { XMSSKeyGenDemo } from './workshop/XMSSKeyGenDemo'
import { StateManagementVisualizer } from './workshop/StateManagementVisualizer'
import { useModuleStore } from '../../../../store/useModuleStore'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ModuleReferencesTab } from '../../common/ModuleReferencesTab'

const MODULE_ID = 'stateful-signatures'

const PARTS = [
  {
    id: 'lms-keygen',
    title: 'Step 1: LMS Key Generation',
    description: 'Explore LMS parameter sets, Merkle tree structure, and key/signature sizes.',
    icon: KeyRound,
  },
  {
    id: 'xmss-keygen',
    title: 'Step 2: XMSS Key Generation',
    description: 'Compare XMSS with LMS at equivalent security levels.',
    icon: GitBranch,
  },
  {
    id: 'state-management',
    title: 'Step 3: State Management',
    description: 'Simulate signing, key exhaustion, and catastrophic state loss.',
    icon: ShieldAlert,
  },
]

export const StatefulSignaturesModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState('learn')
  const [currentPart, setCurrentPart] = useState(0)
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
    setWorkshopConfig(config)
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
    if (confirm('Restart Stateful Hash Signatures Module?')) {
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
          <h1 className="text-3xl font-bold text-gradient">Stateful Hash Signatures (LMS/XMSS)</h1>
          <p className="text-muted-foreground mt-2">
            Master hash-based digital signatures &mdash; the most conservative post-quantum
            signature schemes, standardized in NIST SP 800-208.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="learn">Learn</TabsTrigger>
          <TabsTrigger value="workshop">Workshop</TabsTrigger>
          <TabsTrigger value="exercises">Exercises</TabsTrigger>
          <TabsTrigger value="references">References</TabsTrigger>
        </TabsList>

        <TabsContent value="learn">
          <StatefulSigsIntroduction onNavigateToWorkshop={navigateToWorkshop} />
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
            <div className="glass-panel p-8 min-h-[600px] animate-fade-in">
              <div className="mb-6 border-b border-border pb-4">
                <h2 className="text-2xl font-bold text-foreground">{PARTS[currentPart].title}</h2>
                <p className="text-muted-foreground">{PARTS[currentPart].description}</p>
              </div>
              {currentPart === 0 && (
                <LMSKeyGenDemo key={`lms-${configKey}`} initialParamId={workshopConfig?.paramId} />
              )}
              {currentPart === 1 && (
                <XMSSKeyGenDemo
                  key={`xmss-${configKey}`}
                  initialParamId={workshopConfig?.paramId}
                />
              )}
              {currentPart === 2 && <StateManagementVisualizer key={`state-${configKey}`} />}
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

        <TabsContent value="exercises">
          <StatefulSigsExercises
            onNavigateToWorkshop={navigateToWorkshop}
            onSetWorkshopConfig={handleSetWorkshopConfig}
          />
        </TabsContent>
        {/* References Tab */}
        <TabsContent value="references">
          <ModuleReferencesTab moduleId="stateful-signatures" />
        </TabsContent>
      </Tabs>
    </div>
  )
}
