// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Trash2, Database, ListChecks, Scale, SlidersHorizontal, Map } from 'lucide-react'
import { DataAssetIntroduction } from './components/DataAssetIntroduction'
import { DataAssetExercises, type WorkshopConfig } from './components/DataAssetExercises'
import { AssetInventoryBuilder } from './workshop/AssetInventoryBuilder'
import { ClassificationChallenge } from './workshop/ClassificationChallenge'
import { SensitivityConflictResolver } from './workshop/SensitivityConflictResolver'
import { SensitivityScoringEngine } from './workshop/SensitivityScoringEngine'
import { PQCMigrationPriorityMap } from './workshop/PQCMigrationPriorityMap'
import { useModuleStore } from '@/store/useModuleStore'
import { getModuleDeepLink, useSyncDeepLink } from '@/hooks/useModuleDeepLink'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ModuleReferencesTab } from '../../common/ModuleReferencesTab'
import { ModuleMigrateTab } from '../../common/ModuleMigrateTab'
import {
  DEFAULT_ASSETS,
  ESTIMATED_CRQC_YEAR,
  type DataAsset,
  type ScoredAsset,
} from './data/sensitivityConstants'

const MODULE_ID = 'data-asset-sensitivity'

const PARTS = [
  {
    id: 'asset-inventory',
    title: 'Step 1: Asset Inventory',
    description:
      'Catalog your data assets with type, sensitivity tier, retention period, and encryption details.',
    icon: Database,
  },
  {
    id: 'classification-challenge',
    title: 'Step 2: Classification Challenge',
    description:
      'Classify 10 real-world data scenarios using the four-tier model — get immediate feedback with HNDL implications.',
    icon: ListChecks,
  },
  {
    id: 'conflict-resolver',
    title: 'Step 3: Conflict Resolver',
    description:
      'Resolve multi-framework sensitivity conflicts: when GDPR, HIPAA, CNSA 2.0, and FIPS 140-3 disagree, which tier governs?',
    icon: Scale,
  },
  {
    id: 'sensitivity-scoring',
    title: 'Step 4: Sensitivity Scoring',
    description:
      'Score each asset across 4 weighted dimensions to produce a composite PQC urgency score.',
    icon: SlidersHorizontal,
  },
  {
    id: 'priority-map',
    title: 'Step 5: Priority Map',
    description:
      'Your prioritized PQC migration list with recommended algorithms and compliance deadlines.',
    icon: Map,
  },
]

export const DataAssetSensitivityModule: React.FC = () => {
  const deepLink = getModuleDeepLink({ maxStep: PARTS.length - 1 })
  const [activeTab, setActiveTab] = useState(deepLink.initialTab)
  const [currentPart, setCurrentPart] = useState(deepLink.initialStep)
  useSyncDeepLink(activeTab, currentPart)
  const [configKey, setConfigKey] = useState(0)
  const startTimeRef = useRef(0)
  const { updateModuleProgress, markStepComplete } = useModuleStore()

  // ── Shared state lifted from workshop steps ────────────────────────────────
  const [assets, setAssets] = useState<DataAsset[]>([...DEFAULT_ASSETS])
  const [scoredAssets, setScoredAssets] = useState<ScoredAsset[]>([])
  const [crqcYear, setCrqcYear] = useState(ESTIMATED_CRQC_YEAR)

  // Derive mandates from assets' compliance flags (replaces ComplianceMatrix selection)
  // Must be memoized — a new array reference every render would cascade into the
  // SensitivityScoringEngine's useMemo chain and cause a setState-during-render loop.
  const derivedMandates = useMemo(
    () => [...new Set(assets.flatMap((a) => a.complianceFlags))],
    [assets]
  )

  // ── Time tracking ──────────────────────────────────────────────────────────
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

  // ── Tab change ─────────────────────────────────────────────────────────────
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

  // ── Step navigation ────────────────────────────────────────────────────────
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

  // ── Reset ──────────────────────────────────────────────────────────────────
  const handleReset = () => {
    if (confirm('Restart Data & Asset Sensitivity Assessment module?')) {
      setAssets([...DEFAULT_ASSETS])
      setScoredAssets([])
      setCrqcYear(ESTIMATED_CRQC_YEAR)
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
          <h1 className="text-3xl font-bold text-gradient">
            Data &amp; Asset Sensitivity Assessment
          </h1>
          <p className="text-muted-foreground mt-2">
            Classify your data assets, map compliance obligations across GDPR, HIPAA, NIS2, and CNSA
            2.0, then generate a prioritized PQC migration list using NIST RMF, ISO 27005, FAIR, and
            DORA methodologies.
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

        {/* ── Learn Tab ─────────────────────────────────────────────────── */}
        <TabsContent value="learn">
          <DataAssetIntroduction onNavigateToWorkshop={navigateToWorkshop} />
        </TabsContent>

        {/* ── Workshop Tab ──────────────────────────────────────────────── */}
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

            {/* Step Progress */}
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

              {currentPart === 0 && (
                <AssetInventoryBuilder
                  key={`inventory-${configKey}`}
                  assets={assets}
                  onAssetsChange={setAssets}
                  crqcYear={crqcYear}
                  onCrqcYearChange={setCrqcYear}
                />
              )}
              {currentPart === 1 && (
                <ClassificationChallenge key={`classification-${configKey}`} assets={assets} />
              )}
              {currentPart === 2 && (
                <SensitivityConflictResolver key={`conflict-${configKey}`} assets={assets} />
              )}
              {currentPart === 3 && (
                <SensitivityScoringEngine
                  key={`scoring-${configKey}`}
                  assets={assets}
                  selectedMandates={derivedMandates}
                  onScoredAssetsChange={setScoredAssets}
                  crqcYear={crqcYear}
                />
              )}
              {currentPart === 4 && (
                <PQCMigrationPriorityMap
                  key={`priority-${configKey}`}
                  assets={assets}
                  selectedMandates={derivedMandates}
                  scoredAssets={scoredAssets}
                />
              )}
            </div>

            {/* Step Navigation */}
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

        {/* ── Exercises Tab ─────────────────────────────────────────────── */}
        <TabsContent value="exercises">
          <DataAssetExercises
            onNavigateToWorkshop={navigateToWorkshop}
            onSetWorkshopConfig={handleSetWorkshopConfig}
          />
        </TabsContent>

        {/* ── References Tab ────────────────────────────────────────────── */}
        <TabsContent value="references">
          <ModuleReferencesTab moduleId={MODULE_ID} />
        </TabsContent>

        {/* ── Tools Tab ─────────────────────────────────────────────────── */}
        <TabsContent value="tools">
          <ModuleMigrateTab moduleId={MODULE_ID} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
