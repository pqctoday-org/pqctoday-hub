// SPDX-License-Identifier: AGPL-3.0-only
import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import { resolveSampleMx } from './validateSignedMx'
import fixture from './signedMxFixture.json'

export function SignedMxExercise() {
  const budgetGroup = useId()
  const [budget, setBudget] = useState(1232)
  const [corrupt, setCorrupt] = useState(false)
  const [result, setResult] = useState<ReturnType<typeof resolveSampleMx>>()
  const [transport, setTransport] = useState<'udp' | 'tcp'>('udp')
  function run(via: 'udp' | 'tcp') {
    setTransport(via)
    setResult(resolveSampleMx(via, budget, corrupt))
  }
  return (
    <section className="glass-panel p-4 space-y-3">
      <h4 className="font-semibold">Validate a signed MX answer</h4>
      <p>
        Predict whether the resolver can authenticate the answer, needs TCP, or should reject it.
        The browser verifies the published ML-DSA-44 signature for{' '}
        <code>example.com. MX 10 mail.example.com.</code> using the sample zone’s trusted DNSKEY
        (algorithm 18, key tag 59829). The sample uses the signature’s historical validity window.
        DNS transport and resolver flags are simulated.
      </p>
      <fieldset className="space-x-3">
        <legend>UDP response budget</legend>
        {[1232, 4096].map((size) => (
          <label key={size}>
            <input
              type="radio"
              name={budgetGroup}
              checked={budget === size}
              onChange={() => {
                setBudget(size)
                setResult(undefined)
              }}
            />{' '}
            {size} bytes
          </label>
        ))}
      </fieldset>

      <label className="block">
        <input
          type="checkbox"
          checked={corrupt}
          onChange={(e) => {
            setCorrupt(e.target.checked)
            setResult(undefined)
          }}
        />{' '}
        Corrupt one RRSIG byte
      </label>
      <Button onClick={() => run('udp')}>Query over UDP</Button>
      {result?.status === 'truncated' && <Button onClick={() => run('tcp')}>Retry over TCP</Button>}
      <p role="status" aria-live="polite">
        {result && (
          <>
            {transport.toUpperCase()} · Complete sample answer: {result.responseBytes} bytes.{' '}
            {result.status === 'truncated' &&
              'TC=1. The answer exceeds the UDP budget. Retry over TCP to obtain the complete RRset before validation.'}
            {result.status === 'secure' &&
              'Signature verified. The sample resolver returns NOERROR with AD=1.'}
            {result.status === 'bogus' &&
              'Signature verification failed. The sample resolver returns SERVFAIL with AD=0. Restore the signature and query again.'}
          </>
        )}
      </p>
      <p className="text-sm">
        When evaluating a resolver, check algorithm 18 support, its trust chain, and TCP
        reachability separately. A truncated answer alone cannot establish whether the signature is
        valid.
      </p>
      <a className="text-primary underline" href={fixture.source}>
        Published MX test vector, section 6
      </a>
    </section>
  )
}
