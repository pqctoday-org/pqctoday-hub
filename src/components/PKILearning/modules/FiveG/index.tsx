/* eslint-disable security/detect-object-injection */
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { Trash2, CheckCircle, Shield, Lock, Server } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { SuciFlow } from './SuciFlow'
import { AuthFlow } from './AuthFlow'
import { ProvisioningFlow } from './ProvisioningFlow'
import { useModuleStore } from '../../../../store/useModuleStore'

const MODULE_ID = '5g-security'

export const FiveGModule: React.FC = () => {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const startTimeRef = useRef(0)
  const { updateModuleProgress, markStepComplete } = useModuleStore()

  // Track module as in-progress on mount
  useEffect(() => {
    startTimeRef.current = Date.now()
    updateModuleProgress(MODULE_ID, {
      status: 'in-progress',
      lastVisited: Date.now(),
    })

    // Accumulate time on unmount
    return () => {
      const elapsed = Date.now() - startTimeRef.current
      const current = useModuleStore.getState().modules[MODULE_ID]
      updateModuleProgress(MODULE_ID, {
        timeSpent: (current?.timeSpent || 0) + elapsed,
      })
    }
  }, [updateModuleProgress])

  const handleStepChange = useCallback(
    (newStep: number) => {
      // Mark the part we're leaving as complete
      const partIds = ['suci', 'auth', 'provisioning']
      if (newStep > currentStep) {
        markStepComplete(MODULE_ID, partIds[currentStep])
      }
      setCurrentStep(newStep)
    },
    [currentStep, markStepComplete]
  )

  const handleComplete = useCallback(() => {
    markStepComplete(MODULE_ID, 'provisioning')
    const elapsed = Date.now() - startTimeRef.current
    const current = useModuleStore.getState().modules[MODULE_ID]
    updateModuleProgress(MODULE_ID, {
      status: 'completed',
      timeSpent: (current?.timeSpent || 0) + elapsed,
    })
    startTimeRef.current = Date.now() // Reset so unmount doesn't double-count
    navigate('/learn')
  }, [markStepComplete, updateModuleProgress, navigate])

  // Reset handler
  const handleReset = () => {
    if (confirm('Restart 5G Security Module?')) {
      setCurrentStep(0)
      startTimeRef.current = Date.now()
      updateModuleProgress(MODULE_ID, {
        status: 'in-progress',
        completedSteps: [],
        timeSpent: 0,
      })
    }
  }

  const steps = useMemo(
    () => [
      {
        id: 'suci',
        title: 'Part 1: SUCI Deconcealment',
        description: 'Subscriber Privacy & ECIES (Profile A/B/C).',
        component: <SuciFlow onBack={() => {}} />,
        icon: Shield,
      },
      {
        id: 'auth',
        title: 'Part 2: 5G-AKA Authentication',
        description: 'Mutual Authentication & MILENAGE Algorithm.',
        component: <AuthFlow onBack={() => setCurrentStep(0)} />,
        icon: Lock,
      },
      {
        id: 'provisioning',
        title: 'Part 3: SIM Key Provisioning',
        description: 'Supply Chain Security & Key Lifecycle.',
        component: <ProvisioningFlow onBack={() => setCurrentStep(1)} />,
        icon: Server,
      },
    ],
    []
  )

  return (
    <div className="max-w-7xl mx-auto overflow-x-hidden p-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gradient mb-2">5G Security Architecture</h1>
          <p className="text-muted-foreground">
            Master 3GPP security: Privacy, Authentication, and Provisioning.
          </p>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-3 py-2 bg-destructive/10 text-destructive rounded hover:bg-destructive/20 transition-colors text-sm border border-destructive/20"
        >
          <Trash2 size={16} />
          Reset
        </button>
      </div>

      {/* Progress Steps */}
      <div className="mb-8 overflow-x-auto px-2 sm:px-0">
        <div className="flex justify-between relative min-w-max sm:min-w-0">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/10 -z-10 hidden sm:block" />

          {steps.map((step, idx) => {
            const Icon = step.icon
            return (
              <button
                key={step.id}
                onClick={() => handleStepChange(idx)}
                className={`flex flex-col items-center gap-2 group px-1 sm:px-2 ${idx === currentStep ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors bg-background font-bold
                                        ${
                                          idx === currentStep
                                            ? 'border-primary text-primary shadow-[0_0_15px_hsl(var(--primary)/0.3)]'
                                            : idx < currentStep
                                              ? 'border-success text-success'
                                              : 'border-white/20 text-muted-foreground'
                                        }`}
                >
                  <Icon size={18} />
                </div>
                <span className="text-sm font-medium hidden md:block">
                  {step.title.split(':')[0]}
                </span>
              </button>
            )
          })}
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
      <div className="flex flex-col sm:flex-row justify-between gap-3 mt-6">
        <button
          onClick={() => handleStepChange(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          className="px-6 py-3 min-h-[44px] rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-50 transition-colors text-foreground"
        >
          ← Previous Part
        </button>

        {currentStep === steps.length - 1 ? (
          <button
            onClick={handleComplete}
            className="px-6 py-3 min-h-[44px] bg-success text-success-foreground font-bold rounded-lg hover:bg-success/90 transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle size={16} />
            Complete - Return to Dashboard
          </button>
        ) : (
          <button
            onClick={() => handleStepChange(Math.min(steps.length - 1, currentStep + 1))}
            className="px-6 py-3 min-h-[44px] bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors"
          >
            Next Part →
          </button>
        )}
      </div>
    </div>
  )
}
