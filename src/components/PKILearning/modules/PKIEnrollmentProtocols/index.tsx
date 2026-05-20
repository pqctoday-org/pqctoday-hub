// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Trash2 } from 'lucide-react'
import { useModuleStore } from '@/store/useModuleStore'
import { getModuleDeepLink, useSyncDeepLink } from '@/hooks/useModuleDeepLink'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { ModuleTabBar } from '@/components/PKILearning/common/ModuleTabBar'
import { ModuleReferencesTab } from '../../common/ModuleReferencesTab'
import { ModuleMigrateTab } from '../../common/ModuleMigrateTab'
import { ModuleVisualTab } from '../../common/ModuleVisualTab'
import { WorkshopStepHeader } from '../../common/WorkshopStepHeader'
import { GlossaryAutoWrap } from '@/components/PKILearning/common/GlossaryAutoWrap'
import { Button } from '@/components/ui/button'
import { MODULE_ID, WORKSHOP_STEPS } from './constants'
import { EnrollmentIntroduction } from './components/EnrollmentIntroduction'
import { KeyGenStep } from './workshop/KeyGenStep'
import { CmpInitialReq } from './workshop/CmpInitialReq'
import { EstSimpleEnroll } from './workshop/EstSimpleEnroll'
import { CmpKemKeyUpdate } from './workshop/CmpKemKeyUpdate'
import { CompositeEnroll } from './workshop/CompositeEnroll'
import { CertViewer } from './workshop/CertViewer'

export const PKIEnrollmentProtocolsModule: React.FC = () => {
  const deepLink = getModuleDeepLink({ maxStep: WORKSHOP_STEPS.length - 1 })
  const [activeTab, setActiveTab] = useState(deepLink.initialTab)
  const [currentStep, setCurrentStep] = useState(deepLink.initialStep)
  useSyncDeepLink(activeTab, currentStep)
  const startTimeRef = useRef(0)
  const { updateModuleProgress, markStepComplete, modules } = useModuleStore()

  // Cross-step state — keypair + issued cert flow through the workshop sequence.
  const [eeKeyPem, setEeKeyPem] = useState<Uint8Array | null>(null)
  const [eeKeyAlgorithm, setEeKeyAlgorithm] = useState<string | null>(null)
  const [eeCertPem, setEeCertPem] = useState<Uint8Array | null>(null)

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

  const handleStepChange = useCallback(
    (newStep: number) => {
      const stepIds = WORKSHOP_STEPS.map((s) => s.id)
      if (newStep > currentStep) {
        markStepComplete(MODULE_ID, stepIds[currentStep], currentStep)
      }
      setCurrentStep(newStep)
    },
    [currentStep, markStepComplete]
  )

  const handleReset = () => {
    if (confirm('Restart PKI Enrollment Protocols module?')) {
      setCurrentStep(0)
      setEeKeyPem(null)
      setEeKeyAlgorithm(null)
      setEeCertPem(null)
      startTimeRef.current = Date.now()
      updateModuleProgress(MODULE_ID, {
        status: 'in-progress',
        completedSteps: [],
        timeSpent: 0,
      })
    }
  }

  const handleKeyReady = useCallback((algorithm: string, keyPem: Uint8Array) => {
    setEeKeyAlgorithm(algorithm)
    setEeKeyPem(keyPem)
  }, [])

  const workshopSteps = WORKSHOP_STEPS[MODULE_ID] ?? []
  const completedSteps = modules[MODULE_ID]?.completedSteps ?? []
  const workshopDone = workshopSteps.filter((s) => completedSteps.includes(s.id)).length
  const workshopDot = workshopDone > 0 && workshopDone < workshopSteps.length

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient">
            PKI Enrollment Protocols (EST &amp; CMP)
          </h1>
          <p className="text-muted-foreground mt-2">
            RFC 7030 (EST) and RFC 9810 (CMP, KEM update) — hands-on PQC certificate enrollment with
            real OpenSSL 3.6 WASM crypto + an in-browser mock CA.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <ModuleTabBar
          tabs={[
            { value: 'learn', label: 'Learn' },
            { value: 'visual', label: 'Visual' },
            { value: 'workshop', label: 'Workshop', hasDot: workshopDot },
            { value: 'references', label: 'References' },
            { value: 'tools', label: 'Tools & Products' },
          ]}
          value={activeTab}
          onValueChange={handleTabChange}
        />

        <TabsContent value="learn">
          <GlossaryAutoWrap>
            <EnrollmentIntroduction onNavigateToWorkshop={navigateToWorkshop} />
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

            <div className="overflow-x-auto px-2 sm:px-0">
              <div className="flex justify-evenly relative min-w-0">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border -z-10 hidden sm:block" />
                {WORKSHOP_STEPS.map((step, idx) => {
                  const Icon = step.icon
                  return (
                    <Button
                      variant="ghost"
                      key={step.id}
                      onClick={() => handleStepChange(idx)}
                      className={`flex flex-col items-center gap-1 group px-1 sm:px-2 py-1 h-auto ${
                        idx === currentStep ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors bg-background font-bold ${
                          idx === currentStep
                            ? 'border-primary text-primary shadow-[0_0_15px_hsl(var(--primary)/0.3)]'
                            : idx < currentStep
                              ? 'border-success text-success'
                              : 'border-border text-muted-foreground'
                        }`}
                      >
                        <Icon size={16} />
                      </div>
                      <span className="text-sm font-medium hidden md:block">
                        {step.title.split(':')[0]}
                      </span>
                    </Button>
                  )
                })}
              </div>
            </div>

            <div className="glass-panel p-4 sm:p-6 md:p-8 min-h-[400px] md:min-h-[600px] animate-fade-in">
              <WorkshopStepHeader
                moduleId={MODULE_ID}
                stepId={WORKSHOP_STEPS[currentStep].id}
                stepTitle={WORKSHOP_STEPS[currentStep].title}
                stepDescription={WORKSHOP_STEPS[currentStep].description}
                stepIndex={currentStep}
                totalSteps={WORKSHOP_STEPS.length}
              />
              {currentStep === 0 && <KeyGenStep onKeyReady={handleKeyReady} />}
              {currentStep === 1 && (
                <CmpInitialReq
                  eeKeyPem={eeKeyPem}
                  eeKeyAlgorithm={eeKeyAlgorithm}
                  onCertIssued={setEeCertPem}
                />
              )}
              {currentStep === 2 && (
                <EstSimpleEnroll
                  eeKeyPem={eeKeyPem}
                  eeKeyAlgorithm={eeKeyAlgorithm}
                  onCertIssued={setEeCertPem}
                />
              )}
              {currentStep === 3 && <CmpKemKeyUpdate />}
              {currentStep === 4 && <CompositeEnroll eeMlDsaCertPem={eeCertPem} />}
              {currentStep === 5 && <CertViewer eeCertPem={eeCertPem} />}
            </div>

            <div className="flex flex-col sm:flex-row justify-between gap-3">
              <Button
                variant="ghost"
                onClick={() => handleStepChange(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className="px-6 py-3 min-h-[44px] rounded-lg border border-border hover:bg-muted disabled:opacity-50 transition-colors text-foreground"
              >
                &larr; Previous Step
              </Button>
              {currentStep === WORKSHOP_STEPS.length - 1 ? (
                <Button
                  variant="gradient"
                  onClick={() => markStepComplete(MODULE_ID, WORKSHOP_STEPS[currentStep].id)}
                  className="px-6 py-3 min-h-[44px] font-bold rounded-lg transition-colors"
                >
                  Complete Module
                </Button>
              ) : (
                <Button
                  variant="gradient"
                  onClick={() => handleStepChange(currentStep + 1)}
                  className="px-6 py-3 min-h-[44px] font-bold rounded-lg transition-colors"
                >
                  Next Step &rarr;
                </Button>
              )}
            </div>
          </div>
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
