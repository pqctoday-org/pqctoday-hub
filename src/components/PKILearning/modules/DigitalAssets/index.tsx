import React, { useState, useMemo, useEffect } from 'react'
import { Trash2 } from 'lucide-react'
import { useModuleStore } from '../../../../store/useModuleStore'
import { useOpenSSLStore } from '../../../OpenSSLStudio/store'
import { BitcoinFlow } from './flows/BitcoinFlow'
import { EthereumFlow } from './flows/EthereumFlow'
import { SolanaFlow } from './flows/SolanaFlow'
import { HDWalletImplementation } from './HDWalletImplementation'

export const DigitalAssetsModule: React.FC = () => {
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
        title: 'Step 1: Bitcoin',
        description: 'Generate keys and sign transactions using secp256k1 and SHA-256.',
        component: <BitcoinFlow onBack={() => {}} />,
      },
      {
        id: 'ethereum',
        title: 'Step 2: Ethereum',
        description: 'Create Ethereum accounts and format RLP transactions.',
        component: <EthereumFlow onBack={() => setCurrentStep(0)} />,
      },
      {
        id: 'solana',
        title: 'Step 3: Solana',
        description: 'Work with Ed25519 keys and Solana Message structures.',
        component: <SolanaFlow onBack={() => setCurrentStep(1)} />,
      },
      {
        id: 'hd-wallet',
        title: 'Step 4: HD Wallet',
        description: 'Generate a Hierarchical Deterministic wallet for all chains.',
        component: <HDWalletImplementation onBack={() => setCurrentStep(2)} />,
      },
    ],
    []
  )

  return (
    <div className="max-w-7xl mx-auto">
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

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex justify-between relative">
          {/* Connecting Line */}
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/10 -z-10" />

          {steps.map((step, idx) => (
            <button
              key={step.id}
              onClick={() => setCurrentStep(idx)}
              className={`flex flex-col items-center gap-2 group ${idx === currentStep ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors bg-background font-bold
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
          <h2 className="text-2xl font-bold text-foreground">{steps[currentStep].title}</h2>
          <p className="text-muted-foreground">{steps[currentStep].description}</p>
        </div>
        {steps[currentStep].component}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <button
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          className="px-6 py-2 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-50 transition-colors text-foreground"
        >
          ← Previous Step
        </button>

        <button
          onClick={() => {
            // Mark current step as complete when moving next
            markStepComplete('digital-assets', steps[currentStep].id)
            setCurrentStep(Math.min(steps.length - 1, currentStep + 1))
          }}
          disabled={currentStep === steps.length - 1}
          className="px-6 py-2 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          Next Step →
        </button>
      </div>
    </div>
  )
}
