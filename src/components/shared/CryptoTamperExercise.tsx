// SPDX-License-Identifier: AGPL-3.0-only
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { runTamperSample, type TamperReceipt } from '@/utils/cryptoTamperVerifier'

export function CryptoTamperExercise({
  operation,
  variant,
}: {
  operation: TamperReceipt['operation']
  variant: number
}) {
  const [receipt, setReceipt] = useState<TamperReceipt | null>(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')
  return (
    <section className="border border-border rounded p-3 space-y-2">
      <h4 className="font-semibold">Predict a one-byte change</h4>
      <p className="text-sm">
        This separate fictional sample generates fresh{' '}
        {operation === 'signature' ? `ML-DSA-${variant}` : `ML-KEM-${variant}`} keys. Predict
        whether changing byte zero should preserve verification or key confirmation, then run the
        actual operation. Your workbench artifacts stay separate.
      </p>
      <Button
        disabled={running}
        onClick={async () => {
          setRunning(true)
          setReceipt(null)
          setError('')
          try {
            setReceipt(await runTamperSample(operation, variant))
          } catch (failure) {
            setError(failure instanceof Error ? failure.message : 'Operation could not run')
          } finally {
            setRunning(false)
          }
        }}
      >
        {running ? 'Computing…' : 'Run valid → mutate → restore sample'}
      </Button>
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
              Altered {operation === 'signature' ? 'signature accepted' : 'shared secret matches'}:{' '}
              {String(receipt.alteredAccepted)}. Restored original: {String(receipt.restoredValid)}.
            </p>
            {receipt.confirmationRejected !== undefined && (
              <p>
                Authenticated follow-on rejected the changed secret:{' '}
                {String(receipt.confirmationRejected)}. Decapsulation itself need not throw:
                implicit rejection is not an explicit authentication verdict.
              </p>
            )}
            <p>
              In your production tools, test the corresponding invalid-artifact and recovery paths,
              capture actual error handling and confirm the selected protocol/profile. This
              primitive sample does not test the complete protocol, deployment or monitoring system.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
