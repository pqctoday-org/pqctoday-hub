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
    const wizardStep = steps[wizard.currentStep]

    if (wizardStep.id === 'retrieve_creds') {
      return await fiveGService.retrieveCredentials()
    }

    if (wizardStep.id === 'gen_rand') {
      return await fiveGService.generateRAND()
    }

    if (wizardStep.id === 'compute_milenage') {
      const vec = await fiveGService.runMilenage()
      return `═══════════════════════════════════════════════════════════════
            MILENAGE COMPUTATION (f1-f5)
═══════════════════════════════════════════════════════════════

Step 1: Input Parameters
  > K:    [from HSM]
  > OPc:  [from HSM]
  > RAND: ${vec.rand}
  > SQN:  [from HSM]
  > AMF:  [from HSM]

Step 2: Executing MILENAGE Functions
  > f1 (MAC-A):  ${vec.mac}
  > f2 (XRES):   ${vec.res}
  > f3 (CK):     ${vec.ck}
  > f4 (IK):     ${vec.ik}
  > f5 (AK):     ${vec.ak}

[SUCCESS] All MILENAGE vectors computed.`
    }

    if (wizardStep.id === 'compute_autn') {
      return await fiveGService.computeAUTN()
    }

    if (wizardStep.id === 'derive_kausf') {
      return await fiveGService.deriveKAUSF()
    }

    // Fallback (should not reach here)
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
