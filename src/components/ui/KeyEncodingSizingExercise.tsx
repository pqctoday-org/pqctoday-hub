// SPDX-License-Identifier: AGPL-3.0-only
import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface PublicKeySizes {
  modulusBytes: number
  spkiBytes: number
}

export function KeyEncodingSizingExercise() {
  const [budget, setBudget] = useState('256')
  const [sizes, setSizes] = useState<PublicKeySizes | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const capacity = Number(budget)
  const validBudget = /^\d+$/.test(budget) && Number.isSafeInteger(capacity) && capacity > 0

  async function measure() {
    setPending(true)
    setError('')
    setSizes(null)
    try {
      const keyPair = await crypto.subtle.generateKey(
        {
          name: 'RSASSA-PKCS1-v1_5',
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256',
        },
        true,
        ['sign', 'verify']
      )
      const [jwk, spki] = await Promise.all([
        crypto.subtle.exportKey('jwk', keyPair.publicKey),
        crypto.subtle.exportKey('spki', keyPair.publicKey),
      ])
      if (!jwk.n) throw new Error('The generated public key did not contain a modulus.')
      const modulusBytes = atob(jwk.n.replaceAll('-', '+').replaceAll('_', '/')).length
      setSizes({ modulusBytes, spkiBytes: spki.byteLength })
    } catch {
      setError('Could not generate an example key. The exercise requires browser Web Crypto.')
    } finally {
      setPending(false)
    }
  }

  return (
    <details className="bg-card border-2 border-ink rounded-3xl shadow-[0_6px_0_hsl(var(--edge))] p-3 text-sm">
      <summary className="cursor-pointer font-semibold">Measure a public key buffer</summary>
      <p className="my-2 text-muted-foreground">
        The sample API expects the complete RSA public key as DER SubjectPublicKeyInfo (SPKI).
        Predict whether a 256-byte buffer fits it, then generate a key and measure both encodings.
      </p>
      <label className="block font-medium">
        Buffer capacity (bytes)
        <input
          type="number"
          min={1}
          step={1}
          value={budget}
          onChange={(event) => setBudget(event.target.value)}
          className="ml-2 w-24 rounded-md border border-border bg-background p-1"
        />
      </label>
      <Button
        type="button"
        size="sm"
        className="mt-2"
        onClick={() => void measure()}
        disabled={pending}
      >
        {pending ? 'Generating test key…' : 'Generate and measure RSA-2048'}
      </Button>
      <div role="status" className="mt-2 space-y-1">
        {error && <p>{error}</p>}
        {sizes && (
          <>
            <p>Measured modulus: {sizes.modulusBytes} bytes.</p>
            <p>Measured DER SPKI: {sizes.spkiBytes} bytes.</p>
            <p>
              {!validBudget
                ? 'Enter a positive whole number of bytes.'
                : sizes.spkiBytes <= capacity
                  ? `The exported key fits with ${capacity - sizes.spkiBytes} bytes to spare.`
                  : `The exported key needs ${sizes.spkiBytes - capacity} more ${sizes.spkiBytes - capacity === 1 ? 'byte' : 'bytes'}. Increase the buffer to fit the required encoding.`}
            </p>
          </>
        )}
      </div>
    </details>
  )
}
