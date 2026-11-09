// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { EDUCATION_NOTICE } from '@/data/educationNotice'
import {
  CHAIN_SAMPLE,
  generateMeasuredChains,
  type MeasuredChain,
  type PublicChainCertificate,
} from './measuredChainSample'

interface Props {
  disabled?: boolean
  onBusyChange: (busy: boolean) => void
  onInspect: (certificate: PublicChainCertificate, name: string) => void
}

function download(data: Uint8Array, name: string) {
  const url = URL.createObjectURL(
    new Blob([data.slice().buffer], { type: 'application/octet-stream' })
  )
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function MeasuredChainExample({ disabled = false, onBusyChange, onInspect }: Props) {
  const [results, setResults] = useState<readonly MeasuredChain[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mounted = useRef(true),
    generation = useRef(0),
    running = useRef(false)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  const generate = async () => {
    if (running.current || disabled) return
    running.current = true
    const revision = ++generation.current
    const current = () => mounted.current && generation.current === revision
    setBusy(true)
    setError(null)
    setResults(null)
    onBusyChange(true)
    try {
      const value = await generateMeasuredChains(undefined, current)
      if (current()) setResults(value)
    } catch (failure) {
      if (current())
        setError(failure instanceof Error ? failure.message : 'Sample generation failed')
    } finally {
      running.current = false
      if (mounted.current) {
        setBusy(false)
        onBusyChange(false)
      }
    }
  }
  const cancel = () => {
    generation.current += 1
    setResults(null)
    setError(
      'Sample generation canceled. Waiting for the current operation and cleanup to settle; no measurements are published.'
    )
  }
  return (
    <section
      className="min-w-0 space-y-4 rounded-2xl border border-primary/30 bg-primary/5 p-4"
      aria-labelledby="measured-chain-heading"
    >
      <h3 id="measured-chain-heading" className="font-semibold">
        Measured certificate-chain example
      </h3>
      <p className="text-sm text-muted-foreground">
        Generate two real public sample chains with the existing browser OpenSSL: homogeneous
        ML-DSA-65 and RSA-2048 (SHA-256 with PKCS#1 v1.5). These are illustrative profiles, not
        equal security categories. Both transmit the leaf and intermediate; the root is supplied
        only to the sample verification as a local trust anchor.
      </p>
      <details className="text-sm">
        <summary className="cursor-pointer font-medium">
          Fictional metadata and encoding boundaries
        </summary>
        <p className="mt-2 break-words">
          CNs: SampleRoot, SampleIntermediate, SampleLeaf. Serials: 1, 2, 3. Validity:{' '}
          {CHAIN_SAMPLE.notBefore} to {CHAIN_SAMPLE.notAfter}. Verification instant:{' '}
          {CHAIN_SAMPLE.checkTime}. Leaf SAN: {CHAIN_SAMPLE.hostname}. Root/intermediate CA path
          lengths: 1/0; CA keyCertSign and cRLSign. Leaf: digitalSignature and serverAuth. Keys are
          freshly generated; names, dates, extensions and serials are fixed across profiles.
        </p>
        <p className="mt-2">
          TLS 1.3 Certificate body: empty request context, leaf then intermediate, empty per-entry
          extensions. The separate Handshake message adds its 4-byte header. No TLS records, key
          exchange, CertificateVerify, compression, connection or server acceptance is measured.
          Sample private keys are not displayed, downloaded or added to your artifact store.
        </p>
      </details>
      <p className="text-xs text-muted-foreground" data-testid="chain-example-notice">
        {EDUCATION_NOTICE} The downloads are binary sample files and cannot carry this notice
        themselves.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          className="h-auto min-h-[44px] max-w-full whitespace-normal text-left"
          disabled={busy || disabled}
          onClick={generate}
        >
          {busy ? 'Generating and checking sample chains…' : 'Generate measured sample chains'}
        </Button>
        {busy && (
          <Button
            className="h-auto min-h-[44px] max-w-full whitespace-normal text-left"
            variant="outline"
            onClick={cancel}
          >
            Cancel sample generation
          </Button>
        )}
      </div>
      {busy && (
        <p role="status" className="text-sm">
          Wait for the current OpenSSL operation and cleanup to settle before retrying.
        </p>
      )}
      {error && (
        <p role="alert" className="break-words text-sm text-destructive">
          {error}
        </p>
      )}
      {results && (
        <div
          role="region"
          aria-label="Measured certificate-chain results"
          className="min-w-0 space-y-4"
        >
          <div className="max-w-full overflow-x-auto">
            <table className="w-full text-left text-xs">
              <caption className="mb-2 text-left">
                Actual byte lengths of these generated public artifacts; root excluded from
                transmitted totals.
              </caption>
              <thead>
                <tr>
                  {[
                    'Profile',
                    'Root DER (local)',
                    'Intermediate DER',
                    'Leaf DER',
                    'Transmitted DER sum',
                    'Certificate body',
                    'Handshake message',
                  ].map((heading) => (
                    <th key={heading} scope="col" className="p-2">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((result) => (
                  <tr key={result.algorithm}>
                    <th scope="row" className="p-2">
                      {result.algorithm}
                    </th>
                    {['root', 'intermediate', 'leaf'].map((role) => (
                      <td className="p-2" key={role}>
                        {result.certificates.find((cert) => cert.role === role)?.der.length} B
                      </td>
                    ))}
                    <td className="p-2">{result.certificateDerBytes} B</td>
                    <td className="p-2">{result.certificateBody.length} B</td>
                    <td className="p-2">{result.handshakeMessage.length} B</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {results.map((result) => (
            <div
              key={result.algorithm}
              className="min-w-0 space-y-2 rounded-lg border border-border p-3"
            >
              <h4 className="font-medium">{result.algorithm} public sample artifacts</h4>
              <p className="text-xs break-words">
                {result.verification}. This configured sample check is not production trust or
                deployment evidence. Measurements below remain a snapshot of these exact artifacts
                if you edit a copy in the reader.
              </p>
              <div className="flex flex-wrap gap-2">
                {result.certificates.map((cert) => {
                  const name = `sample-${result.algorithm.toLowerCase()}-${cert.role}`
                  return (
                    <div key={cert.role} className="flex flex-wrap gap-2">
                      <Button
                        className="h-auto min-h-[44px] max-w-full whitespace-normal text-left"
                        variant="outline"
                        disabled={disabled}
                        onClick={() => onInspect(cert, name + '.pem')}
                      >
                        Inspect {result.algorithm} {cert.role}
                      </Button>
                      <Button
                        className="h-auto min-h-[44px] max-w-full whitespace-normal text-left"
                        variant="outline"
                        onClick={() => download(cert.der, name + '.der')}
                      >
                        Download {result.algorithm} {cert.role} DER
                      </Button>
                    </div>
                  )
                })}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  className="h-auto min-h-[44px] max-w-full whitespace-normal text-left"
                  variant="outline"
                  onClick={() =>
                    download(
                      result.certificateBody,
                      `sample-${result.algorithm.toLowerCase()}-certificate-body.bin`
                    )
                  }
                >
                  Download {result.algorithm} Certificate body
                </Button>
                <Button
                  className="h-auto min-h-[44px] max-w-full whitespace-normal text-left"
                  variant="outline"
                  onClick={() =>
                    download(
                      result.handshakeMessage,
                      `sample-${result.algorithm.toLowerCase()}-handshake.bin`
                    )
                  }
                >
                  Download {result.algorithm} Handshake message
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
