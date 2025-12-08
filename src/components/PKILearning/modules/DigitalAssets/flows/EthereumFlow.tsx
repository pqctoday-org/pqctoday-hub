import React, { useMemo } from 'react'
import { StepWizard } from '../components/StepWizard'
import { useStepWizard } from '../hooks/useStepWizard'
import { DIGITAL_ASSETS_CONSTANTS } from '../constants'
import { useKeyGeneration } from '../hooks/useKeyGeneration'
import { useArtifactManagement } from '../hooks/useArtifactManagement'
import { useFileRetrieval } from '../hooks/useFileRetrieval'
import { useFlowState } from '../hooks/useFlowState'
import { useEthereumKeyGeneration } from './ethereum/useEthereumKeyGeneration'
import { useEthereumTransaction } from './ethereum/useEthereumTransaction'
import { useEthereumSigning } from './ethereum/useEthereumSigning'
import { useEthereumVerification } from './ethereum/useEthereumVerification'

interface EthereumFlowProps {
  onBack: () => void
}

export const EthereumFlow: React.FC<EthereumFlowProps> = ({ onBack }) => {
  // Shared Hooks
  const keyGen = useKeyGeneration('ethereum')
  const recipientKeyGen = useKeyGeneration('ethereum')
  const artifacts = useArtifactManagement()
  const fileRetrieval = useFileRetrieval()

  // Centralized Flow State
  const { state, actions } = useFlowState()

  // Filenames
  const filenames = useMemo(() => {
    const src = DIGITAL_ASSETS_CONSTANTS.getFilenames('SRC_ethereum')
    const dst = DIGITAL_ASSETS_CONSTANTS.getFilenames('DST_ethereum')
    return {
      SRC_PRIVATE_KEY: src.PRIVATE_KEY,
      SRC_PUBLIC_KEY: src.PUBLIC_KEY,
      DST_PRIVATE_KEY: dst.PRIVATE_KEY,
      DST_PUBLIC_KEY: dst.PUBLIC_KEY,
    }
  }, [])

  // Sub-Hooks
  const keyGenFlow = useEthereumKeyGeneration({
    keyGen,
    recipientKeyGen,
    fileRetrieval,
    actions,
    filenames,
  })

  const txFlow = useEthereumTransaction({
    state,
    actions,
    artifacts,
  })

  const signFlow = useEthereumSigning({
    keyGen,
    artifacts,
    fileRetrieval,
    actions,
    state,
    filenames,
  })

  const verifyFlow = useEthereumVerification({
    artifacts,
    fileRetrieval,
    state,
    filenames,
  })

  // Aggregate Steps
  const steps = [...keyGenFlow.steps, ...txFlow.steps, ...signFlow.steps, ...verifyFlow.steps]

  // Execution Router
  const executeStep = async () => {
    const step = steps[wizard.currentStep]
    const id = step.id

    if (keyGenFlow.steps.find((s) => s.id === id)) {
      return keyGenFlow.execute(id)
    }
    if (txFlow.steps.find((s) => s.id === id)) {
      return txFlow.execute(id)
    }
    if (signFlow.steps.find((s) => s.id === id)) {
      return signFlow.execute(id)
    }
    if (verifyFlow.steps.find((s) => s.id === id)) {
      return verifyFlow.execute(id)
    }

    return 'Step execution not implemented.'
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
