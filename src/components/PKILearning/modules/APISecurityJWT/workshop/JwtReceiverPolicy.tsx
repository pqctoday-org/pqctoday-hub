// SPDX-License-Identifier: AGPL-3.0-only
import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import { decodeJWT, verifyJWS, type JwsAlg } from '../jwtUtils'

const RECEIVER_ALGORITHMS = ['ML-DSA-44', 'ML-DSA-65', 'ML-DSA-87'] as const

interface JwtReceiverPolicyProps {
  token: string
  signerAlgorithm: JwsAlg
  publicKey: Uint8Array
}

export function JwtReceiverPolicy({ token, signerAlgorithm, publicKey }: JwtReceiverPolicyProps) {
  const id = useId()
  const [allowed, setAllowed] = useState<string>('ML-DSA-65')
  const [result, setResult] = useState('')
  const [pending, setPending] = useState(false)

  const check = async () => {
    const claimedAlgorithm = decodeJWT(token)?.header?.alg
    if (typeof claimedAlgorithm !== 'string') {
      setResult('The token has no readable protected algorithm identifier.')
      return
    }
    if (claimedAlgorithm !== allowed) {
      setResult(`Signature policy rejected ${claimedAlgorithm}. This receiver permits ${allowed}.`)
      return
    }
    if (claimedAlgorithm !== signerAlgorithm) {
      setResult(
        'The protected algorithm differs from the algorithm associated with the sample key.'
      )
      return
    }
    setPending(true)
    setResult('')
    try {
      const verification = await verifyJWS({ token, publicKey, backend: 'noble' })
      setResult(
        verification.valid
          ? `The ${allowed} signature meets the sample receiver’s algorithm policy and verifies.`
          : 'The algorithm is permitted. The signature failed verification.'
      )
    } catch {
      setResult('The browser could not finish the signature check. Try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <section
      aria-labelledby={id}
      className="mt-4 space-y-3 rounded-lg border border-border p-3 text-sm"
    >
      <h4 id={id} className="font-semibold">
        Check the receiver’s signature policy
      </h4>
      <p className="text-muted-foreground">
        Choose the exact algorithm permitted by the sample receiver. The receiver checks that policy
        and the sample key’s algorithm before verifying the signature.
      </p>
      <label htmlFor={`${id}-algorithm`} className="block font-medium">
        Permitted receiver algorithm
      </label>
      <div className="flex flex-wrap gap-2">
        {/* eslint-disable-next-line no-restricted-syntax -- Native <select> preserved for form semantics and Playwright combobox/selectOption tests */}
        <select
          id={`${id}-algorithm`}
          value={allowed}
          disabled={pending}
          className="rounded-md border border-input bg-background p-2"
          onChange={(event) => {
            setAllowed(event.target.value)
            setResult('')
          }}
        >
          {RECEIVER_ALGORITHMS.map((algorithm) => (
            <option key={algorithm} value={algorithm}>
              {algorithm}
            </option>
          ))}
        </select>
        <Button onClick={() => void check()} disabled={pending}>
          Check token signature policy
        </Button>
      </div>
      <p role="status" aria-label="Receiver signature decision">
        {pending ? 'Checking the sample signature…' : result}
      </p>
      <p className="text-xs text-muted-foreground">
        The application also checks claims such as issuer, audience and expiration before relying on
        a token.{' '}
        <a
          href="https://www.rfc-editor.org/rfc/rfc8725.html#section-3.1"
          className="text-primary underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          RFC 8725 algorithm verification
        </a>
      </p>
    </section>
  )
}
