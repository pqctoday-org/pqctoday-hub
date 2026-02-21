/* eslint-disable security/detect-object-injection */
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Trash2, Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useModuleStore } from '../../../../store/useModuleStore'
import { useOpenSSLStore } from '../../../OpenSSLStudio/store'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { PKIIntroduction } from './components/PKIIntroduction'
import { PKIExercises } from './components/PKIExercises'
import { CSRGenerator } from './CSRGenerator'
import { RootCAGenerator } from './RootCAGenerator'
import { CertSigner } from './CertSigner'
import { CertParser } from './CertParser'
import { CRLGenerator } from './CRLGenerator'

const MODULE_ID = 'pki-workshop'

export const PKIWorkshop: React.FC = () => {
  const [activeTab, setActiveTab] = useState('learn')
  const [currentStep, setCurrentStep] = useState(0)
  const startTimeRef = useRef(0)
  const navigate = useNavigate()
  const { updateModuleProgress, markStepComplete, resetModuleProgress } = useModuleStore()
  const { resetStore } = useOpenSSLStore()

  // --- Module Progress Tracking (mount/unmount elapsed pattern, matching TLS Basics) ---
  useEffect(() => {
    startTimeRef.current = Date.now() // Set in effect to avoid impure render call
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
    updateModuleProgress(MODULE_ID, { status: 'completed' })
    navigate('/learn')
  }

  const steps = React.useMemo(
    () => [
      {
        id: 'csr',
        title: 'Step 1: Generate CSR',
        description: 'Create a Certificate Signing Request using a key pair.',
        component: <CSRGenerator onComplete={() => markStepComplete(MODULE_ID, 'csr')} />,
      },
      {
        id: 'root-ca',
        title: 'Step 2: Create Root CA',
        description: 'Generate a self-signed Root Certificate Authority.',
        component: <RootCAGenerator onComplete={() => markStepComplete(MODULE_ID, 'root-ca')} />,
      },
      {
        id: 'sign',
        title: 'Step 3: Certificate Issuance',
        description: 'Use your Root CA to sign the CSR from Step 1.',
        component: <CertSigner onComplete={() => markStepComplete(MODULE_ID, 'sign')} />,
      },
      {
        id: 'parse',
        title: 'Step 4: Parse Certificate',
        description: 'Inspect the details of your generated certificate.',
        component: <CertParser onComplete={() => markStepComplete(MODULE_ID, 'parse')} />,
      },
      {
        id: 'revoke',
        title: 'Step 5: Revocation (CRL)',
        description: 'Generate an empty Certificate Revocation List (CRL) for your Root CA.',
        component: <CRLGenerator onComplete={() => markStepComplete(MODULE_ID, 'revoke')} />,
      },
    ],
    [markStepComplete]
  )

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
        </TabsList>

        {/* Learn Tab */}
        <TabsContent value="learn">
          <PKIIntroduction onNavigateToWorkshop={navigateToWorkshop} />
        </TabsContent>

        {/* Workshop Tab */}
        <TabsContent value="workshop">
          <div className="max-w-5xl mx-auto">
            {/* Reset button */}
            <div className="flex justify-end mb-4">
              <button
                onClick={handleReset}
                className="hidden md:flex items-center gap-2 px-3 py-2 bg-destructive/10 text-destructive rounded hover:bg-destructive/20 transition-colors text-sm border border-destructive/20"
              >
                <Trash2 size={16} />
                Reset Workshop
              </button>
            </div>

            {/* Progress Steps */}
            <div className="mb-8">
              <div className="flex justify-between relative">
                {/* Connecting Line */}
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border -z-10" />

                {steps.map((step, idx) => (
                  <button
                    key={step.id}
                    onClick={() => setCurrentStep(idx)}
                    className={`flex flex-col items-center gap-2 group ${idx === currentStep ? 'text-primary' : 'text-muted-foreground'}`}
                  >
                    <div
                      className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 transition-colors bg-background font-bold text-sm md:text-base
                      ${
                        idx === currentStep
                          ? 'border-primary text-primary shadow-glow'
                          : idx < currentStep
                            ? 'border-success text-success'
                            : 'border-border text-muted-foreground'
                      }
                    `}
                    >
                      {idx + 1}
                    </div>
                    <span className="text-sm font-medium hidden md:block">
                      {step.title.split(':')[1]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Content Area */}
            <div className="glass-panel p-4 md:p-8 min-h-[300px] md:min-h-[500px] animate-fade-in">
              <div className="mb-6 border-b border-border pb-4">
                <h2 className="text-xl md:text-2xl font-bold text-foreground">
                  {steps[currentStep].title}
                </h2>
                <p className="text-muted-foreground mt-2">{steps[currentStep].description}</p>
              </div>

              {steps[currentStep].component}
            </div>

            {/* Navigation */}
            <div className="flex justify-between mt-6">
              <button
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className="px-6 py-2 rounded-lg border border-border hover:bg-muted/50 disabled:opacity-50 transition-colors text-foreground"
              >
                &larr; Previous Step
              </button>

              {currentStep === steps.length - 1 ? (
                <button
                  onClick={handleComplete}
                  className="px-6 py-2 bg-success text-success-foreground font-bold rounded-lg hover:bg-success/90 transition-colors flex items-center gap-2"
                >
                  <Check size={20} />
                  Completed
                </button>
              ) : (
                <button
                  onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                  className="px-6 py-2 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 transition-colors"
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
      </Tabs>
    </div>
  )
}
