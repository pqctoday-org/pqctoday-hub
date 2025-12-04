import React, { useState, useEffect } from 'react'
import { useModuleStore } from '../../../../store/useModuleStore'
import { KeyGenWorkshop } from './KeyGenWorkshop'
import { SignatureDemo } from './SignatureDemo'

export const Module1: React.FC = () => {
  const { markStepComplete } = useModuleStore()

  const [currentStep, setCurrentStep] = useState(0)

  // Restore last position
  useEffect(() => {
    // Simple restoration logic
    // In a real app we'd map 'lastStep' index to the UI
  }, [])

  const steps = [
    {
      id: 'theory',
      title: 'Theory: What is PKI?',
      component: (
        <div className="prose prose-invert max-w-none">
          <h3>Public Key Infrastructure (PKI)</h3>
          <p>PKI is the foundation of secure communication on the internet. It uses two keys:</p>
          <ul>
            <li>
              <strong>Public Key:</strong> Shared with everyone. Used to encrypt messages or verify
              signatures.
            </li>
            <li>
              <strong>Private Key:</strong> Kept secret. Used to decrypt messages or create
              signatures.
            </li>
          </ul>
          <p>In this module, you will generate your own key pair and use it to sign a message.</p>
        </div>
      ),
    },
    {
      id: 'keygen',
      title: 'Workshop: Key Generation',
      component: <KeyGenWorkshop onComplete={() => markStepComplete('module-1', 'keygen')} />,
    },
    {
      id: 'signature',
      title: 'Demo: Digital Signatures',
      component: <SignatureDemo onComplete={() => markStepComplete('module-1', 'signature')} />,
    },
  ]

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gradient mb-6">Module 1: Introduction to PKI</h1>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex justify-between relative">
          {/* Connecting Line */}
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/10 -z-10" />

          {steps.map((step, idx) => (
            <button
              key={step.id}
              onClick={() => setCurrentStep(idx)}
              className={`flex flex-col items-center gap-2 group ${
                idx === currentStep ? 'text-primary' : 'text-muted'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors bg-background
                ${
                  idx === currentStep
                    ? 'border-primary text-primary'
                    : idx < currentStep
                      ? 'border-green-500 text-green-500'
                      : 'border-white/20 text-muted'
                }
              `}
              >
                {idx + 1}
              </div>
              <span className="text-sm font-medium">{step.title.split(':')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="glass-panel p-8 min-h-[400px]">
        {/* eslint-disable-next-line security/detect-object-injection */}
        <h2 className="text-2xl font-bold text-white mb-6">{steps[currentStep].title}</h2>
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
          ← Previous
        </button>

        <button
          onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
          disabled={currentStep === steps.length - 1}
          className="px-6 py-2 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          Next →
        </button>
      </div>
    </div>
  )
}
