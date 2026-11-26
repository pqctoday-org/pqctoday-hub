// SPDX-License-Identifier: AGPL-3.0-only
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { runSecretEnvelopeSample } from '@/utils/secretEnvelopeSample'
import { downloadBlob } from '@/services/exportBundle'
export function SecretEnvelopeExercise() {
  const [result, setResult] = useState<ReturnType<typeof runSecretEnvelopeSample> | null>(null)
  const [error, setError] = useState('')
  return (
    <section className="glass-panel bg-card backdrop-blur-none border-2 border-ink rounded-3xl shadow-[0_6px_0_hsl(var(--edge))] p-4 space-y-3">
      <h3 className="font-bold">Run a real PQC secret envelope</h3>
      <p className="text-sm">
        This fictional application encrypts a sample token with a key derived from ML-KEM-768 using
        HKDF-SHA256 and AES-256-GCM. Vault KV can store the envelope as opaque versioned data; Vault
        transit is not performing ML-KEM here. Predict what happens if the KEM ciphertext or
        authentication tag changes.
      </p>
      <Button
        onClick={() => {
          setError('')
          try {
            setResult(runSecretEnvelopeSample('Fictional portal token'))
          } catch (e) {
            setResult(null)
            setError(e instanceof Error ? e.message : 'Sample could not run')
          }
        }}
      >
        Encrypt, recover, tamper and restore
      </Button>
      <div role="status" aria-live="polite" className="text-sm">
        {error}
        {result && (
          <>
            <p>
              Original recovered: {String(result.messageRecovered)}. Changed KEM ciphertext rejected
              by authenticated decryption: {String(result.changedKemRejected)}. Changed data/tag
              rejected: {String(result.changedDataRejected)}. Original restored:{' '}
              {String(result.restored)}.
            </p>
            <p>
              Raw encapsulation key {result.sizes.encapsulationKey} B; KEM ciphertext{' '}
              {result.sizes.kemCiphertext} B; encrypted UTF-8 token plus tag{' '}
              {result.sizes.dataWithTag} B; nonce {result.sizes.nonce} B; salt {result.sizes.salt}{' '}
              B. Hex/JSON storage adds encoding overhead.
            </p>
          </>
        )}
      </div>
      {result && (
        <Button
          variant="outline"
          onClick={() =>
            downloadBlob(
              new Blob([JSON.stringify(result.envelope, null, 2)], { type: 'application/json' }),
              'fictional-envelope.json'
            )
          }
        >
          Download sample envelope
        </Button>
      )}
      <p className="text-sm text-muted-foreground">
        The sample recipient private key stays only in browser memory and is lost on reload; the
        downloaded ciphertext alone cannot recover the token. In your own tools, evaluate
        private-key custody, authenticated envelope/profile identifiers, access control, rotation,
        recovery and interoperability. This custom educational envelope is not a standardized
        interoperable protocol or a native Vault ML-KEM API.
      </p>
    </section>
  )
}
