// SPDX-License-Identifier: AGPL-3.0-only
import React, { useEffect, useRef, useState } from 'react'
import { GateReason } from '@/components/shared/GateReason'
import { Loader2, Inbox, AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import { openSSLService } from '@/services/crypto/OpenSSLService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ErrorAlert } from '@/components/ui/error-alert'
import {
  WorkshopOperationLog,
  type LogEntry,
} from '@/components/PKILearning/common/WorkshopOperationLog'
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
 * build and verify the CSR with OpenSSL, issue through the local CMP-backed
 * fixture, and wrap the resulting certificate with `openssl crl2pkcs7`.
 * This models the simpleenroll artifacts without HTTPS or EST authorization.
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
  const [logEntries, setLogEntries] = useState<LogEntry[]>([])
  const runRevision = useRef(0)

  useEffect(() => {
    setBusy(false)
    setCsrPem(null)
    setPkcs7Pem(null)
    setError(null)
    setLogEntries([])
    return () => {
      runRevision.current += 1
    }
  }, [eeKeyPem])

  const handleRun = async () => {
    if (!eeKeyPem) {
      setError('Generate an end-entity key in Step 1 first.')
      return
    }
    if (busy) return
    const revision = ++runRevision.current
    setError(null)
    setCsrPem(null)
    setPkcs7Pem(null)
    setLogEntries([])
    if (eeKeyAlgorithm?.startsWith('ML-KEM-')) {
      setError(
        'This simpleenroll sample requires a signed PKCS#10 request. ML-KEM cannot sign the request. No certificate was issued. Use Step 4 to exercise ML-KEM proof of possession.'
      )
      return
    }
    if (!subject.startsWith('/') || /["\r\n]/.test(subject)) {
      setError('Enter a slash-form subject such as /CN=Fictional Workshop Device.')
      return
    }
    setBusy(true)
    const startedAt = performance.now()
    setLogEntries([
      { status: 'pending', message: 'Building PKCS#10 CSR + simulating EST simpleenroll…' },
    ])
    try {
      const keyFileName = EE_KEY_PATH.replace(/^\//, '')

      const csrPath = '/est-request.csr.pem'
      const csrName = csrPath.slice(1)
      const csrResult = await openSSLService.execute(
        `openssl req -new -key ${EE_KEY_PATH} -out ${csrPath} -subj "${subject}"`,
        [{ name: keyFileName, data: eeKeyPem }]
      )
      const csrFile = csrResult.files.find((file) => file.name === csrName)
      if (csrResult.error || !csrFile?.data.length) {
        throw new Error(
          'OpenSSL did not produce a signed PKCS#10 request. No certificate was issued.'
        )
      }
      const verification = await openSSLService.execute(
        `openssl req -verify -pubkey -noout -in ${csrPath}`,
        [csrFile]
      )
      const verified =
        !verification.error &&
        `${verification.stdout}\n${verification.stderr}`
          .split(/\r?\n/)
          .some((line) => /^Certificate request self-signature verify OK$/i.test(line.trim()))
      const csrPublicKey = verification.stdout.match(
        /-----BEGIN PUBLIC KEY-----[\s\S]+?-----END PUBLIC KEY-----/
      )?.[0]
      if (!verified || !csrPublicKey) {
        throw new Error('The request signature could not be verified. No certificate was issued.')
      }
      if (runRevision.current !== revision) return
      setCsrPem(new TextDecoder().decode(csrFile.data))

      // The fixture uses CMP for local issuance after verifying the EST request artifact.
      const ca = await ensureMockCA()
      if (runRevision.current !== revision) return
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
      const certificate = { name: EE_CERT_PATH.slice(1), data: enrollResult.certPem }
      const issuedPublicKey = await openSSLService.execute(
        `openssl x509 -in ${EE_CERT_PATH} -pubkey -noout`,
        [certificate]
      )
      if (issuedPublicKey.error || issuedPublicKey.stdout.trim() !== csrPublicKey.trim()) {
        throw new Error('The issued sample certificate did not match the verified request key.')
      }
      if (runRevision.current !== revision) return

      // 3. Wrap the issued cert in a PKCS#7 (degenerate SignedData) — the EST
      //    response envelope (RFC 7030 §4.2.3). This is the actual wire shape
      //    an EST server returns.
      const p7Path = '/est-response.p7b'
      const p7Result = await openSSLService.execute(
        `openssl crl2pkcs7 -nocrl -certfile ${EE_CERT_PATH} -out ${p7Path}`,
        [certificate]
      )
      if (p7Result.error)
        throw new Error(`PKCS#7 wrap failed: ${p7Result.error}\n${p7Result.stderr}`)
      const p7File = p7Result.files.find((f) => f.name === p7Path.replace(/^\//, ''))
      if (!p7File) throw new Error('PKCS#7 wrap produced no output')
      if (runRevision.current !== revision) return
      setPkcs7Pem(new TextDecoder().decode(p7File.data))
      onCertIssued?.(enrollResult.certPem)
      setLogEntries([
        {
          status: 'success',
          message:
            'Verified CSR and issued certificate contain the same public key. PKCS#7 response ready.',
          durationMs: Math.round(performance.now() - startedAt),
        },
      ])
    } catch (e) {
      if (runRevision.current !== revision) return
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg)
      setLogEntries([
        {
          status: 'error',
          message: `simpleenroll failed — ${msg}`,
          durationMs: Math.round(performance.now() - startedAt),
        },
      ])
    } finally {
      if (runRevision.current === revision) setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-primary/30 bg-primary/5 p-3 flex items-start gap-3 text-sm">
        <Info size={16} className="mt-0.5 shrink-0 text-primary" />
        <div>
          <div className="font-medium text-foreground">RFC 7030 simpleenroll — simulated</div>
          <p className="mt-1 text-muted-foreground">
            The browser verifies the <strong>PKCS#10 request signature</strong> before issuing a
            sample certificate through its local CA. It checks that the certificate contains the
            requested key, then builds the <strong>PKCS#7 response</strong>. This exercises the
            artifacts for <code>/.well-known/est/simpleenroll</code>. Real EST uses HTTPS and
            separate client authentication and authorization.
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
        <Input
          id="est-csr-subject"
          value={subject}
          disabled={busy}
          onChange={(e) => {
            setSubject(e.target.value)
            setCsrPem(null)
            setPkcs7Pem(null)
            setError(null)
            setLogEntries([])
          }}
        />
      </div>

      <GateReason when={!busy && !eeKeyPem} className="mt-0">
        Generate the end-entity key in Step 1 first; simpleenroll builds the CSR from it.
      </GateReason>
      <Button
        variant="gradient"
        onClick={handleRun}
        disabled={busy || !eeKeyPem}
        className="flex items-center gap-2"
      >
        {busy ? <Loader2 className="animate-spin" size={16} /> : <Inbox size={16} />}
        {busy ? 'Building CSR + wrapping response…' : 'Run simpleenroll (CSR → PKCS#7)'}
      </Button>

      {logEntries.length > 0 && <WorkshopOperationLog entries={logEntries} />}

      {error && (
        <div role="alert">
          <ErrorAlert message={error} onRetry={handleRun} />
        </div>
      )}

      {csrPem && (
        <details open className="rounded border border-border bg-muted/30 p-3">
          <summary className="cursor-pointer text-sm font-medium text-foreground flex items-center gap-2">
            <CheckCircle2 size={14} className="text-status-success" /> Request PEM — verified
            PKCS#10 self-signature ({eeKeyAlgorithm})
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
