// SPDX-License-Identifier: AGPL-3.0-only
import React, { useMemo } from 'react'
import { StepWizard } from '../components/StepWizard'
import { useHSM, type HsmKey } from '@/hooks/useHSM'
import { LiveHSMToggle } from '@/components/shared/LiveHSMToggle'
import { Pkcs11LogPanel } from '@/components/shared/Pkcs11LogPanel'
import { HsmKeyInspector } from '@/components/shared/HsmKeyInspector'
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
  const hsm = useHSM()

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
    <div className="flex flex-col h-full relative">
      <aside
        aria-label="Ethereum sample execution scope"
        className="mb-4 rounded-lg border border-border p-3 text-sm text-muted-foreground space-y-2"
      >
        <p>
          <strong className="text-foreground">Software JSON-signing demonstration.</strong> The
          steps use OpenSSL software and JavaScript helpers with accessible sample key files. The
          optional HSM session below is separate; enabling it does not move these keys or
          signing/verification operations into that session.
        </p>
        <p>
          The signed payload is UTF-8 JSON, not an encoded Ethereum transaction. In production
          tools, evaluate protocol serialization, key custody through the intended provider, and
          independently checked per-operation results. Completing these sample steps does not
          establish blockchain acceptance.
        </p>
      </aside>
      <section
        aria-label="Separate HSM session inspection"
        className="px-6 py-3 border-b border-border bg-muted/10 mb-6 rounded-t-xl"
      >
        <p className="mb-2 text-xs text-muted-foreground">
          Optional session inspection; the Ethereum sample steps do not use this session.
        </p>
        <LiveHSMToggle hsm={hsm} operations={[]} />
      </section>

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

      {hsm.isReady && (
        <Pkcs11LogPanel
          log={hsm.log}
          onClear={hsm.clearLog}
          title="Separate HSM session trace"
          emptyMessage="No retained calls in this optional HSM session. Ethereum software steps do not feed this trace."
        />
      )}

      {hsm.isReady && (
        <section aria-label="Separate HSM session keys">
          <p className="mb-2 text-xs text-muted-foreground">
            Separate session keys — these are not the Ethereum software key files.
          </p>
          {hsm.keys.length === 0 ? (
            <div
              className="glass-panel p-5 text-sm text-muted-foreground"
              data-testid="hsm-key-inspector"
              data-hsm-key-count={0}
            >
              No keys are registered in this optional HSM session. Ethereum software steps do not
              provision keys here.
            </div>
          ) : (
            <HsmKeyInspector
              keys={hsm.keys}
              moduleRef={hsm.moduleRef}
              hSessionRef={hsm.hSessionRef}
              onRemoveKey={(key: HsmKey) => hsm.removeKey(key.handle)}
            />
          )}
        </section>
      )}
    </div>
  )
}
