// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Trash2, AlertTriangle, BookOpen, Rocket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Introduction } from './components/Introduction'
import { OPS_GUIDE_DATA } from './data'
import { RoleWhyItMatters, RoleWhatToLearn, RoleHowToAct } from '../../common/roleGuide'
import { useModuleStore } from '@/store/useModuleStore'
import { getModuleDeepLink, useSyncDeepLink } from '@/hooks/useModuleDeepLink'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ModuleReferencesTab } from '../../common/ModuleReferencesTab'
import { ModuleMigrateTab } from '../../common/ModuleMigrateTab'
import { ModuleVisualTab } from '../../common/ModuleVisualTab'
import { WorkshopStepHeader } from '../../common/WorkshopStepHeader'
import { GlossaryAutoWrap } from '@/components/PKILearning/common/GlossaryAutoWrap'

const MODULE_ID = 'ops-quantum-impact'

const PARTS = [
  {
    id: 'why-it-matters',
    title: 'Step 1: Why It Matters',
    description:
      'Understand how the quantum threat impacts certificate operations, VPN/SSH infrastructure, and deployment pipelines.',
    icon: AlertTriangle,
  },
  {
    id: 'what-to-learn',
    title: 'Step 2: What to Learn',
    description:
      'Identify operational skills needed for PQC certificate management, network protocol migration, and monitoring.',
    icon: BookOpen,
  },
  {
    id: 'how-to-act',
    title: 'Step 3: How to Act',
    description:
      'Build an operational action plan from infrastructure inventory to pilot migration execution.',
    icon: Rocket,
  },
]

function ExercisesTab() {
  const exercises = [
    {
      title: 'Scenario: Kubernetes Certificate Migration',
      prompt:
        'Your Kubernetes cluster uses cert-manager with Let\u2019s Encrypt for 500 TLS certificates. ML-DSA certificates are 10x larger. Walk through the impact on: CRD storage, etcd size limits, cert-manager renewal performance, and ingress controller memory. Use the workshop tools to plan the migration.',
    },
    {
      title: 'Scenario: VPN Fleet Upgrade',
      prompt:
        'Your organization has 2,000 remote workers on IPsec VPN with ECDH key exchange. 30% of VPN concentrators are end-of-life. Design the phased upgrade: which devices first, hybrid vs. pure PQC, monitoring thresholds, and rollback procedures.',
    },
    {
      title: 'Scenario: Monitoring Threshold Recalibration',
      prompt:
        'After PQC migration, your TLS handshake latency increases from 5ms to 12ms. Your alerting threshold is 10ms. Recalibrate monitoring: which metrics need new baselines, how to distinguish PQC-normal from degraded performance, and what new alerts to add.',
    },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-foreground mb-2">Ops Exercises</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Apply what you learned in the workshop to these operations-focused scenarios.
        </p>
        <div className="space-y-4">
          {exercises.map((exercise, idx) => (
            <div key={idx} className="glass-panel p-5 space-y-3">
              <h3 className="text-lg font-semibold text-foreground">{exercise.title}</h3>
              <p className="text-sm text-foreground/80">{exercise.prompt}</p>
              <div className="bg-muted/50 rounded-lg p-3 border border-border">
                <p className="text-xs text-muted-foreground italic">
                  Use the Why It Matters (Step 1), What to Learn (Step 2), and How to Act (Step 3)
                  tools in the Workshop tab to model your response.
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export const OpsQuantumImpactModule: React.FC = () => {
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
    if (confirm('Restart Ops Quantum Impact module?')) {
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
          <h1 className="text-3xl font-bold text-gradient">Ops Quantum Impact</h1>
          <p className="text-muted-foreground mt-2">
            Understand how the quantum threat impacts IT operations &mdash; certificates, VPN/SSH,
            monitoring, and deployment pipelines.
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
          <ModuleVisualTab moduleId={MODULE_ID} />
        </TabsContent>

        <TabsContent value="workshop">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="text-destructive hover:bg-destructive/10 border border-destructive/20"
              >
                <Trash2 size={16} />
                Reset
              </Button>
            </div>

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
                <RoleWhyItMatters key={`why-${configKey}`} data={OPS_GUIDE_DATA} />
              )}
              {currentPart === 1 && (
                <RoleWhatToLearn key={`what-${configKey}`} data={OPS_GUIDE_DATA} />
              )}
              {currentPart === 2 && <RoleHowToAct key={`how-${configKey}`} data={OPS_GUIDE_DATA} />}
            </div>

            <div className="flex flex-col sm:flex-row justify-between gap-3">
              <Button
                variant="outline"
                size="lg"
                onClick={() => handlePartChange(Math.max(0, currentPart - 1))}
                disabled={currentPart === 0}
              >
                &larr; Previous Step
              </Button>
              {currentPart === PARTS.length - 1 ? (
                <Button
                  variant="gradient"
                  size="lg"
                  onClick={() => markStepComplete(MODULE_ID, PARTS[currentPart].id)}
                >
                  Complete Module
                </Button>
              ) : (
                <Button size="lg" onClick={() => handlePartChange(currentPart + 1)}>
                  Next Step &rarr;
                </Button>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="exercises">
          <ExercisesTab />
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
