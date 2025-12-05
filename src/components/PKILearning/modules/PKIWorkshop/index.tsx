import React, { useState, useEffect } from 'react'
import { Trash2 } from 'lucide-react'
import { useModuleStore } from '../../../../store/useModuleStore'
import { useOpenSSLStore } from '../../../OpenSSLStudio/store'
import { CSRGenerator } from './CSRGenerator'
import { RootCAGenerator } from './RootCAGenerator'
import { CertSigner } from './CertSigner'
import { CertParser } from './CertParser'

export const PKIWorkshop: React.FC = () => {
  const markStepComplete = useModuleStore((state) => state.markStepComplete)
  const resetProgress = useModuleStore((state) => state.resetProgress)
  const updateModuleProgress = useModuleStore((state) => state.updateModuleProgress)
  const { resetStore } = useOpenSSLStore()
  const [currentStep, setCurrentStep] = useState(0)

  // Track time spent
  useEffect(() => {
    const timer = setInterval(() => {
      const currentSpent = useModuleStore.getState().modules['pki-workshop']?.timeSpent || 0
      updateModuleProgress('pki-workshop', {
        timeSpent: currentSpent + 1,
      })
    }, 60000) // Update every minute

    return () => clearInterval(timer)
  }, [updateModuleProgress])

  const handleReset = () => {
    if (
      confirm(
        'Are you sure you want to reset the workshop? This will clear all generated keys and certificates.'
      )
    ) {
      resetProgress()
      resetStore()
      setCurrentStep(0)
    }
  }

  const steps = React.useMemo(
    () => [
      {
        id: 'csr',
        title: 'Step 1: Generate CSR',
        description: 'Create a Certificate Signing Request using a key pair.',
        component: <CSRGenerator onComplete={() => markStepComplete('pki-workshop', 'csr')} />,
      },
      {
        id: 'root-ca',
        title: 'Step 2: Create Root CA',
        description: 'Generate a self-signed Root Certificate Authority.',
        component: (
          <RootCAGenerator onComplete={() => markStepComplete('pki-workshop', 'root-ca')} />
        ),
      },
      {
        id: 'sign',
        title: 'Step 3: Certificate Issuance',
        description: 'Use your Root CA to sign the CSR from Step 1.',
        component: <CertSigner onComplete={() => markStepComplete('pki-workshop', 'sign')} />,
      },
      {
        id: 'parse',
        title: 'Step 4: Parse Certificate',
        description: 'Inspect the details of your generated certificate.',
        component: <CertParser onComplete={() => markStepComplete('pki-workshop', 'parse')} />,
      },
    ],
    [markStepComplete]
  )

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gradient mb-2">PKI Workshop</h1>
          <p className="text-muted">Master the certificate lifecycle in 4 practical steps.</p>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-3 py-2 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20 transition-colors text-sm border border-red-500/20"
        >
          <Trash2 size={16} />
          Reset Workshop
        </button>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex justify-between relative">
          {/* Connecting Line */}
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/10 -z-10" />

          {steps.map((step, idx) => (
            <button
              key={step.id}
              onClick={() => setCurrentStep(idx)}
              className={`flex flex-col items-center gap-2 group ${idx === currentStep ? 'text-primary' : 'text-muted'}`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors bg-background font-bold
                ${
                  idx === currentStep
                    ? 'border-primary text-primary shadow-[0_0_15px_rgba(0,255,157,0.3)]'
                    : idx < currentStep
                      ? 'border-green-500 text-green-500'
                      : 'border-white/20 text-muted'
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
      <div className="glass-panel p-8 min-h-[500px] animate-fade-in">
        <div className="mb-6 border-b border-white/10 pb-4">
          {/* eslint-disable-next-line security/detect-object-injection */}
          <h2 className="text-2xl font-bold text-white">{steps[currentStep].title}</h2>
          {/* eslint-disable-next-line security/detect-object-injection */}
          <p className="text-muted">{steps[currentStep].description}</p>
        </div>
        {/* eslint-disable-next-line security/detect-object-injection */}
        {steps[currentStep].component}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <button
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          className="px-6 py-2 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-50 transition-colors text-white"
        >
          ← Previous Step
        </button>

        <button
          onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
          disabled={currentStep === steps.length - 1}
          className="px-6 py-2 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          Next Step →
        </button>
      </div>
    </div>
  )
}
