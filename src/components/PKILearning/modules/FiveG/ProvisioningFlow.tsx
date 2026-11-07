// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import type { Step } from '../DigitalAssets/components/StepWizard'
import { StepWizard } from '../DigitalAssets/components/StepWizard'
import { useStepWizard } from '../DigitalAssets/hooks/useStepWizard'
import { WorkshopOperationLog } from '@/components/PKILearning/common/WorkshopOperationLog'
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
    actionLabel: ['personalize_sim', 'import_udm'].includes(step.id)
      ? 'Show process walkthrough'
      : 'Run sample calculation',
    diagram: <ProvisioningDiagram step={index} />, // Use ProvisioningDiagram
  }))

  const executeStep = async () => {
    const stepId = steps[wizard.currentStep].id

    if (stepId === 'gen_k') {
      const k = await fiveGService.generateSubKey()
      setKeys((p) => ({ ...p, k }))
      return `[SAMPLE CALCULATION] Browser-generated subscriber key K:
${k}
Generated with Web Crypto getRandomValues; no factory HSM or hardware entropy source is inspected.`
    } else if (stepId === 'compute_opc_sim') {
      if (!keys.k) throw new Error('K not generated')
      const opc = await fiveGService.computeOPc(keys.k)
      setKeys((p) => ({ ...p, opc }))
      return `[SAMPLE CALCULATION] Computed OPc (Operator Key variant):
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
      return await fiveGService.importAtUDM(keys.eK || '(no encrypted sample supplied)', keys.opc)
    }

    throw new Error('Unknown provisioning activity')
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
          not for production systems. Key generation, OPc computation and transport encryption run
          sample calculations in the browser. Card personalization and operator import are process
          walkthroughs: no card, operator HSM or subscriber database is accessed. Activity
          completion records viewing or running the sample, not successful subscriber provisioning.
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
        completeLabel="Finish provisioning walkthrough"
      />
      {wizard.logEntries.length > 0 && (
        <WorkshopOperationLog entries={wizard.logEntries} className="mt-4 max-h-40" />
      )}
    </div>
  )
}
