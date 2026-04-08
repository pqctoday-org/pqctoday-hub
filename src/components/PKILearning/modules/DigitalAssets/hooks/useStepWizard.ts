// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import type { Step } from '../components/StepWizard'

interface UseStepWizardProps {
  steps: Step[]
  onBack: () => void
}

export const useStepWizard = ({ steps, onBack }: UseStepWizardProps) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [isExecuting, setIsExecuting] = useState(false)
  const [output, setOutput] = useState<string | Record<string, string> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isStepComplete, setIsStepComplete] = useState(false)

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1)
      setIsStepComplete(false)
      // DO NOT clear output on next so logs accumulate
      setError(null)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
      setIsStepComplete(false)
      // DO NOT clear output on back, user retains trace history
      setError(null)
    } else {
      onBack()
    }
  }

  const execute = async (action: () => Promise<string | Record<string, string>>) => {
    setIsExecuting(true)
    setError(null)

    try {
      const result = await action()

      setOutput((prev) => {
        const stepHeader = `[ STEP: ${steps[currentStep].title} ]`

        if (!prev) {
          if (typeof result === 'string') return stepHeader + '\n' + result
          const initialObj: Record<string, string> = {}
          for (const [k, v] of Object.entries(result)) {
            initialObj[k] = stepHeader + '\n' + v
          }
          return initialObj
        }

        // If both strings, prepend new result (newest at top)
        if (typeof prev === 'string' && typeof result === 'string') {
          return stepHeader + '\n' + result + '\n\n' + '━'.repeat(50) + '\n\n' + prev
        }

        // If both are objects (e.g. tabs) or mixed, append correctly
        const prevObj = typeof prev === 'string' ? { Output: prev } : prev
        const merged: Record<string, string> = { ...prevObj }

        const divider = '\n\n' + '━'.repeat(50) + '\n\n'

        if (typeof result === 'string') {
          // Generic string result should be visible in ALL current tabs to maintain flow continuity
          for (const key of Object.keys(merged)) {
            merged[key] = stepHeader + '\n' + result + divider + merged[key]
          }
        } else {
          // Merge objects (Prepend new results)
          for (const [key, val] of Object.entries(result)) {
            if (merged[key]) {
              merged[key] = stepHeader + '\n' + val + divider + merged[key]
            } else {
              merged[key] = stepHeader + '\n' + val
            }
          }
        }
        return merged
      })

      setIsStepComplete(true)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsExecuting(false)
    }
  }

  const reset = () => {
    setCurrentStep(0)
    setIsExecuting(false)
    setOutput(null)
    setError(null)
    setIsStepComplete(false)
  }

  return {
    currentStep,
    isExecuting,
    output,
    error,
    isStepComplete,
    handleNext,
    handleBack,
    execute,
    reset,
    setOutput, // Expose setters if manual control is needed
    setError,
    setIsStepComplete,
  }
}

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message
  return String(error)
}
