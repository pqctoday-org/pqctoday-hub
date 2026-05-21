// SPDX-License-Identifier: GPL-3.0-only
import React, { useEffect, useRef, useState } from 'react'
import {
  Loader2,
  Send,
  CheckCircle2,
  AlertTriangle,
  Server,
  FileText,
  RefreshCw,
} from 'lucide-react'
import { openSSLService } from '@/services/crypto/OpenSSLService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CopyableOutput } from '@/components/ui/CopyableOutput'
import { ensureMockCA, resetMockCA } from '../mock-ca/mockCA'
import { CA_ROOT_CERT_PATH, CA_ROOT_KEY_PATH, EE_CERT_PATH, EE_KEY_PATH } from '../constants'

interface CmpInitialReqProps {
  /** Key PEM bytes produced by the KeyGen step. */
  eeKeyPem: Uint8Array | null
  /** Algorithm name (informational — shown in the transcript header). */
  eeKeyAlgorithm: string | null
  /** Called with the issued cert PEM bytes so downstream steps (Cert Viewer) can read it. */
  onCertIssued?: (certPem: Uint8Array) => void
}

type Phase = 'idle' | 'ca' | 'sending' | 'done' | 'error'

interface CmpResult {
  certPem: string
  certText: string
  transcript: { side: string; event: string; detail: string }[]
}

export const CmpInitialReq: React.FC<CmpInitialReqProps> = ({
  eeKeyPem,
  eeKeyAlgorithm,
  onCertIssued,
}) => {
  const [phase, setPhase] = useState<Phase>('idle')
  const [subject, setSubject] = useState<string>('/CN=Workshop EE/O=PQC Today/C=US')
  const [reference, setReference] = useState<string>('workshop-ee-001')
  const [secret, setSecret] = useState<string>('workshop-shared-secret')
  const [result, setResult] = useState<CmpResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [caReady, setCaReady] = useState(false)
  const initRef = useRef(false)

  // Auto-provision the mock CA on mount so the user has a one-click experience.
  useEffect(() => {
    if (initRef.current) return
    initRef.current = true
    setPhase('ca')
    ensureMockCA()
      .then(() => {
        setCaReady(true)
        setPhase('idle')
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : String(e))
        setPhase('error')
      })
  }, [])

  const handleSend = async () => {
    if (!eeKeyPem) {
      setError('Generate an end-entity key in Step 1 before running CMP IR.')
      setPhase('error')
      return
    }
    setError(null)
    setResult(null)
    setPhase('sending')
    try {
      const ca = await ensureMockCA()

      // Drive the real in-process CMP exchange:
      //   - real client: OSSL_CMP_CTX_new + OSSL_CMP_exec_IR_ses
      //   - real server: OSSL_CMP_SRV_CTX_new with our process_cert_request callback
      //     that parses the CRMF template, builds an X509, signs with the CA's
      //     ML-DSA-65 key, returns it inside a real PKIMessage IP.
      //   - transport: OSSL_CMP_CTX_set_transfer_cb, no sockets.
      // See src/wasm/cmp_simulation.c.
      const out = await openSSLService.simulateCmp({
        eeKeyPath: EE_KEY_PATH,
        subjectDn: subject,
        reference,
        secret,
        caCertPath: CA_ROOT_CERT_PATH,
        caKeyPath: CA_ROOT_KEY_PATH,
        outCertPath: EE_CERT_PATH,
        files: [
          { name: CA_ROOT_CERT_PATH.replace(/^\//, ''), data: ca.certPem },
          { name: CA_ROOT_KEY_PATH.replace(/^\//, ''), data: ca.keyPem },
          { name: EE_KEY_PATH.replace(/^\//, ''), data: eeKeyPem },
        ],
      })

      if (!out.ok || !out.certPem) {
        const transcriptStr = out.transcript
          .map((t) => `[${t.side}] ${t.event}: ${t.detail}`)
          .join('\n')
        throw new Error(
          `${out.error || 'CMP IR failed'}\n\nTranscript:\n${transcriptStr || '(empty)'}`
        )
      }

      // Decode the issued cert for display via `openssl x509 -text -noout`.
      const certFileName = EE_CERT_PATH.replace(/^\//, '')
      const decoded = await openSSLService.execute(
        `openssl x509 -in ${EE_CERT_PATH} -text -noout`,
        [{ name: certFileName, data: out.certPem }]
      )

      setResult({
        certPem: new TextDecoder().decode(out.certPem),
        certText: decoded.stdout || '(no decoded output)',
        transcript: out.transcript,
      })
      onCertIssued?.(out.certPem)
      setPhase('done')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setPhase('error')
    }
  }

  const handleResetCA = async () => {
    setPhase('ca')
    setError(null)
    setResult(null)
    try {
      await resetMockCA()
      setCaReady(true)
      setPhase('idle')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setPhase('error')
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-md border border-primary/30 bg-primary/5 p-3 flex items-start gap-3">
        <Server size={18} className="mt-0.5 shrink-0 text-primary" />
        <div className="text-sm">
          <div className="font-medium text-foreground">Real in-process CMP IR</div>
          <p className="mt-1 text-muted-foreground">
            Both ends of the CMP exchange run inside the OpenSSL 3.6 WASM build via the{' '}
            <code className="rounded bg-muted px-1 text-xs">execute_cmp_simulation</code> shim: real{' '}
            <code>OSSL_CMP_CTX</code> client + real <code>OSSL_CMP_SRV_CTX</code> server, connected
            by <code>OSSL_CMP_CTX_set_transfer_cb</code> (no sockets, no file dance). The server's{' '}
            <em>process_cert_request</em> callback parses the CRMF template, builds an X509, and
            signs it with the mock CA's ML-DSA-65 key — actual issuance, not a pre-canned echo. The
            mock CA root is generated once in your browser and cached in IndexedDB.
          </p>
          <div className="mt-2 flex items-center gap-3 text-xs">
            <span className={caReady ? 'text-status-success' : 'text-muted-foreground'}>
              {caReady ? '✓ Mock CA ready' : phase === 'ca' ? 'Provisioning CA…' : 'CA pending'}
            </span>
            <Button
              variant="ghost"
              onClick={handleResetCA}
              disabled={phase === 'ca' || phase === 'sending'}
              className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <RefreshCw size={12} /> Regenerate CA
            </Button>
          </div>
        </div>
      </div>

      {!eeKeyPem && (
        <div className="rounded border border-status-warning/30 bg-status-warning/10 p-3 text-sm text-status-warning flex items-start gap-2">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>
            Complete <strong>Step 1: Generate End-Entity Key</strong> first — CMP IR enrolls a key
            that must already exist.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label htmlFor="cmp-ir-subject" className="text-sm font-medium text-foreground">
            Subject DN
          </label>
          <Input
            id="cmp-ir-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="/CN=…"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="cmp-ir-reference" className="text-sm font-medium text-foreground">
            Reference (senderKID)
          </label>
          <Input
            id="cmp-ir-reference"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="ee-reference-id"
          />
        </div>
        <div className="space-y-1 md:col-span-2">
          <label htmlFor="cmp-ir-secret" className="text-sm font-medium text-foreground">
            Shared secret (PBM-MAC protection, RFC 4210 §5.1.3.1)
          </label>
          <Input
            id="cmp-ir-secret"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="workshop-shared-secret"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="gradient"
          onClick={handleSend}
          disabled={phase === 'sending' || phase === 'ca' || !eeKeyPem}
          className="flex items-center gap-2"
        >
          {phase === 'sending' ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Send size={16} />
          )}
          {phase === 'sending' ? 'Running CMP IR…' : 'Send CMP Initial Request'}
        </Button>
        {eeKeyAlgorithm && (
          <span className="text-xs text-muted-foreground">
            EE key algorithm: <code>{eeKeyAlgorithm}</code>
          </span>
        )}
      </div>

      {error && (
        <div className="rounded border border-status-error/30 bg-status-error/10 p-3 text-sm text-status-error flex items-start gap-2">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <pre className="whitespace-pre-wrap font-mono text-xs">{error}</pre>
        </div>
      )}

      {result && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-status-success text-sm">
            <CheckCircle2 size={16} />
            <span>
              <strong>Certificate issued</strong> by the in-process CMP server, chain-validated
              against the mock CA root.
            </span>
          </div>

          <details open className="rounded border border-border bg-muted/30 p-3">
            <summary className="cursor-pointer text-sm font-medium text-foreground flex items-center gap-2">
              <FileText size={14} /> Decoded certificate (openssl x509 -text)
            </summary>
            <div className="mt-2">
              <CopyableOutput value={result.certText} rows={8} className="text-[10px]" />
            </div>
          </details>

          <details open className="rounded border border-border bg-muted/30 p-3">
            <summary className="cursor-pointer text-sm font-medium text-foreground">
              CMP exchange transcript ({result.transcript.length} events)
            </summary>
            <ul className="mt-2 space-y-1 font-mono text-[11px]">
              {result.transcript.map((t, i) => (
                <li key={i} className="flex gap-2">
                  <span className={t.side === 'server' ? 'text-primary' : 'text-status-info'}>
                    [{t.side}]
                  </span>
                  <span className="text-foreground">{t.event}:</span>
                  <span className="text-muted-foreground">{t.detail}</span>
                </li>
              ))}
            </ul>
          </details>

          <details className="rounded border border-border bg-muted/30 p-3">
            <summary className="cursor-pointer text-sm font-medium text-foreground">
              Issued cert (PEM)
            </summary>
            <div className="mt-2">
              <CopyableOutput
                value={result.certPem}
                label="Issued Certificate PEM"
                rows={5}
                downloadFilename="issued-cert.pem"
                className="text-[10px]"
              />
            </div>
          </details>
        </div>
      )}
    </div>
  )
}
