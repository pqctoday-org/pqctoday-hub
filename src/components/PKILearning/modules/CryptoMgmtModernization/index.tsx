// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Trash2,
  Gauge,
  Repeat,
  Package,
  DollarSign,
  LineChart,
  Search,
  BarChart3,
  GitFork,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Introduction } from './components/Introduction'
import { MaturityAssessment } from './workshop/MaturityAssessment'
import { InventoryLifecycleSimulator } from './workshop/InventoryLifecycleSimulator'
import { LibraryCBOMBuilder } from './workshop/LibraryCBOMBuilder'
import { NoRegretROIBuilder } from './workshop/NoRegretROIBuilder'
import { PostureKPIDesigner } from './workshop/PostureKPIDesigner'
import { ManagementToolsAudit } from './workshop/ManagementToolsAudit'
import { RiskAnalysisEngine } from './workshop/RiskAnalysisEngine'
import { MitigateMigrateWizard } from './workshop/MitigateMigrateWizard'
import { CryptoMgmtModernizationExercises } from './CryptoMgmtModernizationExercises'
import type { CbomExportItem } from './data/workshopTypes'
import { useModuleStore } from '@/store/useModuleStore'
import { getModuleDeepLink, useSyncDeepLink } from '@/hooks/useModuleDeepLink'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ModuleReferencesTab } from '../../common/ModuleReferencesTab'
import { ModuleMigrateTab } from '../../common/ModuleMigrateTab'
import { ModuleVisualTab } from '../../common/ModuleVisualTab'
import { WorkshopStepHeader } from '../../common/WorkshopStepHeader'
import { GlossaryAutoWrap } from '@/components/PKILearning/common/GlossaryAutoWrap'
import { CryptoAgilityProcessDiagram } from './visuals/CryptoAgilityProcessDiagram'

const MODULE_ID = 'crypto-mgmt-modernization'

const PARTS = [
  {
    id: 'maturity-assessment',
    title: 'Step 1: CPM Maturity Self-Assessment',
    description:
      'Score your organization across five pillars and four asset classes. Output: radar chart, gap narrative, and your next milestone.',
    icon: Gauge,
    cswp39Step: 'Govern · §5.1 — assess crypto posture baseline',
  },
  {
    id: 'inventory-lifecycle',
    title: 'Step 2: Inventory Lifecycle Simulator',
    description:
      'Walk sample assets through the six-stage operational loop: Discover → Classify → Score → Remediate → Attest → Reassess. Includes canonical CLM scenarios.',
    icon: Repeat,
    cswp39Step: 'Inventory · §5.2 — CLM operational loop',
  },
  {
    id: 'library-cbom-builder',
    title: 'Step 3: Library & Hardware CBOM Builder',
    description:
      'Map SBOMs into crypto-focused CBOMs, track library EoL, and monitor FIPS 140-3 Level 3 validation status for libraries and HSMs. Assets loaded here feed Steps 7 and 8.',
    icon: Package,
    cswp39Step: 'Inventory · §5.2 — asset-centric CBOM',
  },
  {
    id: 'no-regret-roi',
    title: 'Step 4: No-Regret ROI Builder',
    description:
      'Model ROI under quantum-happens and quantum-never-happens scenarios. Outage avoidance, CLM automation, FIPS-drift remediation, library-CVE response.',
    icon: DollarSign,
    cswp39Step: 'Govern · §5.1 — business case for the program',
  },
  {
    id: 'posture-kpi',
    title: 'Step 5: Posture KPI Dashboard Designer',
    description:
      'Pick board-ready KPIs across inventory, lifecycle/CLM, observability, and assurance/FIPS. Preview the stakeholder dashboard.',
    icon: LineChart,
    cswp39Step: 'Prioritise · §5.4 — KPI framework for the Risk Analysis Engine',
  },
  {
    id: 'management-tools-audit',
    title: 'Step 6: Management Tools Coverage Audit',
    description:
      'Rate your tooling coverage across the six CSWP.39 Management Tools categories. Produces a gap heatmap and priority recommendations.',
    icon: Search,
    cswp39Step: 'Identify Gaps · §5.3 — tool coverage audit',
  },
  {
    id: 'risk-analysis-engine',
    title: 'Step 7: Risk Analysis & Prioritisation Engine',
    description:
      'Score CBOM assets from Step 3 on FIPS status, ESV status, PQC readiness, and EoL. Output: prioritised remediation queue (Critical → Low).',
    icon: BarChart3,
    cswp39Step: 'Prioritise · §5.4 — risk-ranked asset queue',
  },
  {
    id: 'mitigate-migrate',
    title: 'Step 8: Implement — Mitigate or Migrate',
    description:
      'CSWP.39 §4.6 decision wizard: answer 5 crypto-agility questions about an asset and receive a Gateway (Mitigate) or Algorithm Replacement (Migrate) recommendation.',
    icon: GitFork,
    cswp39Step: 'Implement · §5.5 + §4.6 — gateway vs. migration decision',
  },
]

export const CryptoMgmtModernizationModule: React.FC = () => {
  const deepLink = getModuleDeepLink({ maxStep: PARTS.length - 1 })
  const [activeTab, setActiveTab] = useState(deepLink.initialTab)
  const [currentPart, setCurrentPart] = useState(deepLink.initialStep)
  const [cbomAssets, setCbomAssets] = useState<CbomExportItem[]>([])
  useSyncDeepLink(activeTab, currentPart)
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
    if (confirm('Restart Cryptographic Management Modernization module?')) {
      setCurrentPart(0)
      startTimeRef.current = Date.now()
      updateModuleProgress(MODULE_ID, {
        status: 'in-progress',
        completedSteps: [],
        timeSpent: 0,
      })
    }
  }

  const handleExerciseNavigate = useCallback(
    (step?: number) => {
      setCurrentPart(step ?? 0)
      markStepComplete(MODULE_ID, activeTab)
      setActiveTab('workshop')
    },
    [activeTab, markStepComplete]
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient">
            Cryptographic Management Modernization
          </h1>
          <p className="text-muted-foreground mt-2">
            Build a modern cryptographic posture management program across certificates, libraries,
            software, and keys. Iterative. Measurable. ROI-positive even if quantum never arrives.
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
            <Introduction onNavigateToWorkshop={navigateToWorkshop} />
          </GlossaryAutoWrap>
        </TabsContent>

        <TabsContent value="visual">
          <CryptoAgilityProcessDiagram />
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

            <div className="glass-panel p-4 sm:p-6 md:p-8 min-h-[400px] md:min-h-[600px] animate-fade-in">
              <WorkshopStepHeader
                moduleId={MODULE_ID}
                stepId={PARTS[currentPart].id}
                stepTitle={PARTS[currentPart].title}
                stepDescription={PARTS[currentPart].description}
                stepIndex={currentPart}
                totalSteps={PARTS.length}
                cswp39Step={PARTS[currentPart].cswp39Step}
              />
              {currentPart === 0 && <MaturityAssessment />}
              {currentPart === 1 && <InventoryLifecycleSimulator />}
              {currentPart === 2 && <LibraryCBOMBuilder onCbomExport={setCbomAssets} />}
              {currentPart === 3 && <NoRegretROIBuilder cbomAssets={cbomAssets} />}
              {currentPart === 4 && <PostureKPIDesigner />}
              {currentPart === 5 && <ManagementToolsAudit />}
              {currentPart === 6 && <RiskAnalysisEngine cbomAssets={cbomAssets} />}
              {currentPart === 7 && <MitigateMigrateWizard cbomAssets={cbomAssets} />}
            </div>

            <div className="flex flex-col sm:flex-row justify-between gap-3">
              <Button
                variant="ghost"
                onClick={() => handlePartChange(Math.max(0, currentPart - 1))}
                disabled={currentPart === 0}
                data-workshop-target="learn-stepper-prev"
                className="px-6 py-3 min-h-[44px] rounded-lg border border-border hover:bg-muted disabled:opacity-50 transition-colors text-foreground"
              >
                &larr; Previous Step
              </Button>
              {currentPart === PARTS.length - 1 ? (
                <Button
                  variant="gradient"
                  onClick={() => markStepComplete(MODULE_ID, PARTS[currentPart].id)}
                  data-workshop-target="learn-stepper-complete"
                  className="px-6 py-3 min-h-[44px] font-bold rounded-lg transition-colors"
                >
                  Complete Module
                </Button>
              ) : (
                <Button
                  variant="gradient"
                  onClick={() => handlePartChange(currentPart + 1)}
                  data-workshop-target="learn-stepper-next"
                  className="px-6 py-3 min-h-[44px] font-bold rounded-lg transition-colors"
                >
                  Next Step &rarr;
                </Button>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="exercises">
          <CryptoMgmtModernizationExercises onNavigateToWorkshop={handleExerciseNavigate} />
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
