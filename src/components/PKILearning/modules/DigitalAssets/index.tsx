import React, { useState, useMemo, useEffect } from 'react'
import { Trash2, CheckCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useModuleStore } from '../../../../store/useModuleStore'
import { useOpenSSLStore } from '../../../OpenSSLStudio/store'
import { BitcoinFlow } from './flows/BitcoinFlow'
import { EthereumFlow } from './flows/EthereumFlow'
import { SolanaFlow } from './flows/SolanaFlow'
import { HDWalletFlow } from './flows/HDWalletFlow'
import { ProgressIndicator } from './components/ProgressIndicator'

export const DigitalAssetsModule: React.FC = () => {
  const navigate = useNavigate()
  const markStepComplete = useModuleStore((state) => state.markStepComplete)
  const resetProgress = useModuleStore((state) => state.resetProgress)
  const updateModuleProgress = useModuleStore((state) => state.updateModuleProgress)
  const { resetStore } = useOpenSSLStore()
  const [currentStep, setCurrentStep] = useState(0)

  // Track time spent
  useEffect(() => {
    const timer = setInterval(() => {
      const currentSpent = useModuleStore.getState().modules['digital-assets']?.timeSpent || 0
      updateModuleProgress('digital-assets', {
        timeSpent: currentSpent + 1,
      })
    }, 60000) // Update every minute

    return () => clearInterval(timer)
  }, [updateModuleProgress])

  const handleReset = () => {
    if (
      confirm(
        'Are you sure you want to reset the module? This will clear all generated keys and transactions.'
      )
    ) {
      resetProgress()
      resetStore()
      setCurrentStep(0)
    }
  }

  // Define steps with their components
  // We pass a dummy onBack to flows because navigation is now handled by the outer stepper
  // or we could wire it to go to previous step if we wanted.
  const steps = useMemo(
    () => [
      {
        id: 'bitcoin',
        title: 'Module 1: Bitcoin',
        description: 'Generate keys and sign transactions using secp256k1 and SHA-256.',
        component: <BitcoinFlow onBack={() => {}} />,
      },
      {
        id: 'ethereum',
        title: 'Module 2: Ethereum',
        description: 'Create Ethereum accounts and format RLP transactions.',
        component: <EthereumFlow onBack={() => setCurrentStep(0)} />,
      },
      {
        id: 'solana',
        title: 'Module 3: Solana',
        description: 'Work with Ed25519 keys and Solana Message structures.',
        component: <SolanaFlow onBack={() => setCurrentStep(1)} />,
      },
      {
        id: 'hd-wallet',
        title: 'Module 4: HD Wallet',
        description: 'Generate a Hierarchical Deterministic wallet for all chains.',
        component: <HDWalletFlow onBack={() => setCurrentStep(2)} />,
      },
    ],
    []
  )

  // Keyboard navigation (after steps definition)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && currentStep < steps.length - 1) {
        /* eslint-disable-next-line security/detect-object-injection */
        markStepComplete('digital-assets', steps[currentStep].id)
        setCurrentStep(currentStep + 1)
      } else if (e.key === 'ArrowLeft' && currentStep > 0) {
        setCurrentStep(currentStep - 1)
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentStep, markStepComplete, steps])

  return (
    <div className="max-w-7xl mx-auto overflow-x-hidden">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gradient mb-2">Digital Assets Program</h1>
          <p className="text-muted-foreground">
            Master the cryptographic primitives of major blockchains.
          </p>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-3 py-2 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20 transition-colors text-sm border border-red-500/20"
        >
          <Trash2 size={16} />
          Reset Module
        </button>
      </div>

      {/* Progress Indicator */}
      <ProgressIndicator currentStep={currentStep} totalSteps={steps.length} className="mb-6" />

      {/* Progress Steps */}
      <div className="mb-8 overflow-x-auto px-2 sm:px-0">
        <div className="flex justify-between relative min-w-max sm:min-w-0">
          {/* Connecting Line - hidden on mobile due to scrolling */}
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/10 -z-10 hidden sm:block" />

          {steps.map((step, idx) => (
            <button
              key={step.id}
              onClick={() => setCurrentStep(idx)}
              className={`flex flex-col items-center gap-2 group px-1 sm:px-2 ${idx === currentStep ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 transition-colors bg-background font-bold text-xs sm:text-base
                ${
                  idx === currentStep
                    ? 'border-primary text-primary shadow-[0_0_15px_rgba(0,255,157,0.3)]'
                    : idx < currentStep
                      ? 'border-green-500 text-green-500'
                      : 'border-white/20 text-muted-foreground'
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
      <div className="glass-panel p-8 min-h-[600px] animate-fade-in">
        <div className="mb-6 border-b border-white/10 pb-4">
          {/* eslint-disable-next-line security/detect-object-injection */}
          <h2 className="text-2xl font-bold text-foreground">{steps[currentStep].title}</h2>
          {/* eslint-disable-next-line security/detect-object-injection */}
          <p className="text-muted-foreground">{steps[currentStep].description}</p>
        </div>
        {/* eslint-disable-next-line security/detect-object-injection */}
        {steps[currentStep].component}
      </div>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 mt-6">
        <button
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          className="px-6 py-3 min-h-[44px] rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-50 transition-colors text-foreground"
        >
          ← Previous Step
        </button>

        {currentStep === steps.length - 1 ? (
          <button
            onClick={() => {
              /* eslint-disable-next-line security/detect-object-injection */
              markStepComplete('digital-assets', steps[currentStep].id)
              navigate('/learn')
            }}
            className="px-6 py-3 min-h-[44px] bg-success text-success-foreground font-bold rounded-lg hover:bg-success/90 transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle size={16} />
            Completed - Return to Learn
          </button>
        ) : (
          <button
            onClick={() => {
              // Mark current step as complete when moving next
              /* eslint-disable-next-line security/detect-object-injection */
              markStepComplete('digital-assets', steps[currentStep].id)
              setCurrentStep(Math.min(steps.length - 1, currentStep + 1))
            }}
            className="px-6 py-3 min-h-[44px] bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors"
          >
            Next Step →
          </button>
        )}
      </div>
    </div>
  )
}
