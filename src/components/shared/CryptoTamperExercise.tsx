// SPDX-License-Identifier: AGPL-3.0-only
import { useContext, useState } from 'react'
import { Button } from '@/components/ui/button'
import { LearnModuleContext } from '@/components/PKILearning/common/useLearnPath'
import { evaluatePolicyScope, getModuleDecisionScenario } from '@/data/moduleDecisionScenarios'
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
  const [transferChecked, setTransferChecked] = useState(false)

  const transferPolicyResult =
    transferChecked && scenario ? evaluatePolicyScope(scenario.moduleId, 'transfer') : null

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
            This fictional domain sample generates fresh{' '}
            {resolvedOperation === 'signature'
              ? `ML-DSA-${resolvedVariant}`
              : `ML-KEM-${resolvedVariant}`}{' '}
            keys for <strong>{scenario.artifactLabel}</strong>. Predict whether mutating byte zero
            preserves verification or key confirmation, then run the live cryptographic check.
          </p>
        </div>
      ) : (
        <p className="text-sm">
          This fictional sample generates fresh{' '}
          {resolvedOperation === 'signature'
            ? `ML-DSA-${resolvedVariant}`
            : `ML-KEM-${resolvedVariant}`}{' '}
          keys. Predict whether changing byte zero should preserve verification or key confirmation,
          then run the actual operation.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          disabled={running}
          onClick={async () => {
            setRunning(true)
            setReceipt(null)
            setError('')
            try {
              setReceipt(await runTamperSample(resolvedOperation, resolvedVariant))
            } catch (failure) {
              setError(failure instanceof Error ? failure.message : 'Operation could not run')
            } finally {
              setRunning(false)
            }
          }}
        >
          {running ? 'Computing…' : 'Run valid → mutate → restore sample'}
        </Button>
        {scenario && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setTransferChecked((prev) => !prev)}
          >
            {transferChecked ? 'Hide changed-assumption check' : 'Check changed assumption'}
          </Button>
        )}
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
                  <strong>Valid baseline:</strong> {scenario.validCaseExplanation}
                </p>
                <p>
                  <strong>1-byte mutation failure:</strong> {scenario.adverseFailureExplanation}
                </p>
                <p>
                  <strong>Recovery action:</strong> {scenario.recoveryActionExplanation}
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
      {scenario && transferChecked && (
        <div className="rounded border border-border/70 bg-muted/20 p-2.5 text-xs space-y-1">
          <p className="font-semibold text-foreground">
            Transfer question: {scenario.transferQuestion.prompt}
          </p>
          <p>{scenario.transferQuestion.changedAssumptionOutcome}</p>
          {transferPolicyResult && (
            <p className="text-muted-foreground">
              Changed-assumption horizon check ({transferPolicyResult.algorithm}):{' '}
              {transferPolicyResult.exposureYears} years beyond horizon — findings:{' '}
              {transferPolicyResult.findings.map((f) => f.kind).join(', ')}.
            </p>
          )}
        </div>
      )}
    </section>
  )
}
