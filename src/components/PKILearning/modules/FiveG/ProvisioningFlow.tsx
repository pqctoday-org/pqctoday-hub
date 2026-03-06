// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import type { Step } from '../DigitalAssets/components/StepWizard'
import { StepWizard } from '../DigitalAssets/components/StepWizard'
import { useStepWizard } from '../DigitalAssets/hooks/useStepWizard'
import { FIVE_G_CONSTANTS } from './constants'
import { ProvisioningDiagram } from './components/ProvisioningDiagram'
import { fiveGService } from './services/FiveGService'
import { useState } from 'react'
import { Info } from 'lucide-react'

interface ProvisioningFlowProps {
  onBack: () => void
}

export const ProvisioningFlow: React.FC<ProvisioningFlowProps> = ({ onBack }) => {
  const [keys, setKeys] = useState<{ k?: string; opc?: string; eK?: string }>({})

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

    if (stepId === 'gen_k') {
      const k = await fiveGService.generateSubKey()
      setKeys((p) => ({ ...p, k }))
      return `[Factory] Generated Subscriber Key (K):
${k}
(Inside factory HSM)`
    } else if (stepId === 'compute_opc_sim') {
      if (!keys.k) throw new Error('K not generated')
      const opc = await fiveGService.computeOPc(keys.k)
      setKeys((p) => ({ ...p, opc }))
      return `[Factory] Computed OPc (Operator Key variant):
${opc}
(Bound to K and Operator OP)`
    } else if (stepId === 'personalize_sim') {
      if (!keys.k || !keys.opc) throw new Error('Keys missing')
      return await fiveGService.personalizeUSIM(keys.k, keys.opc)
    } else if (stepId === 'encrypt_transport') {
      if (!keys.k || !keys.opc) throw new Error('Keys missing')
      const result = await fiveGService.encryptTransport(keys.k, keys.opc)
      // Extract eK from the result for the import step
      const eKMatch = result.match(/Encrypted Output\(Hex\):\n([a-fA-F0-9]+)/)
      if (eKMatch) setKeys((p) => ({ ...p, eK: eKMatch[1] }))
      return result
    } else if (stepId === 'import_udm') {
      if (!keys.opc) throw new Error('Keys missing')
      return await fiveGService.importAtUDM(keys.eK || keys.k || '', keys.opc)
    }

    // Fallback static (should not reach here)
    const stepData = FIVE_G_CONSTANTS.PROVISIONING_STEPS[wizard.currentStep]
    await new Promise((resolve) => setTimeout(resolve, 600))
    return stepData.output
  }

  const wizard = useStepWizard({
    steps,
    onBack,
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted/40 text-xs text-muted-foreground">
        <Info size={13} className="shrink-0" />
        <span>
          All keys and identifiers generated here are for <strong>educational use only</strong> —
          not for production systems.
        </span>
      </div>
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
    </div>
  )
}
