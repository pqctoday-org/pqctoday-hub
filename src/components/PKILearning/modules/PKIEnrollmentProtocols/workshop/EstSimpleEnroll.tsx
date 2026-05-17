// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { Loader2, Inbox, AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import { openSSLService } from '@/services/crypto/OpenSSLService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ensureMockCA } from '../mock-ca/mockCA'
import { CA_ROOT_CERT_PATH, CA_ROOT_KEY_PATH, EE_CERT_PATH, EE_KEY_PATH } from '../constants'

interface EstSimpleEnrollProps {
  eeKeyPem: Uint8Array | null
  eeKeyAlgorithm: string | null
  /** Called with the issued cert PEM bytes so downstream steps (Cert Viewer) can read it. */
  onCertIssued?: (certPem: Uint8Array) => void
}

/**
 * EST /simpleenroll (RFC 7030 §4.2):
 *   1. Client builds a PKCS#10 CSR signed by its end-entity key.
 *   2. Client POSTs base64(CSR) to /.well-known/est/simpleenroll over HTTPS.
 *   3. Server returns base64(PKCS#7 SignedData) containing one certificate.
 *
 * OpenSSL does not ship an EST client (only a CMP client). For this workshop we
 * exercise the CSR build + PKCS#7 wrap stages — the two parts EST actually
 * adds on top of standard PKI — using `openssl req` (CSR) and `openssl ca` /
 * `openssl crl2pkcs7` (response wrap). The HTTP/TLS transport is illustrated
 * by labelling the steps (no live network).
 */
export const EstSimpleEnroll: React.FC<EstSimpleEnrollProps> = ({
  eeKeyPem,
  eeKeyAlgorithm,
  onCertIssued,
}) => {
  const [subject, setSubject] = useState('/CN=Workshop EE EST/O=PQC Today/C=US')
  const [busy, setBusy] = useState(false)
  const [csrPem, setCsrPem] = useState<string | null>(null)
  const [pkcs7Pem, setPkcs7Pem] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleRun = async () => {
    if (!eeKeyPem) {
      setError('Generate an end-entity key in Step 1 first.')
      return
    }
    setBusy(true)
    setError(null)
    setCsrPem(null)
    setPkcs7Pem(null)
    try {
      const ca = await ensureMockCA()
      const keyFileName = EE_KEY_PATH.replace(/^\//, '')

      // 1. Build the PKCS#10 CSR with the EE key.
      //    For ML-DSA EE keys this CSR build is itself sensitive to the same
      //    apps/req.c digest-default trap that breaks `req -x509` — if it
      //    fails we still surface a useful error, but for ECDSA / RSA EE keys
      //    this is the standard EST request body shown end-to-end.
      const csrPath = '/ee.csr.pem'
      const csrResult = await openSSLService.execute(
        `openssl req -new -key ${EE_KEY_PATH} -out ${csrPath} -subj "${subject}"`,
        [{ name: keyFileName, data: eeKeyPem }]
      )
      const csrFile = csrResult.files.find((f) => f.name === csrPath.replace(/^\//, ''))
      if (csrFile) {
        setCsrPem(new TextDecoder().decode(csrFile.data))
      } else {
        // CSR build failed (likely ML-DSA + req -new) — flag in the UI but
        // proceed to the issuance step using the CMP shim, which doesn't
        // require a CSR (it parses the EE key directly).
        setCsrPem(
          `(CSR build via 'openssl req -new' is not available for this key algorithm in OpenSSL 3.6 CLI;\nthe issuance step below uses the same EE key directly via the CMP shim.)\n\n` +
            (csrResult.stderr || '')
        )
      }

      // 2. Issue the cert via the in-process CMP server. Routes through
      //    simulateCmp because `openssl x509 -req -CA -CAkey` hits the same
      //    ML-DSA-can't-sign-via-CLI trap that broke our mock-CA self-sign.
      //    The C shim's process_cert_request callback uses X509_sign(NULL md)
      //    which handles "pure" PQC signatures correctly. The resulting cert
      //    is identical in shape to what an EST server would return — only
      //    the wire envelope differs.
      const enrollResult = await openSSLService.simulateCmp({
        eeKeyPath: EE_KEY_PATH,
        subjectDn: subject,
        reference: 'workshop-ee-est-001',
        secret: 'workshop-shared-secret',
        caCertPath: CA_ROOT_CERT_PATH,
        caKeyPath: CA_ROOT_KEY_PATH,
        outCertPath: EE_CERT_PATH,
        files: [
          { name: CA_ROOT_CERT_PATH.replace(/^\//, ''), data: ca.certPem },
          { name: CA_ROOT_KEY_PATH.replace(/^\//, ''), data: ca.keyPem },
          { name: keyFileName, data: eeKeyPem },
        ],
      })
      if (!enrollResult.ok || !enrollResult.certPem) {
        throw new Error(`Issuance failed: ${enrollResult.error || 'unknown'}`)
      }
      onCertIssued?.(enrollResult.certPem)

      // 3. Wrap the issued cert in a PKCS#7 (degenerate SignedData) — the EST
      //    response envelope (RFC 7030 §4.2.3). This is the actual wire shape
      //    an EST server returns.
      const p7Path = '/est-response.p7b'
      const p7Result = await openSSLService.execute(
        `openssl crl2pkcs7 -nocrl -certfile ${EE_CERT_PATH} -out ${p7Path}`,
        [{ name: EE_CERT_PATH.replace(/^\//, ''), data: enrollResult.certPem }]
      )
      if (p7Result.error)
        throw new Error(`PKCS#7 wrap failed: ${p7Result.error}\n${p7Result.stderr}`)
      const p7File = p7Result.files.find((f) => f.name === p7Path.replace(/^\//, ''))
      if (!p7File) throw new Error('PKCS#7 wrap produced no output')
      setPkcs7Pem(new TextDecoder().decode(p7File.data))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-primary/30 bg-primary/5 p-3 flex items-start gap-3 text-sm">
        <Info size={16} className="mt-0.5 shrink-0 text-primary" />
        <div>
          <div className="font-medium text-foreground">RFC 7030 simpleenroll — simulated</div>
          <p className="mt-1 text-muted-foreground">
            OpenSSL ships a CMP client but not an EST client. This step exercises the two
            EST-specific pieces directly: (1) the <strong>PKCS#10 CSR</strong> the client POSTs to{' '}
            <code>/.well-known/est/simpleenroll</code>, and (2) the{' '}
            <strong>PKCS#7 SignedData</strong> envelope the server returns. The HTTP+TLS transport
            is described in the Learn tab.
          </p>
        </div>
      </div>

      {!eeKeyPem && (
        <div className="rounded border border-status-warning/30 bg-status-warning/10 p-3 text-sm text-status-warning flex items-start gap-2">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>Generate an end-entity key in Step 1 first.</span>
        </div>
      )}

      <div className="space-y-1">
        <label htmlFor="est-csr-subject" className="text-sm font-medium text-foreground">
          CSR Subject
        </label>
        <Input id="est-csr-subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
      </div>

      <Button
        variant="gradient"
        onClick={handleRun}
        disabled={busy || !eeKeyPem}
        className="flex items-center gap-2"
      >
        {busy ? <Loader2 className="animate-spin" size={16} /> : <Inbox size={16} />}
        {busy ? 'Building CSR + wrapping response…' : 'Run simpleenroll (CSR → PKCS#7)'}
      </Button>

      {error && (
        <div className="rounded border border-status-error/30 bg-status-error/10 p-3 text-sm text-status-error flex items-start gap-2">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <pre className="whitespace-pre-wrap font-mono text-xs">{error}</pre>
        </div>
      )}

      {csrPem && (
        <details open className="rounded border border-border bg-muted/30 p-3">
          <summary className="cursor-pointer text-sm font-medium text-foreground flex items-center gap-2">
            <CheckCircle2 size={14} className="text-status-success" /> POST body — base64(PKCS#10
            CSR), {eeKeyAlgorithm} signed
          </summary>
          <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-all font-mono text-[10px] text-muted-foreground">
            {csrPem}
          </pre>
        </details>
      )}

      {pkcs7Pem && (
        <details open className="rounded border border-border bg-muted/30 p-3">
          <summary className="cursor-pointer text-sm font-medium text-foreground flex items-center gap-2">
            <CheckCircle2 size={14} className="text-status-success" /> Response body — base64(PKCS#7
            SignedData) containing 1 cert
          </summary>
          <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-all font-mono text-[10px] text-muted-foreground">
            {pkcs7Pem}
          </pre>
        </details>
      )}
    </div>
  )
}
