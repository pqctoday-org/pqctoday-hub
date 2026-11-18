// SPDX-License-Identifier: AGPL-3.0-only
import { useState } from 'react'
import { Button } from '@/components/ui/button'

type RolloutResult = { legacy: string; updated: string }

export function SigningRolloutExercise() {
  const [fallback, setFallback] = useState(true)
  const [result, setResult] = useState<RolloutResult | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function run() {
    const sample = new TextEncoder().encode('Fictional service update, revision 2')
    setPending(true)
    setError('')
    setResult(null)
    try {
      const { ml_dsa65 } = await import('@noble/post-quantum/ml-dsa.js')
      const pqKey = ml_dsa65.keygen()
      const pqSignature = ml_dsa65.sign(sample, pqKey.secretKey)
      const pqVerified = ml_dsa65.verify(pqSignature, sample, pqKey.publicKey)
      let legacy = 'Blocked before signing. No algorithm in common under this policy.'
      if (fallback) {
        const { p256 } = await import('@noble/curves/nist.js')
        const key = p256.keygen()
        const signature = p256.sign(sample, key.secretKey)
        legacy = p256.verify(signature, sample, key.publicKey)
          ? 'Verified with ECDSA P-256 through the allowed fallback.'
          : 'Rejected the ECDSA P-256 signature.'
      }
      setResult({
        legacy,
        updated: pqVerified ? 'Verified with ML-DSA-65.' : 'Rejected the ML-DSA-65 signature.',
      })
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Could not run the signing sample.')
    } finally {
      setPending(false)
    }
  }

  return (
    <section className="glass-panel space-y-3 p-4" aria-label="Test a signing rollout">
      <h4 className="font-semibold">Test a signing rollout</h4>
      <p className="text-sm text-muted-foreground">
        The signer prefers ML-DSA-65. An older verifier accepts ECDSA P-256, and the updated
        verifier accepts ML-DSA-65. Predict which deployment can use the new signature before
        changing the fallback policy. The sample signs and verifies fresh data using these declared
        capabilities.
      </p>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={fallback}
          disabled={pending}
          onChange={(event) => {
            setFallback(event.target.checked)
            setResult(null)
            setError('')
          }}
        />
        Allow ECDSA fallback
      </label>
      <Button type="button" size="sm" disabled={pending} onClick={() => void run()}>
        {pending ? 'Testing signing rollout…' : 'Test both verifiers'}
      </Button>
      <div role="status" className="space-y-2 text-sm">
        {error && <p>Could not complete the sample. {error}</p>}
        {result && (
          <dl className="space-y-2">
            <div>
              <dt className="font-semibold">Older verifier</dt>
              <dd>{result.legacy}</dd>
            </div>
            <div>
              <dt className="font-semibold">Updated verifier</dt>
              <dd>{result.updated}</dd>
            </div>
          </dl>
        )}
      </div>
    </section>
  )
}
