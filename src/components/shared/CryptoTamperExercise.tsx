// SPDX-License-Identifier: AGPL-3.0-only
import { useContext, useState } from 'react'
import { Button } from '@/components/ui/button'
import { LearnModuleContext } from '@/components/PKILearning/common/useLearnPath'
import { getModuleDecisionScenario } from '@/data/moduleDecisionScenarios'
import { runTamperSample, type TamperReceipt } from '@/utils/cryptoTamperVerifier'

export function CryptoTamperExercise({
  operation,
  variant,
  moduleId,
}: {
  operation?: TamperReceipt['operation'] | 'kem'
  variant?: number
  moduleId?: string
}) {
  const contextModuleId = useContext(LearnModuleContext)
  const resolvedModuleId = moduleId ?? contextModuleId
  const scenario = resolvedModuleId ? getModuleDecisionScenario(resolvedModuleId) : undefined

  const resolvedOperation: TamperReceipt['operation'] =
    operation === 'kem'
      ? 'encapsulation'
      : (operation ??
        (scenario?.algorithmVariant.operation === 'kem' ? 'encapsulation' : 'signature'))
  const resolvedVariant: number =
    variant ?? scenario?.algorithmVariant.variant ?? (resolvedOperation === 'signature' ? 65 : 768)

  const [receipt, setReceipt] = useState<TamperReceipt | null>(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')
  const [sampleText, setSampleText] = useState('Fictional training message')
  const [byteIndex, setByteIndex] = useState('0')

  function clearResult() {
    setReceipt(null)
    setError('')
  }

  return (
    <section className="border border-border rounded p-3 space-y-2">
      <h4 className="font-semibold">Predict a one-byte change</h4>
      {scenario ? (
        <div className="text-sm space-y-1.5">
          <p className="font-medium text-foreground">
            {scenario.domainTitle} —{' '}
            <span className="font-mono text-xs">{scenario.artifactLabel}</span>
          </p>
          <p className="text-muted-foreground">{scenario.roleDecisionPrompt}</p>
          <p>
            The protocol example above gives context for this primitive check. Here you
            {resolvedOperation === 'signature'
              ? ` sign the sample text with ML-DSA-${resolvedVariant} and change one signature byte.`
              : ` encrypt the sample text with AES-GCM and change one ML-KEM-${resolvedVariant} ciphertext byte before key confirmation.`}
          </p>
        </div>
      ) : (
        <p className="text-sm">
          This fictional sample generates fresh{' '}
          {resolvedOperation === 'signature'
            ? `ML-DSA-${resolvedVariant}`
            : `ML-KEM-${resolvedVariant}`}{' '}
          keys. Predict whether changing the selected byte should preserve verification or key
          confirmation, then run the actual operation.
        </p>
      )}
      <label className="block text-sm">
        Sample text
        <input
          className="block w-full rounded border bg-background p-2"
          value={sampleText}
          disabled={running}
          onChange={(event) => {
            setSampleText(event.target.value)
            clearResult()
          }}
        />
      </label>
      <label className="block text-sm">
        Byte index to change (first byte is 0)
        <input
          className="ml-2 w-24 rounded border bg-background p-1"
          type="number"
          min="0"
          step="1"
          value={byteIndex}
          disabled={running}
          onChange={(event) => {
            setByteIndex(event.target.value)
            clearResult()
          }}
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <Button
          disabled={running}
          onClick={async () => {
            setRunning(true)
            setReceipt(null)
            setError('')
            try {
              if (!/^\d+$/.test(byteIndex)) throw new Error('Choose an existing byte')
              setReceipt(
                await runTamperSample(
                  resolvedOperation,
                  resolvedVariant,
                  Number(byteIndex),
                  sampleText
                )
              )
            } catch (failure) {
              setError(failure instanceof Error ? failure.message : 'Operation could not run')
            } finally {
              setRunning(false)
            }
          }}
        >
          {running ? 'Computing…' : 'Run valid → mutate → restore sample'}
        </Button>
      </div>
      <div role="status" aria-live="polite">
        {error && <p>Execution error: {error}</p>}
        {receipt && (
          <div className="text-sm space-y-1">
            <p>
              {receipt.algorithm}: original control {String(receipt.baselineValid)}; byte{' '}
              {receipt.byteIndex}: {receipt.before.toString(16).padStart(2, '0')} →{' '}
              {receipt.after.toString(16).padStart(2, '0')}.
            </p>
            <p>
              Altered{' '}
              {resolvedOperation === 'signature' ? 'signature accepted' : 'shared secret matches'}:{' '}
              {String(receipt.alteredAccepted)}. Restored original: {String(receipt.restoredValid)}.
            </p>
            {receipt.confirmationRejected !== undefined && (
              <p>
                Authenticated follow-on rejected the changed secret:{' '}
                {String(receipt.confirmationRejected)}. Decapsulation itself need not throw:
                implicit rejection is not an explicit authentication verdict.
              </p>
            )}
            {scenario ? (
              <div className="mt-2 pt-2 border-t border-border/60 space-y-1 text-xs">
                <p>
                  <strong>Protocol example, expected baseline:</strong>{' '}
                  {scenario.validCaseExplanation}
                </p>
                <p>
                  <strong>Expected domain consequence:</strong> {scenario.adverseFailureExplanation}
                </p>
                <p>
                  <strong>Suggested domain recovery:</strong> {scenario.recoveryActionExplanation}
                </p>
                <p>
                  <strong>Production tool verification:</strong> {scenario.productionToolCheck}
                </p>
              </div>
            ) : (
              <p>
                In your production tools, test the corresponding invalid-artifact and recovery
                paths, capture actual error handling and confirm the selected protocol/profile. This
                primitive sample does not test the complete protocol, deployment or monitoring
                system.
              </p>
            )}
          </div>
        )}
      </div>
      {scenario && (
        <div className="rounded border border-border/70 p-2.5 text-sm">
          <p>
            <strong>Transfer question:</strong> {scenario.transferQuestion.prompt}
          </p>
          <details>
            <summary className="cursor-pointer">Compare your prediction</summary>
            <p>{scenario.transferQuestion.changedAssumptionOutcome}</p>
          </details>
        </div>
      )}
    </section>
  )
}
