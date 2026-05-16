// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Trash2, Workflow, Boxes, GitCompare, ShieldOff, Compass, Globe } from 'lucide-react'
import { useModuleStore } from '@/store/useModuleStore'
import { getModuleDeepLink, useSyncDeepLink } from '@/hooks/useModuleDeepLink'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ModuleReferencesTab } from '../../common/ModuleReferencesTab'
import { ModuleVisualTab } from '../../common/ModuleVisualTab'
import { WorkshopStepHeader } from '../../common/WorkshopStepHeader'
import { GlossaryAutoWrap } from '@/components/PKILearning/common/GlossaryAutoWrap'
import { Button } from '@/components/ui/button'
import { CandidatesIntroduction } from './components/CandidatesIntroduction'
import { CandidatesExercises, type WorkshopConfig } from './components/CandidatesExercises'
import { StandardizationLifecycle } from './workshop/StandardizationLifecycle'
import { FamilyMathExplainer } from './workshop/FamilyMathExplainer'
import { CandidateComparator } from './workshop/CandidateComparator'
import { CryptanalysisTimeline } from './workshop/CryptanalysisTimeline'
import { FutureRoundsForecaster } from './workshop/FutureRoundsForecaster'
import { WorldwideStandardizationMap } from './workshop/WorldwideStandardizationMap'
import type { FamilyId } from './data/families'

const MODULE_ID = 'pqc-candidates'

const PARTS = [
  {
    id: 'lifecycle',
    title: 'Step 1: Standardisation Lifecycle',
    description:
      'Pick a candidate and advance it through the NIST rounds; cryptanalysis events fire in context.',
    icon: Workflow,
  },
  {
    id: 'family-math',
    title: 'Step 2: Family Math Explainer',
    description:
      'Animated visualisers for MPCitH, multivariate, isogeny, and lattice constructions.',
    icon: Boxes,
  },
  {
    id: 'comparator',
    title: 'Step 3: Candidate Comparator',
    description: 'Sort, filter, and find the right candidate for a given use case across the nine.',
    icon: GitCompare,
  },
  {
    id: 'cryptanalysis',
    title: 'Step 4: Cryptanalysis Timeline',
    description:
      'Every attack and reparameterisation event, with the affected schemes and their response.',
    icon: ShieldOff,
  },
  {
    id: 'future-rounds',
    title: 'Step 5: Future Rounds Forecaster',
    description: 'Where each candidate is likely to land, and what comes after the 9.',
    icon: Compass,
  },
  {
    id: 'worldwide-map',
    title: 'Step 6: Worldwide Standardisation Map',
    description:
      'Parallel, aligned, and overlay tracks: KpqC, CACR, ISO/IEC, IETF, ETSI, CRYPTREC, BSI, ANSSI.',
    icon: Globe,
  },
]

export const PQCCandidatesModule: React.FC = () => {
  const deepLink = getModuleDeepLink({ maxStep: PARTS.length - 1 })
  const [activeTab, setActiveTab] = useState(deepLink.initialTab)
  const [currentPart, setCurrentPart] = useState(deepLink.initialStep)
  useSyncDeepLink(activeTab, currentPart)
  const [workshopConfig, setWorkshopConfig] = useState<WorkshopConfig | null>(null)
  const [configKey, setConfigKey] = useState(0)
  const startTimeRef = useRef(0)
  const { updateModuleProgress, markStepComplete } = useModuleStore()

  // Track module as in-progress on mount; accumulate time on unmount
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
    setCurrentPart(config.step)
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
    if (confirm('Restart PQC Candidates Module?')) {
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
          <h1 className="text-3xl font-bold text-gradient">
            PQC Candidates & Standardisation Lifecycle
          </h1>
          <p className="text-muted-foreground mt-2">
            How NIST evaluates new post-quantum mechanisms, the nine third-round signature on-ramp
            candidates across four math families, and the worldwide parallel tracks that decide what
            actually ships.
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
        </TabsList>

        <TabsContent value="learn">
          <GlossaryAutoWrap>
            <CandidatesIntroduction onNavigateToWorkshop={navigateToWorkshop} />
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

            {/* Step progress */}
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
                                ? 'border-status-success text-status-success'
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

            {/* Step content */}
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
                <StandardizationLifecycle
                  key={`lifecycle-${configKey}`}
                  initialCandidateId={workshopConfig?.candidateId}
                />
              )}
              {currentPart === 1 && (
                <FamilyMathExplainer
                  key={`family-${configKey}`}
                  initialFamilyId={workshopConfig?.familyId as FamilyId | undefined}
                />
              )}
              {currentPart === 2 && (
                <CandidateComparator
                  key={`comparator-${configKey}`}
                  initialCandidateId={workshopConfig?.candidateId}
                />
              )}
              {currentPart === 3 && <CryptanalysisTimeline />}
              {currentPart === 4 && <FutureRoundsForecaster />}
              {currentPart === 5 && <WorldwideStandardizationMap />}
            </div>

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

        <TabsContent value="exercises">
          <CandidatesExercises
            onNavigateToWorkshop={navigateToWorkshop}
            onSetWorkshopConfig={handleSetWorkshopConfig}
          />
        </TabsContent>

        <TabsContent value="references">
          <ModuleReferencesTab moduleId={MODULE_ID} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
