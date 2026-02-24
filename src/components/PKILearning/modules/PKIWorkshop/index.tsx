/* eslint-disable security/detect-object-injection */
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Trash2, FilePlus, Shield, FileCheck, FileSearch, XCircle, GitBranch } from 'lucide-react'
import { useModuleStore } from '../../../../store/useModuleStore'
import { useOpenSSLStore } from '../../../OpenSSLStudio/store'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { PKIIntroduction } from './components/PKIIntroduction'
import { PKIExercises } from './components/PKIExercises'
import { ModuleReferencesTab } from '../../common/ModuleReferencesTab'
import { CSRGenerator } from './CSRGenerator'
import { RootCAGenerator } from './RootCAGenerator'
import { CertSigner } from './CertSigner'
import { CertParser } from './CertParser'
import { CRLGenerator } from './CRLGenerator'
import { MTCComparison } from './MTCComparison'

const MODULE_ID = 'pki-workshop'

const PARTS = [
  {
    id: 'csr',
    title: 'Step 1: Generate CSR',
    description: 'Create a Certificate Signing Request using a key pair.',
    icon: FilePlus,
  },
  {
    id: 'root-ca',
    title: 'Step 2: Create Root CA',
    description: 'Generate a self-signed Root Certificate Authority.',
    icon: Shield,
  },
  {
    id: 'sign',
    title: 'Step 3: Certificate Issuance',
    description: 'Use your Root CA to sign the CSR from Step 1.',
    icon: FileCheck,
  },
  {
    id: 'parse',
    title: 'Step 4: Parse Certificate',
    description: 'Inspect the details of your generated certificate.',
    icon: FileSearch,
  },
  {
    id: 'revoke',
    title: 'Step 5: Revocation (CRL)',
    description: 'Generate an empty Certificate Revocation List (CRL) for your Root CA.',
    icon: XCircle,
  },
  {
    id: 'mtc',
    title: 'Step 6: MTC Comparison',
    description: 'Compare traditional certificate chains with Merkle Tree Certificates.',
    icon: GitBranch,
  },
]

export const PKIWorkshop: React.FC = () => {
  const [activeTab, setActiveTab] = useState('learn')
  const [currentStep, setCurrentStep] = useState(0)
  const startTimeRef = useRef(0)
  const { updateModuleProgress, markStepComplete, resetModuleProgress } = useModuleStore()
  const { resetStore } = useOpenSSLStore()

  // --- Module Progress Tracking ---
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

  // Track tab visits as completed steps
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

  const handleSetWorkshopStep = useCallback((step: number) => {
    setCurrentStep(step)
  }, [])

  // Part navigation — mark current part complete when moving forward
  const handlePartChange = useCallback(
    (newStep: number) => {
      if (newStep > currentStep) {
        markStepComplete(MODULE_ID, PARTS[currentStep].id)
      }
      setCurrentStep(newStep)
    },
    [currentStep, markStepComplete]
  )

  const handleReset = () => {
    if (
      confirm(
        'Are you sure you want to reset the workshop? This will clear all generated keys and certificates.'
      )
    ) {
      resetModuleProgress(MODULE_ID)
      resetStore()
      setCurrentStep(0)
    }
  }

  const handleComplete = () => {
    markStepComplete(MODULE_ID, PARTS[currentStep].id)
    updateModuleProgress(MODULE_ID, { status: 'completed' })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient">PKI Workshop</h1>
          <p className="text-muted-foreground mt-2">
            Learn PKI fundamentals, build certificate chains hands-on, and explore PQC migration.
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Learning sandbox — private keys are stored in your browser and should not be used in
            production.
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

        {/* Learn Tab */}
        <TabsContent value="learn">
          <PKIIntroduction onNavigateToWorkshop={navigateToWorkshop} />
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
                      onClick={() => setCurrentStep(idx)}
                      className={`flex flex-col items-center gap-2 group px-1 sm:px-2 ${idx === currentStep ? 'text-primary' : 'text-muted-foreground'}`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors bg-background font-bold
                          ${
                            idx === currentStep
                              ? 'border-primary text-primary shadow-[0_0_15px_hsl(var(--primary)/0.3)]'
                              : idx < currentStep
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
                <h2 className="text-2xl font-bold text-foreground">{PARTS[currentStep].title}</h2>
                <p className="text-muted-foreground">{PARTS[currentStep].description}</p>
              </div>

              {currentStep === 0 && (
                <CSRGenerator onComplete={() => markStepComplete(MODULE_ID, 'csr')} />
              )}
              {currentStep === 1 && (
                <RootCAGenerator onComplete={() => markStepComplete(MODULE_ID, 'root-ca')} />
              )}
              {currentStep === 2 && (
                <CertSigner onComplete={() => markStepComplete(MODULE_ID, 'sign')} />
              )}
              {currentStep === 3 && (
                <CertParser onComplete={() => markStepComplete(MODULE_ID, 'parse')} />
              )}
              {currentStep === 4 && (
                <CRLGenerator onComplete={() => markStepComplete(MODULE_ID, 'revoke')} />
              )}
              {currentStep === 5 && (
                <MTCComparison onComplete={() => markStepComplete(MODULE_ID, 'mtc')} />
              )}
            </div>

            {/* Part Navigation */}
            <div className="flex flex-col sm:flex-row justify-between gap-3">
              <button
                onClick={() => handlePartChange(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className="px-6 py-3 min-h-[44px] rounded-lg border border-border hover:bg-muted disabled:opacity-50 transition-colors text-foreground"
              >
                &larr; Previous Step
              </button>
              {currentStep === PARTS.length - 1 ? (
                <button
                  onClick={handleComplete}
                  className="px-6 py-3 min-h-[44px] bg-accent text-accent-foreground font-bold rounded-lg hover:bg-accent/90 transition-colors"
                >
                  Complete Module ✓
                </button>
              ) : (
                <button
                  onClick={() => handlePartChange(Math.min(PARTS.length - 1, currentStep + 1))}
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
          <PKIExercises
            onNavigateToWorkshop={navigateToWorkshop}
            onSetWorkshopStep={handleSetWorkshopStep}
          />
        </TabsContent>

        {/* References Tab */}
        <TabsContent value="references">
          <ModuleReferencesTab moduleId={MODULE_ID} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
