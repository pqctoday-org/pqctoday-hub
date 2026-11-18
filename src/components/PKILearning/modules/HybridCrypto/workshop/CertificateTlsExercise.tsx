// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect, useId, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { openSSLService } from '@/services/crypto/OpenSSLService'
import {
  runCertificateTlsExercise,
  type CertificateTlsEvidence,
} from '../services/certificateTlsExercise'

export function CertificateTlsExercise() {
  const id = useId()
  const [running, setRunning] = useState(false)
  const [stage, setStage] = useState('')
  const [evidence, setEvidence] = useState<CertificateTlsEvidence | null>(null)
  const [error, setError] = useState('')
  const [prediction, setPrediction] = useState<'reuse' | 'replace' | null>(null)
  const rsaBaseline = evidence?.runs[0]
  const rsaHybrid = evidence?.runs[1]
  const observedReuse =
    rsaBaseline?.passed &&
    rsaHybrid?.passed &&
    rsaBaseline.observedSignature === rsaHybrid.observedSignature
  const observedAll =
    evidence?.runs.every((row) => row.passed) && evidence.checks.every((check) => check.passed)
  const alive = useRef(true)
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])
  const run = async () => {
    setRunning(true)
    setEvidence(null)
    setError('')
    setStage('Preparing sample TLS inputs…')
    try {
      const result = await runCertificateTlsExercise(openSSLService, (value) => {
        if (alive.current) setStage(value)
      })
      if (alive.current) setEvidence(result)
    } catch (err) {
      if (alive.current) setError(err instanceof Error ? err.message : String(err))
    } finally {
      if (alive.current) setRunning(false)
    }
  }
  return (
    <section className="glass-panel p-5 space-y-4" aria-labelledby={`${id}-title`}>
      <h3 id={`${id}-title`} className="text-lg font-semibold">
        Certificate-to-TLS exercise
      </h3>
      <p className="text-sm text-muted-foreground">
        Compare three local OpenSSL handshakes using RSA or ML-DSA-65 authentication and X25519 or
        X25519MLKEM768 key exchange. Each run uses TLS_AES_256_GCM_SHA384.
      </p>
      <fieldset className="space-y-2 rounded border border-border p-3" disabled={running}>
        <legend className="px-1 text-sm font-medium">
          Can the server keep its RSA certificate when it switches only the key exchange group?
        </legend>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name={`${id}-prediction`}
            checked={prediction === 'reuse'}
            onChange={() => setPrediction('reuse')}
          />
          Yes, the same RSA certificate can be used
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name={`${id}-prediction`}
            checked={prediction === 'replace'}
            onChange={() => setPrediction('replace')}
          />
          No, the server needs a new certificate
        </label>
      </fieldset>
      <p className="text-sm text-muted-foreground">
        Fresh sample CAs issue certificates for hybrid.example.test with a DNS SAN, digitalSignature
        key usage and serverAuth purpose. The exercise verifies each path and hostname before the
        TLS runs, then tries a wrong hostname, an unrelated CA and an incompatible signature scheme.
        These are fictional, in-browser peers; no network connection is made.
      </p>
      <Button onClick={run} disabled={running} aria-busy={running}>
        {running ? 'Running certificate-to-TLS exercise…' : 'Run certificate-to-TLS exercise'}
      </Button>
      {running && (
        <p role="status" className="text-sm">
          {stage}
        </p>
      )}
      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}
      {evidence && (
        <div className="space-y-4" aria-live="polite">
          <p className="font-medium">
            {observedAll
              ? 'All three handshakes and rejection checks passed.'
              : 'Some checks failed. Inspect the observed results below.'}
          </p>
          {observedReuse && (
            <div className="space-y-1 rounded border border-border p-3 text-sm">
              {prediction && (
                <p className="font-medium">
                  {prediction === 'reuse'
                    ? 'Your prediction matches the measured handshakes.'
                    : 'Compare the first two rows and try the prediction again.'}
                </p>
              )}
              <p>
                The same RSA certificate worked in both handshakes. Key exchange changed from{' '}
                <code>{rsaBaseline.observedGroup}</code> to <code>{rsaHybrid.observedGroup}</code>.
                The server authenticated with <code>{rsaHybrid.observedSignature}</code> in both.
              </p>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <caption className="text-left text-muted-foreground pb-2">
                Measured handshake results
              </caption>
              <thead>
                <tr>
                  <th className="p-2">Scenario</th>
                  <th className="p-2">Negotiated key exchange</th>
                  <th className="p-2">CertificateVerify</th>
                  <th className="p-2">Result</th>
                </tr>
              </thead>
              <tbody>
                {evidence.runs.map((r) => (
                  <tr key={r.label} className="border-t border-border">
                    <th scope="row" className="p-2 font-normal">
                      {r.label}
                    </th>
                    <td className="p-2 break-all">{r.observedGroup || 'Not observed'}</td>
                    <td className="p-2 break-all">{r.observedSignature || 'Not observed'}</td>
                    <td className="p-2">{r.passed ? 'Passed' : 'Failed'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {evidence.checks.map((c) => (
            <details key={c.label} className="text-sm">
              <summary>
                {c.passed ? 'Passed' : 'Failed'} — {c.label}
              </summary>
              <pre className="whitespace-pre-wrap break-all text-xs p-2">{c.detail}</pre>
            </details>
          ))}
          {evidence.certificates.map((cert) => (
            <details key={cert.label}>
              <summary className="text-sm">Inspect {cert.label}</summary>
              <pre className="overflow-x-auto text-xs p-2">{cert.pem}</pre>
            </details>
          ))}
          <details>
            <summary className="text-sm">Inspect handshake traces</summary>
            <pre className="text-xs whitespace-pre-wrap break-all p-2">
              {JSON.stringify(
                evidence.runs.map(({ label, trace }) => ({ label, trace })),
                null,
                2
              )}
            </pre>
          </details>
        </div>
      )}
      {observedAll && (
        <p className="text-sm">
          RFC 10024 defines hybrid key exchange groups. The third run uses ML-DSA for its sample CA
          chain and CertificateVerify. RFC 10073 specifies Composite ML-DSA in X.509. Using it for
          CertificateVerify also requires a compatible TLS signature scheme in both peers. This
          OpenSSL build supports the single-algorithm signing profiles shown above.
          CertificateVerify uses a signing key. KEM certificates serve key establishment in
          applications that support those profiles.
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Hostname checking here is a separate OpenSSL verification step, not proof that every TLS
        client checks hostnames. In your own tools, require endpoint identity and chain validation,
        inspect the negotiated group and signature scheme, and test incompatible peers and trust
        anchors. These sample results do not assess a deployed service or public-browser trust.
      </p>
      <a className="text-sm text-primary underline" href="/learn/tls-basics?tab=workshop">
        Explore the TLS simulator
      </a>
    </section>
  )
}
