import React, { useState, useMemo, useEffect } from 'react'
import {
  Trash2,
  CheckCircle,
  Shield,
  FileText,
  PenTool,
  Building2,
  CheckSquare,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useModuleStore } from '../../../../store/useModuleStore'
import { useOpenSSLStore } from '../../../OpenSSLStudio/store'
import { WalletActivationFlow } from './flows/WalletActivationFlow'
import { PIDIssuanceFlow } from './flows/PIDIssuanceFlow'
import { AttestationIssuanceFlow } from './flows/AttestationIssuanceFlow'
import { QESProviderFlow } from './flows/QESProviderFlow'
import { RelyingPartyFlow } from './flows/RelyingPartyFlow'
import { ProgressIndicator } from './components/ProgressIndicator'

export const DigitalIDModule: React.FC = () => {
  const navigate = useNavigate()
  const markStepComplete = useModuleStore((state) => state.markStepComplete)
  const resetProgress = useModuleStore((state) => state.resetProgress)
  const updateModuleProgress = useModuleStore((state) => state.updateModuleProgress)
  const { resetStore } = useOpenSSLStore()
  const [currentStep, setCurrentStep] = useState(0)

  // Track time spent
  useEffect(() => {
    const timer = setInterval(() => {
      const currentSpent = useModuleStore.getState().modules['digital-id']?.timeSpent || 0
      updateModuleProgress('digital-id', {
        timeSpent: currentSpent + 1,
      })
    }, 60000) // Update every minute

    return () => clearInterval(timer)
  }, [updateModuleProgress])

  const handleReset = () => {
    if (
      confirm(
        'Are you sure you want to reset the module? This will clear all generated keys and credentials.'
      )
    ) {
      resetProgress()
      resetStore()
      setCurrentStep(0)
    }
  }

  // Define steps with their components
  const steps = useMemo(
    () => [
      {
        id: 'wallet-activation',
        title: 'Module 1: Wallet & HSM',
        description: 'Activate EUDI Wallet with Remote HSM and WUA issuance.',
        component: <WalletActivationFlow onBack={() => {}} />,
        icon: Shield,
      },
      {
        id: 'pid-issuance',
        title: 'Module 2: PID Issuer',
        description: 'Issue mDL/PID using OpenID4VCI protocol.',
        component: <PIDIssuanceFlow onBack={() => {}} />,
        icon: FileText,
      },
      {
        id: 'attestation',
        title: 'Module 3: Attestation',
        description: 'Issue university diploma with SD-JWT.',
        component: <AttestationIssuanceFlow onBack={() => {}} />,
        icon: CheckSquare,
      },
      {
        id: 'qes',
        title: 'Module 4: QES Provider',
        description: 'Remote qualified signature with CSC API.',
        component: <QESProviderFlow onBack={() => {}} />,
        icon: PenTool,
      },
      {
        id: 'relying-party',
        title: 'Module 5: Relying Party',
        description: 'Verify credentials using OpenID4VP.',
        component: <RelyingPartyFlow onBack={() => {}} />,
        icon: Building2,
      },
    ],
    []
  )

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && currentStep < steps.length - 1) {
        /* eslint-disable-next-line security/detect-object-injection */
        markStepComplete('digital-id', steps[currentStep].id)
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
          <h1 className="text-3xl font-bold text-gradient mb-2">EUDI Digital Identity Wallet</h1>
          <p className="text-muted-foreground">
            Master the European Digital Identity ecosystem: Wallet, PID, Attestations, QES, and
            Verification.
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

          {steps.map((step, idx) => {
            const Icon = step.icon
            return (
              <button
                key={step.id}
                onClick={() => setCurrentStep(idx)}
                className={`flex flex-col items-center gap-2 group px-1 sm:px-2 ${idx === currentStep ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 transition-colors bg-background
                  ${
                    idx === currentStep
                      ? 'border-primary text-primary shadow-[0_0_15px_rgba(0,255,157,0.3)]'
                      : idx < currentStep
                        ? 'border-green-500 text-green-500'
                        : 'border-white/20 text-muted-foreground'
                  }
                `}
                >
                  <Icon size={18} />
                </div>
                <span className="text-sm font-medium hidden md:block">
                  {step.title.split(':')[1]?.trim() || step.title}
                </span>
              </button>
            )
          })}
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
          ← Previous Module
        </button>

        {currentStep === steps.length - 1 ? (
          <button
            onClick={() => {
              /* eslint-disable-next-line security/detect-object-injection */
              markStepComplete('digital-id', steps[currentStep].id)
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
              markStepComplete('digital-id', steps[currentStep].id)
              setCurrentStep(Math.min(steps.length - 1, currentStep + 1))
            }}
            className="px-6 py-3 min-h-[44px] bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors"
          >
            Next Module →
          </button>
        )}
      </div>
    </div>
  )
}
