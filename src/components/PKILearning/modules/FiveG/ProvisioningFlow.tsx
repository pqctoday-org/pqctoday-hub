import React from 'react'
import type { Step } from '../DigitalAssets/components/StepWizard'
import { StepWizard } from '../DigitalAssets/components/StepWizard'
import { useStepWizard } from '../DigitalAssets/hooks/useStepWizard'
import { FIVE_G_CONSTANTS } from './constants'
import { ProvisioningDiagram } from './components/ProvisioningDiagram'
import { fiveGService } from './services/FiveGService'
import { useState } from 'react'

interface ProvisioningFlowProps {
  onBack: () => void
}

export const ProvisioningFlow: React.FC<ProvisioningFlowProps> = ({ onBack }) => {
  const [keys, setKeys] = useState<{ ki?: string; opc?: string }>({})

  const steps: Step[] = FIVE_G_CONSTANTS.PROVISIONING_STEPS.map((step, index) => ({
    id: step.id,
    title: step.title,
    description: step.description,
    code: step.code,
    language: 'javascript',
    actionLabel: 'Execute Step',
    diagram: <ProvisioningDiagram step={index} />, // Use ProvisioningDiagram
  }))

  const executeStep = async () => {
    const stepId = steps[wizard.currentStep].id

    if (stepId === 'gen_ki') {
      const ki = await fiveGService.generateSubKey()
      setKeys((p) => ({ ...p, ki }))
      return `[Factory] Generated Subscriber Key (Ki):
${ki}
(Stored in HSM)`
    } else if (stepId === 'compute_opc_sim') {
      if (!keys.ki) throw new Error('Ki not generated')
      const opc = await fiveGService.computeOPc(keys.ki)
      setKeys((p) => ({ ...p, opc }))
      return `[Factory] Computed OPc (Operator Key variant):
${opc}
(Bound to Ki and Operator OP)`
    } else if (stepId === 'encrypt_transport') {
      if (!keys.ki || !keys.opc) throw new Error('Keys missing')
      return await fiveGService.encryptTransport(keys.ki, keys.opc)
    }

    // Fallback static
    const stepData = FIVE_G_CONSTANTS.PROVISIONING_STEPS[wizard.currentStep]
    await new Promise((resolve) => setTimeout(resolve, 600))
    return stepData.output
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
