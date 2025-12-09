import { useState } from 'react'
import type { Step } from '../components/StepWizard'

interface UseStepWizardProps {
  steps: Step[]
  onBack: () => void
}

export const useStepWizard = ({ steps, onBack }: UseStepWizardProps) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [isExecuting, setIsExecuting] = useState(false)
  const [output, setOutput] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isStepComplete, setIsStepComplete] = useState(false)

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1)
      setIsStepComplete(false)
      setOutput(null)
      setError(null)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
      setIsStepComplete(false)
      setOutput(null)
      setError(null)
    } else {
      onBack()
    }
  }

  const execute = async (action: () => Promise<string>) => {
    setIsExecuting(true)
    setError(null)
    setOutput(null)

    try {
      const result = await action()
      setOutput(result)
      setIsStepComplete(true)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsExecuting(false)
    }
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
    setOutput, // Expose setters if manual control is needed
    setError,
    setIsStepComplete,
  }
}

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message
  return String(error)
}
