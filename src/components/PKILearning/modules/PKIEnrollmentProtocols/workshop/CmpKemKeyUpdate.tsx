// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState } from 'react'
import { Loader2, RefreshCw, CheckCircle2, Info, BookOpen, ExternalLink } from 'lucide-react'
import { openSSLService } from '@/services/crypto/OpenSSLService'
import { Button } from '@/components/ui/button'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { ErrorAlert } from '@/components/ui/error-alert'
import {
  WorkshopOperationLog,
  type LogEntry,
} from '@/components/PKILearning/common/WorkshopOperationLog'
import { CA_ROOT_CERT_PATH, CA_ROOT_KEY_PATH, ML_KEM_ALG } from '../constants'

type Event = { side: string; event: string; detail: string }
interface KurResult {
  publicKey: string
  certificate: string
  events: Event[]
}

/** Actual encrypted-certificate KUR, using the opt-in modified sample CMP server. */
export const CmpKemKeyUpdate: React.FC = () => {
  const [busy, setBusy] = useState(false)
  const [scenario, setScenario] = useState('authorized')
  const [phase, setPhase] = useState('idle')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<KurResult | null>(null)
  const [logEntries, setLogEntries] = useState<LogEntry[]>([])

  const handleRun = async () => {
    setBusy(true)
    setError(null)
    setResult(null)
    setLogEntries([
      {
        status: 'pending',
        message: 'Preparing fictional prior enrollment and a fresh renewal key…',
      },
    ])
    const start = performance.now()
    try {
      // A fresh scenario CA avoids changing or silently replacing the cached CA
      // used by the other enrollment exercises.
      const ca = await openSSLService.generateCaRoot({
        algorithm: 'ML-DSA-65',
        subjectDn: '/CN=Fictional CMP Renewal CA',
        keyOutPath: CA_ROOT_KEY_PATH,
        certOutPath: CA_ROOT_CERT_PATH,
        days: 1,
      })
      if (!ca.ok || !ca.certPem || !ca.keyPem)
        throw new Error(ca.error || 'Scenario CA generation failed')
      const caFiles = [
        { name: CA_ROOT_CERT_PATH.replace(/^\//, ''), data: ca.certPem },
        { name: CA_ROOT_KEY_PATH.replace(/^\//, ''), data: ca.keyPem },
      ]
      const generate = async (path: string, algorithm = ML_KEM_ALG) => {
        const generated = await openSSLService.execute(
          `openssl genpkey -algorithm ${algorithm} -out ${path}`
        )
        if (generated.error) throw new Error(generated.error)
        const file = generated.files.find((f) => '/' + f.name === path)
        if (!file) throw new Error(`${algorithm} key generation produced no key`)
        return file
      }
      setPhase('Preparing the authorized prior enrollment')
      const oldKey = await generate('/cmp-old.key.pem')
      const prior = await openSSLService.simulateCmp({
        eeKeyPath: '/cmp-old.key.pem',
        subjectDn: '/CN=Fictional renewal learner/O=PQC Today',
        reference: 'fictional-renewal',
        secret: 'fictional-sample-secret',
        caCertPath: CA_ROOT_CERT_PATH,
        caKeyPath: CA_ROOT_KEY_PATH,
        outCertPath: '/cmp-prior.cert.pem',
        files: [...caFiles, oldKey],
      })
      if (!prior.ok || !prior.certPem) throw new Error(prior.error || 'Prior enrollment failed')
      setPhase('Preparing the separately authorized ML-DSA-65 signing identity')
      const signingKey = await generate('/cmp-signer.key.pem', 'ML-DSA-65')
      const signingIdentity = await openSSLService.simulateCmp({
        eeKeyPath: '/cmp-signer.key.pem',
        subjectDn: '/CN=Fictional CMP Renewal Signer',
        reference: 'fictional-signer-bootstrap',
        secret: 'fictional-signer-bootstrap-secret',
        caCertPath: CA_ROOT_CERT_PATH,
        caKeyPath: CA_ROOT_KEY_PATH,
        outCertPath: '/cmp-signer.cert.pem',
        files: [...caFiles, signingKey],
      })
      if (!signingIdentity.ok || !signingIdentity.certPem)
        throw new Error(signingIdentity.error || 'Signing identity enrollment failed')
      const signingProfile = await openSSLService.execute(
        `openssl x509 -in /cmp-signer-bootstrap.pem -CA ${CA_ROOT_CERT_PATH} -CAkey ${CA_ROOT_KEY_PATH} -set_serial 42 -days 1 -extfile /cmp-signer.cnf -out /cmp-signer.cert.pem`,
        [
          ...caFiles,
          { name: 'cmp-signer-bootstrap.pem', data: signingIdentity.certPem },
          {
            name: 'cmp-signer.cnf',
            data: new TextEncoder().encode(
              'basicConstraints=critical,CA:FALSE\nkeyUsage=critical,digitalSignature\n'
            ),
          },
        ]
      )
      if (signingProfile.error) throw new Error(signingProfile.error)
      const signerCert = signingProfile.files.find((f) => f.name === 'cmp-signer.cert.pem')
      if (!signerCert) throw new Error('Signing profile produced no certificate')
      let requestPrior = prior.certPem
      if (scenario === 'unauthorized') {
        const other = await openSSLService.simulateCmp({
          eeKeyPath: '/cmp-old.key.pem',
          subjectDn: '/CN=Fictional other enrollment/O=PQC Today',
          reference: 'fictional-renewal',
          secret: 'fictional-sample-secret',
          caCertPath: CA_ROOT_CERT_PATH,
          caKeyPath: CA_ROOT_KEY_PATH,
          outCertPath: '/cmp-other.cert.pem',
          files: [...caFiles, oldKey],
        })
        if (!other.ok || !other.certPem)
          throw new Error(other.error || 'Other sample enrollment failed')
        requestPrior = other.certPem
      }
      setPhase('Generating a fresh ML-KEM-768 renewal key')
      const freshKey = await generate('/cmp-new.key.pem')
      setPhase('Running KUR → encrypted KUP → certConf → PKIConfirm')
      const renewed = await openSSLService.executeCmpSignedKeyUpdate({
        eeKeyPath: '/cmp-new.key.pem',
        oldCertPath: '/cmp-request-prior.pem',
        authorizedPriorPath: '/cmp-authorized-prior.pem',
        subjectDn: '/CN=Fictional renewal learner/O=PQC Today',
        signerCertPath: '/cmp-signer.cert.pem',
        signerKeyPath: '/cmp-signer.key.pem',
        authorizedSignerPath: '/cmp-authorized-signer.pem',
        profile: 'MLKEM768-MLDSA65-explicit-confirm-v1',
        caCertPath: CA_ROOT_CERT_PATH,
        caKeyPath: CA_ROOT_KEY_PATH,
        outCertPath: '/cmp-renewed.cert.pem',
        files: [
          ...caFiles,
          freshKey,
          signingKey,
          signerCert,
          { name: 'cmp-authorized-signer.pem', data: signerCert.data },
          { name: 'cmp-request-prior.pem', data: requestPrior },
          { name: 'cmp-authorized-prior.pem', data: prior.certPem },
        ],
      })
      if (
        !renewed.ok ||
        renewed.operation !== 'KUR' ||
        !renewed.proofVerified ||
        !renewed.confirmationAccepted ||
        !renewed.certPem
      ) {
        const rejection = renewed.transcript?.find((event) =>
          ['rejected', 'confirmation_rejected'].includes(event.event)
        )
        throw new Error(
          rejection?.detail || renewed.error || 'Key update did not complete explicit confirmation'
        )
      }
      const decoded = await openSSLService.execute(
        'openssl x509 -in /cmp-renewed.cert.pem -text -noout',
        [{ name: 'cmp-renewed.cert.pem', data: renewed.certPem }]
      )
      if (decoded.error) throw new Error(decoded.error)
      const exported = await openSSLService.execute(
        'openssl pkey -in /cmp-new.key.pem -pubout -out /cmp-new.pub.pem',
        [freshKey]
      )
      if (exported.error) throw new Error(exported.error)
      const pub = exported.files.find((f) => f.name === 'cmp-new.pub.pem')
      if (!pub) throw new Error('New public key export failed')
      setResult({
        publicKey: new TextDecoder().decode(pub.data),
        certificate: decoded.stdout,
        events: renewed.transcript,
      })
      setPhase('done')
      setLogEntries([
        {
          status: 'success',
          message:
            'Key update completed: encrypted certificate recovered, explicit confirmation accepted and PKIConfirm received.',
          durationMs: Math.round(performance.now() - start),
        },
      ])
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      setError(message)
      setPhase('failed')
      setLogEntries([
        {
          status: 'error',
          message: `Key update incomplete: ${message}`,
          durationMs: Math.round(performance.now() - start),
        },
      ])
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="space-y-4">
      <div className="rounded-md border border-primary/30 bg-primary/5 p-3 flex items-start gap-3 text-sm">
        <Info size={16} className="mt-0.5 shrink-0 text-primary" />
        <div>
          <div className="font-medium">ML-KEM certificate key update</div>
          <p className="mt-1 text-muted-foreground">
            The sample server encrypts a newly issued certificate to the fresh ML-KEM-768 key. The
            client must recover and validate it, then confirm its hash before the server completes
            the transaction. A separate fictional ML-DSA-65 signing identity authorizes renewal; its
            signature does not prove possession of the new ML-KEM private key.
          </p>
          <p className="mt-2 text-muted-foreground">
            The starting enrollment is pre-authorized for this fictional identity. Its issuer and
            serial are checked separately from the new-key proof. This uses an opt-in modification
            of the bundled OpenSSL CMP server, rather than support in unmodified OpenSSL 3.6.3.
          </p>
        </div>
      </div>
      <FilterDropdown
        label="Sample prior-certificate authorization"
        selectedId={scenario}
        disabled={busy}
        hideDefaultOption
        items={[
          { id: 'authorized', label: 'Authorized prior enrollment' },
          { id: 'unauthorized', label: 'Different prior enrollment — expect rejection' },
        ]}
        onSelect={(id) => {
          setScenario(id)
          setResult(null)
          setError(null)
          setLogEntries([])
          setPhase('idle')
        }}
      />
      <Button onClick={handleRun} disabled={busy}>
        {busy ? (
          <Loader2 size={14} className="mr-2 animate-spin" />
        ) : (
          <RefreshCw size={14} className="mr-2" />
        )}
        Run key update
      </Button>
      {busy && (
        <p role="status" className="text-sm text-muted-foreground">
          {phase}
        </p>
      )}
      {error && <ErrorAlert message={error} onRetry={handleRun} />}
      <WorkshopOperationLog entries={logEntries} />
      {result && (
        <div className="space-y-3">
          <p className="flex items-center gap-2 text-sm text-status-success">
            <CheckCircle2 size={16} />
            New-key possession and explicit confirmation verified for this sample.
          </p>
          <details className="rounded-md border border-border p-3">
            <summary>Actual transaction events</summary>
            <ol className="mt-2 space-y-2 text-xs">
              {result.events.map((e, i) => (
                <li key={i}>
                  <strong>
                    {e.side}: {e.event}
                  </strong>{' '}
                  — {e.detail}
                </li>
              ))}
            </ol>
          </details>
          <details className="rounded-md border border-border p-3">
            <summary>Recovered certificate</summary>
            <pre className="mt-2 overflow-auto text-xs">{result.certificate}</pre>
          </details>
          <details className="rounded-md border border-border p-3">
            <summary>Fresh public key</summary>
            <pre className="mt-2 overflow-auto text-xs">{result.publicKey}</pre>
          </details>
        </div>
      )}
      <p className="text-sm text-muted-foreground">
        For your production tools, test authorization of the prior enrollment, encrypted-certificate
        recovery, certificate validation, transaction binding and explicit confirmation—including
        rejection cases. This fictional exchange does not validate a deployed CA or its policies.
      </p>
      <details className="rounded-md border border-border bg-muted/30 p-3 text-sm">
        <summary className="cursor-pointer font-medium text-foreground flex items-center gap-2">
          <BookOpen size={14} /> Related standards and further reading
        </summary>
        <div className="mt-3 space-y-2 text-xs text-muted-foreground">
          <p>
            These references describe related formats and operations. A reference link does not
            establish conformance or show that this sample executes every protocol step.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-1 pr-2 font-medium text-foreground">Layer</th>
                  <th className="text-left py-1 pr-2 font-medium text-foreground">Standard</th>
                  <th className="text-left py-1 font-medium text-foreground">What it specifies</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                <tr className="border-b border-border/50">
                  <td className="py-1 pr-2">SPKI algorithm OID</td>
                  <td className="py-1 pr-2">
                    <a
                      href="https://www.rfc-editor.org/rfc/rfc9935"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-0.5"
                    >
                      RFC 9935 <ExternalLink size={10} />
                    </a>
                  </td>
                  <td className="py-1">ML-KEM-512/768/1024 OIDs in X.509</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-1 pr-2">SPKI key bytes (1184 B)</td>
                  <td className="py-1 pr-2">
                    <a
                      href="https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.203.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-0.5"
                    >
                      FIPS 203 <ExternalLink size={10} />
                    </a>
                  </td>
                  <td className="py-1">ML-KEM key generation + encap/decap</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-1 pr-2">signatureAlgorithm OID</td>
                  <td className="py-1 pr-2">
                    <a
                      href="https://www.rfc-editor.org/rfc/rfc9881"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-0.5"
                    >
                      RFC 9881 <ExternalLink size={10} />
                    </a>
                  </td>
                  <td className="py-1">ML-DSA-44/65/87 OIDs in X.509</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-1 pr-2">signatureValue bytes (3309 B)</td>
                  <td className="py-1 pr-2">
                    <a
                      href="https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.204.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-0.5"
                    >
                      FIPS 204 <ExternalLink size={10} />
                    </a>
                  </td>
                  <td className="py-1">ML-DSA signing (CA side)</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-1 pr-2">CMP protocol and certificate confirmation</td>
                  <td className="py-1 pr-2">
                    <a
                      href="https://www.rfc-editor.org/rfc/rfc9810"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-0.5"
                    >
                      RFC 9810 <ExternalLink size={10} />
                    </a>
                  </td>
                  <td className="py-1">Certificate Management Protocol (2025-07)</td>
                </tr>
                <tr>
                  <td className="py-1 pr-2">Downstream: same cert in S/MIME</td>
                  <td className="py-1 pr-2">
                    <a
                      href="https://www.rfc-editor.org/rfc/rfc9936"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-0.5"
                    >
                      RFC 9936 <ExternalLink size={10} />
                    </a>
                  </td>
                  <td className="py-1">ML-KEM in CMS (2026-03)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </details>
    </div>
  )
}
