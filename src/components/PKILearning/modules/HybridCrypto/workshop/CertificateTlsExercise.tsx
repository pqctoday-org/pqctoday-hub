// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect, useId, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { openSSLService } from '@/services/crypto/OpenSSLService'
import {
  runCertificateTlsExercise,
  TLS_EXERCISE_HYBRID_GROUPS,
  type CertificateTlsEvidence,
} from '../services/certificateTlsExercise'

export function CertificateTlsExercise() {
  const id = useId()
  const [running, setRunning] = useState(false)
  const [stage, setStage] = useState('')
  const [evidence, setEvidence] = useState<CertificateTlsEvidence | null>(null)
  const [error, setError] = useState('')
  const [prediction, setPrediction] = useState<'reuse' | 'replace' | null>(null)
  const [authenticationPolicy, setAuthenticationPolicy] = useState('rsa')
  const [requiredGroup, setRequiredGroup] = useState<string>(TLS_EXERCISE_HYBRID_GROUPS[0])
  const mixedIssuer = authenticationPolicy === 'mixed-issuer'
  const matchingSignature =
    authenticationPolicy === 'rsa' || mixedIssuer
      ? 'rsa_pss_rsae_sha256'
      : authenticationPolicy === 'single-pq'
        ? 'mldsa65'
        : null
  const matchingRun = matchingSignature
    ? evidence?.runs.find(
        ({ group, signature, issuerSignature, passed }) =>
          passed &&
          group === requiredGroup &&
          signature === matchingSignature &&
          (!mixedIssuer || issuerSignature.toLowerCase() === 'ml-dsa-65')
      )
    : undefined
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
        Compare local OpenSSL handshakes using the same RSA certificate over X25519 and all three
        RFC 10024 hybrid groups. The X25519MLKEM768 cases also vary the TLS authentication and the
        certificate issuer. Each run uses TLS_AES_256_GCM_SHA384.
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
        It also issues a separate encipherment certificate with an ML-KEM-768 subject key and checks
        whether that key can serve as the TLS signer. The peers run locally in your browser.
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
              ? 'All handshakes and rejection checks passed.'
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
          <div
            className="overflow-x-auto rounded-sm focus-visible:outline-2 focus-visible:outline-ring"
            role="region"
            aria-label="Handshake comparison"
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- WCAG scrollable-region-focusable: the table rows hold no focusable content, so the scroll region itself must be reachable by keyboard
            tabIndex={0}
          >
            <table className="w-full text-sm text-left">
              <caption className="text-left text-muted-foreground pb-2">
                Measured handshake results
              </caption>
              <thead>
                <tr>
                  <th className="p-2">Scenario</th>
                  <th className="p-2">Negotiated key exchange</th>
                  <th className="p-2">X.509 leaf</th>
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
                    <td className="p-2">
                      <dl className="min-w-32">
                        <dt className="text-muted-foreground">Subject key</dt>
                        <dd className="break-all">{r.subjectKey || 'Not observed'}</dd>
                        <dt className="mt-1 text-muted-foreground">Issuer signature</dt>
                        <dd className="break-all">{r.issuerSignature || 'Not observed'}</dd>
                      </dl>
                    </td>
                    <td className="p-2 break-all">{r.observedSignature || 'Not observed'}</td>
                    <td className="p-2">{r.passed ? 'Passed' : 'Failed'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="space-y-2 rounded border border-border p-3 text-sm">
            <label className="block">
              Required key exchange group
              {/* eslint-disable-next-line no-restricted-syntax -- Native <select> preserved for form semantics and Playwright combobox/selectOption tests */}
              <select
                className="mt-1 block min-h-11 max-w-full rounded border border-border bg-background p-2"
                value={requiredGroup}
                onChange={(event) => setRequiredGroup(event.target.value)}
              >
                {TLS_EXERCISE_HYBRID_GROUPS.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              Required authentication with {requiredGroup}
              {/* eslint-disable-next-line no-restricted-syntax -- Native <select> preserved for form semantics and Playwright combobox/selectOption tests */}
              <select
                className="mt-1 block max-w-full rounded border border-border bg-background p-2"
                value={authenticationPolicy}
                onChange={(event) => setAuthenticationPolicy(event.target.value)}
              >
                <option value="rsa">RSA authentication</option>
                <option value="single-pq">Single-algorithm ML-DSA-65 authentication</option>
                <option value="mixed-issuer">RSA leaf with an ML-DSA-65 issuer signature</option>
                <option value="composite">Composite ML-DSA authentication</option>
                <option value="kem-leaf">ML-KEM-768 certificate as the signing credential</option>
              </select>
            </label>
            <p role="status" aria-label="TLS authentication evidence">
              {matchingRun
                ? mixedIssuer
                  ? 'The verified certificate has an ML-DSA-65 issuer signature. CertificateVerify was RSA-PSS, because the server holds the RSA subject key.'
                  : `Matching observed handshake: ${matchingRun.label}.`
                : authenticationPolicy === 'composite'
                  ? 'Composite authentication is unverified in this exercise. The measured runs use RSA and single-algorithm ML-DSA.'
                  : authenticationPolicy === 'kem-leaf' &&
                      requiredGroup === 'X25519MLKEM768' &&
                      evidence.kemAuthenticationRejected
                    ? 'The ML-KEM-768 certificate passed the CA path and DNS checks. Its key could not sign, and the attempted TLS authentication failed.'
                    : 'No completed handshake matches this requirement.'}
            </p>
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
      <p className="text-sm">
        RFC 10024 defines hybrid key exchange groups. RFC 10073 defines Composite ML-DSA in X.509.
        The{' '}
        <a
          className="text-primary underline"
          href="https://datatracker.ietf.org/doc/draft-ietf-tls-composite-mldsa/"
        >
          TLS working group’s Composite ML-DSA draft
        </a>{' '}
        proposes separate CertificateVerify schemes. Both peers need a compatible scheme for
        composite TLS authentication.
      </p>
      <p className="text-sm">
        <a
          className="text-primary underline"
          href="https://www.rfc-editor.org/rfc/rfc9935.html#section-5"
        >
          RFC 9935
        </a>{' '}
        specifies encipherment usage for an ML-KEM subject key. In TLS 1.3,{' '}
        <a
          className="text-primary underline"
          href="https://www.ietf.org/ietf-ftp/rfc/rfc9846.html#section-4.5.2"
        >
          CertificateVerify
        </a>{' '}
        requires a compatible signing key from the end-entity certificate.
      </p>
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
