import React from 'react'
import type { Step } from '../DigitalAssets/components/StepWizard'
import { StepWizard } from '../DigitalAssets/components/StepWizard'
import { useStepWizard } from '../DigitalAssets/hooks/useStepWizard'
import { FIVE_G_CONSTANTS } from './constants'
import { AuthDiagram } from './components/AuthDiagram'
import { fiveGService } from './services/FiveGService'

interface AuthFlowProps {
  onBack: () => void
}

export const AuthFlow: React.FC<AuthFlowProps> = ({ onBack }) => {
  const steps: Step[] = FIVE_G_CONSTANTS.AUTH_STEPS.map((step, index) => ({
    id: step.id,
    title: step.title,
    description: step.description,
    code: step.code,
    language: 'javascript',
    actionLabel: 'Execute Step',
    diagram: <AuthDiagram step={index} />, // Use AuthDiagram
  }))

  const executeStep = async () => {
    // Dynamic execution
    const wizardStep = steps[wizard.currentStep]

    if (wizardStep.id === 'compute_milenage') {
      const vec = await fiveGService.runMilenage()
      return `Computing MILENAGE...
RAND: ${vec.rand}
[Output Vectors]
MAC: ${vec.res.substring(0, 16)}...
XRES: ${vec.res}
CK: ${vec.ck}
IK: ${vec.ik}`
    }

    // Fallback
    // Use static output for now if service method missing
    const staticData = FIVE_G_CONSTANTS.AUTH_STEPS[wizard.currentStep]
    await new Promise((resolve) => setTimeout(resolve, 600))
    return staticData.output
  }

  const wizard = useStepWizard({
    steps,
    onBack,
  })

  return (
    <StepWizard
      steps={steps}
      currentStepIndex={wizard.currentStep}
      onExecute={() => wizard.execute(executeStep)}
      output={wizard.output}
      isExecuting={wizard.isExecuting}
      error={wizard.error}
      isStepComplete={wizard.isStepComplete}
      onNext={wizard.handleNext}
      onBack={wizard.handleBack}
      onComplete={onBack}
    />
  )
}
