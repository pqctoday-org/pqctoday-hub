// SPDX-License-Identifier: AGPL-3.0-only
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { CopyButton } from '@/components/ui/CopyButton'
import { CodeBlock } from '@/components/ui/code-block'
import {
  DEFAULT_DPOP_SAMPLE_TARGET,
  generateDpopProofSample,
  type DpopProofSample,
} from '../dpopProofSample'

export function DPoPProofSizeExample() {
  const [target, setTarget] = useState(DEFAULT_DPOP_SAMPLE_TARGET)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [result, setResult] = useState<DpopProofSample | null>(null)
  const revision = useRef(0)
  const mounted = useRef(true)
  const running = useRef(false)
  const invalidate = useCallback(() => {
    revision.current += 1
  }, [])
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      invalidate()
    }
  }, [invalidate])

  const generate = async () => {
    if (running.current) return
    running.current = true
    const generation = ++revision.current
    const input = target
    setBusy(true)
    setMessage('Generating and checking the real sample artifacts…')
    setError('')
    setResult(null)
    const current = () => mounted.current && revision.current === generation
    try {
      const sample = await generateDpopProofSample(input, current)
      if (current()) {
        setResult(sample)
        setMessage('Sample signatures and token/key binding checked; actual bytes measured.')
      }
    } catch (failure) {
      if (current()) {
        setError(failure instanceof Error ? failure.message : 'Sample generation failed')
        setMessage('')
      }
    } finally {
      running.current = false
      if (mounted.current) {
        setBusy(false)
        if (revision.current !== generation)
          setMessage(
            'Previous operation settled without publishing results. Generate for the displayed sample target.'
          )
      }
    }
  }

  const clear = (nextMessage: string) => {
    invalidate()
    setResult(null)
    setError('')
    setMessage(nextMessage)
  }

  return (
    <section
      aria-label="Full DPoP proof measurement"
      className="min-w-0 space-y-4 rounded-xl border border-primary/30 bg-primary/5 p-4"
    >
      <h3 className="font-semibold">Worked full DPoP proof — ML-DSA-65</h3>
      <p className="text-sm">
        Generate a real signed proof with the module&apos;s existing RFC 9964 public AKP JWK. Two
        independent sample keys represent the authorization server and the client. The ordinary
        access-token JWT references the server key published separately in JWKS; the proof embeds
        the client&apos;s public JWK. Private keys are not displayed or copied.
      </p>
      <p className="text-sm">
        This is the module&apos;s historical fictional claim set and clock, not a currently usable
        access token. The sample checks signatures, method/target and the actual <code>ath</code>{' '}
        and <code>cnf.jkt</code> binding. It does not run an OAuth server or establish replay
        protection, a production time window, nonce policy or endpoint compatibility. No request is
        sent.
      </p>
      <label className="flex min-w-0 flex-col gap-1 text-sm">
        htu sample target (no query or fragment)
        <input
          className="min-w-0 w-full rounded border border-border bg-background p-2"
          type="text"
          value={target}
          onChange={(event) => {
            setTarget(event.target.value)
            clear(
              running.current
                ? 'Target changed; waiting for the current operation to settle.'
                : 'Target changed; generate a new proof for this sample request.'
            )
          }}
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={generate}
          disabled={busy}
          className="h-auto min-h-[44px] max-w-full whitespace-normal text-left"
        >
          Generate and measure full proof
        </Button>
        {busy && (
          <Button
            variant="outline"
            onClick={() =>
              clear('Measurement canceled; waiting for the current operation to settle.')
            }
          >
            Cancel measurement
          </Button>
        )}
      </div>
      {message && (
        <p role="status" className="text-sm">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {result && (
        <div role="region" aria-label="Measured DPoP sample results" className="min-w-0 space-y-4">
          <p className="break-words text-sm">
            GET {result.target}; historical sample clock {result.sampleClock}. A fresh sample ID is
            signed for this generation; this is not a replay-cache check.
          </p>
          <div className="max-w-full overflow-x-auto">
            <table className="w-full text-left text-xs">
              <caption className="mb-2 text-left">
                Actual layers inside the proof. Raw/JWK rows explain nesting; only the three encoded
                segments and two dots sum to the compact proof.
              </caption>
              <thead>
                <tr>
                  <th className="p-2">Layer</th>
                  <th className="p-2">Bytes</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Raw client public key', result.measurements.publicKeyBytes],
                  ['Public key base64url inside JWK', result.measurements.publicKeyBase64urlBytes],
                  ['Compact public JWK JSON', result.measurements.publicJwkJsonBytes],
                  ['Protected header JSON (including JWK)', result.measurements.headerJsonBytes],
                  ['Encoded protected-header segment', result.measurements.headerSegmentBytes],
                  ['Proof claims JSON', result.measurements.payloadJsonBytes],
                  ['Encoded payload segment', result.measurements.payloadSegmentBytes],
                  ['Raw signature', result.measurements.signatureBytes],
                  ['Encoded signature segment', result.measurements.signatureSegmentBytes],
                  ['Two separating dots', result.measurements.dotsBytes],
                  ['Complete compact proof', result.measurements.compactProofBytes],
                ].map(([name, value]) => (
                  <tr key={name}>
                    <th className="p-2 font-normal">{name}</th>
                    <td className="p-2">{value} B</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="max-w-full overflow-x-auto">
            <table className="w-full text-left text-xs">
              <caption className="mb-2 text-left">
                Two complete HTTP/1 field lines, including each CRLF. These are not the whole
                request/header section or HTTP/2/3 compressed bytes.
              </caption>
              <thead>
                <tr>
                  <th className="p-2">Artifact</th>
                  <th className="p-2">Bytes</th>
                </tr>
              </thead>
              <tbody>
                {[
                  [
                    'Access-token JWT (server key in separate JWKS)',
                    result.measurements.accessTokenBytes,
                  ],
                  ['Authorization: DPoP field line', result.measurements.authorizationLineBytes],
                  ['DPoP proof field line', result.measurements.proofLineBytes],
                  ['Both field lines together', result.measurements.headerLinesBytes],
                ].map(([name, value]) => (
                  <tr key={name}>
                    <th className="p-2 font-normal">{name}</th>
                    <td className="p-2">{value} B</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm">
            The proof field adds 8 framing bytes; Authorization with the DPoP scheme adds 22. A
            complete Authorization: Bearer field line instead adds 24. Request line, Host, other
            headers, the final blank line, TLS and compression are excluded here. Compare the actual
            field and aggregate limits configured in your tools; no server acceptance is inferred
            from these byte counts.
          </p>
          <div className="flex flex-wrap gap-2">
            <CopyButton text={result.proof} label="Copy full proof" />
            <CopyButton text={result.accessToken} label="Copy sample access token" />
            <CopyButton
              text={result.headerLines}
              label="Copy both HTTP field lines"
              className="h-auto max-w-full whitespace-normal text-left"
            />
          </div>
          <details>
            <summary className="cursor-pointer text-sm font-medium">
              Inspect public artifacts and key placement
            </summary>
            <h4 className="mt-3 text-sm">Actual protected-header JSON (then base64url encoded)</h4>
            <CodeBlock
              tabIndex={0}
              code={result.headerJson}
              aria-label="Actual DPoP protected header"
            />
            <h4 className="text-sm">Actual proof claims JSON</h4>
            <CodeBlock tabIndex={0} code={result.payloadJson} aria-label="Actual DPoP claims" />
            <h4 className="text-sm">Authorization-server public JWKS (outside the token)</h4>
            <CodeBlock tabIndex={0} code={result.asJwksJson} aria-label="Separate sample AS JWKS" />
          </details>
          <p className="text-sm">
            With production tools, evaluate supported signing algorithms/JWKs, proof-to-token
            binding, replay/nonce/time checks and the actual configured header limits. Preserve the
            serialized public sample and independent byte comparison as you evaluate those
            capabilities; this Hub result does not verify a deployment.
          </p>
        </div>
      )}
    </section>
  )
}
