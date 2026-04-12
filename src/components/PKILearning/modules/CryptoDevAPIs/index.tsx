// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Trash2,
  Network,
  Languages,
  Code2,
  ShoppingCart,
  Package,
  Grid3X3,
  Shuffle,
  GitBranch,
} from 'lucide-react'
import { CryptoDevAPIsIntroduction } from './components/CryptoDevAPIsIntroduction'
import { CryptoDevAPIsExercises, type WorkshopConfig } from './components/CryptoDevAPIsExercises'
import { APIArchitectureExplorer } from './workshop/APIArchitectureExplorer'
import { LanguageEcosystemComparator } from './workshop/LanguageEcosystemComparator'
import { ProviderPatternWorkshop } from './workshop/ProviderPatternWorkshop'
import { BuildBuyAnalyzer } from './workshop/BuildBuyAnalyzer'
import { PQCLibraryExplorer } from './workshop/PQCLibraryExplorer'
import { PQCSupportMatrix } from './workshop/PQCSupportMatrix'
import { CryptoAgilityPatterns } from './workshop/CryptoAgilityPatterns'
import { MigrationDecisionLab } from './workshop/MigrationDecisionLab'
import { useModuleStore } from '@/store/useModuleStore'
import { getModuleDeepLink, useSyncDeepLink } from '@/hooks/useModuleDeepLink'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ModuleReferencesTab } from '../../common/ModuleReferencesTab'
import { ModuleMigrateTab } from '../../common/ModuleMigrateTab'
import { ModuleVisualTab } from '../../common/ModuleVisualTab'
import { WorkshopStepHeader } from '../../common/WorkshopStepHeader'
import { GlossaryAutoWrap } from '@/components/PKILearning/common/GlossaryAutoWrap'
import { Button } from '@/components/ui/button'

const MODULE_ID = 'crypto-dev-apis'

const PARTS = [
  {
    id: 'api-architecture-explorer',
    title: 'Step 1: API Architecture Explorer',
    description:
      'Compare JCA/JCE, OpenSSL, PKCS#11, CNG, Bouncy Castle, and JCProv — architecture diagrams, key objects, session models, and PQC readiness radar.',
    icon: Network,
  },
  {
    id: 'language-ecosystem',
    title: 'Step 2: Language Ecosystem Comparator',
    description:
      'Evaluate 7 languages (C++, Rust, Zig, Java, Python, Go, .NET) across memory safety, crypto ecosystem, FFI capability, and PQC binding availability.',
    icon: Languages,
  },
  {
    id: 'provider-patterns',
    title: 'Step 3: Provider Pattern Workshop',
    description:
      'Side-by-side code examples for KeyGen, Sign, Verify, Encrypt, and KEM Encapsulate across all APIs — highlighting the provider registration pattern.',
    icon: Code2,
  },
  {
    id: 'build-buy-oss',
    title: 'Step 4: Build vs Buy vs Open Source',
    description:
      'Interactive scoring wizard to recommend a sourcing strategy based on your regulatory requirements, team expertise, and PQC timeline. Real-world case studies included.',
    icon: ShoppingCart,
  },
  {
    id: 'pqc-library-explorer',
    title: 'Step 5: PQC Library Explorer',
    description:
      'Deep dive into 8 open-source PQC libraries (liboqs, AWS-LC, Bouncy Castle, pqcrypto, PQClean, BoringSSL, wolfSSL, Botan) with algorithm coverage, FIPS status, and dependency graph.',
    icon: Package,
  },
  {
    id: 'pqc-support-matrix',
    title: 'Step 6: PQC Support Matrix',
    description:
      'Interactive API × Algorithm support matrix with status badges, version requirements, code snippets per cell, and a roadmap timeline of PQC additions.',
    icon: Grid3X3,
  },
  {
    id: 'crypto-agility-patterns',
    title: 'Step 7: Crypto Agility Patterns',
    description:
      'Five design patterns for algorithm-agile code: provider abstraction, config-driven selection, hybrid/composite operations, algorithm negotiation, and feature flags.',
    icon: Shuffle,
  },
  {
    id: 'migration-decision-lab',
    title: 'Step 8: Migration Decision Lab',
    description:
      'Decision tree wizard from your current stack to recommended PQC migration path, with before/after code refactoring examples and cross-API interop patterns.',
    icon: GitBranch,
  },
]

export const CryptoDevAPIsModule: React.FC = () => {
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
    if (confirm('Restart Cryptographic APIs & Developer Languages Module?')) {
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
            Cryptographic APIs &amp; Developer Languages
          </h1>
          <p className="text-muted-foreground mt-2">
            Compare JCA/JCE, OpenSSL, PKCS#11, CNG, and Bouncy Castle across 7 languages — with PQC
            readiness, provider patterns, library selection, and migration guidance.
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
          <TabsTrigger value="tools">Tools &amp; Products</TabsTrigger>
        </TabsList>

        <TabsContent value="learn">
          <GlossaryAutoWrap>
            <CryptoDevAPIsIntroduction />
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
                                ? 'border-success text-success'
                                : 'border-border text-muted-foreground'
                          }`}
                      >
                        <Icon size={16} />
                      </div>
                      <span className="text-xs font-medium hidden lg:block max-w-[80px] text-center leading-tight">
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
              {currentPart === 0 && <APIArchitectureExplorer key={`api-arch-${configKey}`} />}
              {currentPart === 1 && <LanguageEcosystemComparator key={`lang-eco-${configKey}`} />}
              {currentPart === 2 && <ProviderPatternWorkshop key={`provider-${configKey}`} />}
              {currentPart === 3 && <BuildBuyAnalyzer key={`build-buy-${configKey}`} />}
              {currentPart === 4 && <PQCLibraryExplorer key={`pqc-lib-${configKey}`} />}
              {currentPart === 5 && <PQCSupportMatrix key={`pqc-matrix-${configKey}`} />}
              {currentPart === 6 && <CryptoAgilityPatterns key={`agility-${configKey}`} />}
              {currentPart === 7 && <MigrationDecisionLab key={`migration-${configKey}`} />}
            </div>

            {/* Step navigation */}
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
                  Complete Module
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
          <CryptoDevAPIsExercises
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
