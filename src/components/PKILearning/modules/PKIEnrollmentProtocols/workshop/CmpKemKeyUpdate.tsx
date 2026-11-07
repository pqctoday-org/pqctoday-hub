// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState } from 'react'
import {
  Loader2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Info,
  FileText,
  BookOpen,
  ExternalLink,
} from 'lucide-react'
import { openSSLService } from '@/services/crypto/OpenSSLService'
import { Button } from '@/components/ui/button'
import { ErrorAlert } from '@/components/ui/error-alert'
import {
  WorkshopOperationLog,
  type LogEntry,
} from '@/components/PKILearning/common/WorkshopOperationLog'
import { ensureMockCA } from '../mock-ca/mockCA'
import { CA_ROOT_CERT_PATH, CA_ROOT_KEY_PATH, ML_KEM_ALG } from '../constants'

interface KurResult {
  newKemPubPem: string
  newKemCertText: string
  encapSharedHex: string
  decapSharedHex: string
  match: boolean
}

/**
 * Sample CMP IR enrollment followed by a separate ML-KEM encapsulation /
 * decapsulation round trip. No KUR, encrypted-certificate recovery or complete
 * certificate-confirmation exchange is executed by this component.
 */
export const CmpKemKeyUpdate: React.FC = () => {
  const [busy, setBusy] = useState(false)
  const [phase, setPhase] = useState<string>('idle')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<KurResult | null>(null)
  const [logEntries, setLogEntries] = useState<LogEntry[]>([])

  const handleRun = async () => {
    setBusy(true)
    setError(null)
    setResult(null)
    setPhase('Generating ML-KEM-768 keypair')
    const startedAt = performance.now()
    setLogEntries([
      {
        status: 'pending',
        message: 'Running sample enrollment and KEM round trip (keygen → IR → encap → decap)…',
      },
    ])
    try {
      const ca = await ensureMockCA()
      const caFiles = [
        { name: CA_ROOT_CERT_PATH.replace(/^\//, ''), data: ca.certPem },
        { name: CA_ROOT_KEY_PATH.replace(/^\//, ''), data: ca.keyPem },
      ]

      const newKeyPath = '/ee-mlkem.key.pem'
      const newPubPath = '/ee-mlkem.pub.pem'
      const newCertPath = '/ee-mlkem.cert.pem'
      const ctPath = '/kem.ct.bin'
      const ssAPath = '/secret_ca.bin'
      const ssBPath = '/secret_ee.bin'

      // 1. Generate ML-KEM-768 keypair
      const genResult = await openSSLService.execute(
        `openssl genpkey -algorithm ${ML_KEM_ALG} -out ${newKeyPath}`
      )
      if (genResult.error) throw new Error(genResult.error + '\n' + genResult.stderr)
      const newKeyFile = genResult.files.find((f) => '/' + f.name === newKeyPath)
      if (!newKeyFile) throw new Error('ML-KEM keygen produced no key')

      // 2. Extract pubkey (we'll need it for encap and to inspect)
      setPhase('Extracting ML-KEM public key')
      const pubResult = await openSSLService.execute(
        `openssl pkey -in ${newKeyPath} -pubout -out ${newPubPath}`,
        [{ name: newKeyPath.replace(/^\//, ''), data: newKeyFile.data }]
      )
      if (pubResult.error) throw new Error(pubResult.error + '\n' + pubResult.stderr)
      const pubFile = pubResult.files.find((f) => '/' + f.name === newPubPath)
      if (!pubFile) throw new Error('Public key export failed')
      const pubPem = new TextDecoder().decode(pubFile.data)

      // 3. Enroll the ML-KEM key via CMP IR (server signs with CA's ML-DSA key).
      //    Re-uses the SAME execute_cmp_simulation shim as Step 2 / Step 5 — the
      //    server callback is algorithm-agnostic and happily issues a cert with
      //    an ML-KEM pubkey, signed by the CA's ML-DSA-65 key.
      setPhase('Enrolling ML-KEM cert via CMP IR (CA signs with ML-DSA-65)')
      const enrollResult = await openSSLService.simulateCmp({
        eeKeyPath: newKeyPath,
        subjectDn: '/CN=Workshop EE (ML-KEM rotation leg)/O=PQC Today/C=US',
        reference: 'workshop-ee-mlkem-001',
        secret: 'workshop-shared-secret',
        caCertPath: CA_ROOT_CERT_PATH,
        caKeyPath: CA_ROOT_KEY_PATH,
        outCertPath: newCertPath,
        files: [...caFiles, { name: newKeyPath.replace(/^\//, ''), data: newKeyFile.data }],
      })
      if (!enrollResult.ok || !enrollResult.certPem) {
        throw new Error(`ML-KEM CMP enrollment failed: ${enrollResult.error || 'unknown'}`)
      }
      const newCertName = newCertPath.replace(/^\//, '')
      const certDecode = await openSSLService.execute(
        `openssl x509 -in ${newCertPath} -text -noout`,
        [{ name: newCertName, data: enrollResult.certPem }]
      )

      // 4. CA side: encapsulate a fresh shared secret under the EE's ML-KEM pubkey.
      //    This primitive round trip does not encrypt the issued certificate.
      setPhase('CA encapsulates shared secret under ML-KEM pubkey')
      const encapResult = await openSSLService.execute(
        `openssl pkeyutl -encap -inkey ${newPubPath} -pubin -out ${ctPath} -secret ${ssAPath}`,
        [{ name: newPubPath.replace(/^\//, ''), data: pubFile.data }]
      )
      if (encapResult.error) throw new Error(`encap: ${encapResult.error}\n${encapResult.stderr}`)
      const ctFile = encapResult.files.find((f) => '/' + f.name === ctPath)
      const ssAFile = encapResult.files.find((f) => '/' + f.name === ssAPath)
      if (!ctFile || !ssAFile) throw new Error('encap produced no ciphertext or shared secret')

      // 5. EE side: decapsulate the sample KEM ciphertext.
      setPhase('EE decapsulates the sample shared secret with ML-KEM private key')
      const decapResult = await openSSLService.execute(
        `openssl pkeyutl -decap -inkey ${newKeyPath} -in ${ctPath} -out ${ssBPath}`,
        [
          { name: newKeyPath.replace(/^\//, ''), data: newKeyFile.data },
          { name: ctPath.replace(/^\//, ''), data: ctFile.data },
        ]
      )
      if (decapResult.error) throw new Error(`decap: ${decapResult.error}\n${decapResult.stderr}`)
      const ssBFile = decapResult.files.find((f) => '/' + f.name === ssBPath)
      if (!ssBFile) throw new Error('decap produced no shared secret')

      // 6. Compare
      const hex = (b: Uint8Array) =>
        Array.from(b)
          .map((x) => x.toString(16).padStart(2, '0'))
          .join('')
      const ssAHex = hex(ssAFile.data)
      const ssBHex = hex(ssBFile.data)
      const match = ssAHex === ssBHex && ssAHex.length > 0

      setResult({
        newKemPubPem: pubPem,
        newKemCertText: certDecode.stdout,
        encapSharedHex: ssAHex,
        decapSharedHex: ssBHex,
        match,
      })
      setPhase('done')
      setLogEntries([
        {
          status: 'success',
          message: `Sample KEM round trip — shared secrets ${match ? 'match' : 'DIFFER'}`,
          durationMs: Math.round(performance.now() - startedAt),
        },
      ])
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg)
      setLogEntries([
        {
          status: 'error',
          message: `Sample enrollment / KEM round trip failed — ${msg}`,
          durationMs: Math.round(performance.now() - startedAt),
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
          <div className="font-medium text-foreground">CMP enrollment and ML-KEM round trip</div>
          <p className="mt-1 text-muted-foreground">
            This sample enrolls an ML-KEM certificate using the existing CMP IR simulation, then
            separately encapsulates and decapsulates a sample shared secret. It does not send a KUR
            request, encrypt and recover the issued certificate, or demonstrate the complete
            certificate-confirmation exchange. Matching secrets establish agreement for this sample
            KEM operation, not completed CMP proof of possession.
          </p>
        </div>
      </div>

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

      <Button
        variant="gradient"
        onClick={handleRun}
        disabled={busy}
        className="h-auto whitespace-normal flex items-center gap-2"
      >
        {busy ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
        {busy ? `Working: ${phase}` : 'Run sample enrollment and KEM round trip'}
      </Button>

      {logEntries.length > 0 && <WorkshopOperationLog entries={logEntries} />}

      {error && <ErrorAlert message={error} onRetry={handleRun} />}

      {result && (
        <div className="space-y-3">
          <div
            className={`flex items-center gap-2 text-sm ${result.match ? 'text-status-success' : 'text-status-error'}`}
          >
            {result.match ? (
              <>
                <CheckCircle2 size={16} />
                <span>
                  <strong>Sample shared secrets match.</strong> The encapsulated and decapsulated
                  secrets agree byte-for-byte for this sample KEM operation.
                </span>
              </>
            ) : (
              <>
                <AlertTriangle size={16} />
                <span>
                  Sample shared secrets differ — this KEM round trip did not establish agreement.
                </span>
              </>
            )}
          </div>

          <details open className="rounded border border-border bg-muted/30 p-3">
            <summary className="cursor-pointer text-sm font-medium text-foreground flex items-center gap-2">
              <FileText size={14} /> ML-KEM-768 EE certificate (issued by mock CA via CMP)
            </summary>
            <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-all font-mono text-[10px] text-muted-foreground">
              {result.newKemCertText}
            </pre>
          </details>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded border border-border bg-muted/30 p-3">
              <div className="text-xs font-medium text-foreground mb-1">
                CA-side shared secret (encap)
              </div>
              <pre className="font-mono text-[10px] break-all text-muted-foreground">
                {result.encapSharedHex}
              </pre>
            </div>
            <div className="rounded border border-border bg-muted/30 p-3">
              <div className="text-xs font-medium text-foreground mb-1">
                EE-side shared secret (decap)
              </div>
              <pre className="font-mono text-[10px] break-all text-muted-foreground">
                {result.decapSharedHex}
              </pre>
            </div>
          </div>

          <details className="rounded border border-border bg-muted/30 p-3">
            <summary className="cursor-pointer text-sm font-medium text-foreground">
              ML-KEM-768 public key (PEM)
            </summary>
            <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-all font-mono text-[10px] text-muted-foreground">
              {result.newKemPubPem}
            </pre>
          </details>
        </div>
      )}
    </div>
  )
}
