// SPDX-License-Identifier: GPL-3.0-only
/**
 * DualSignDemo — Phase 4.B PQ + classical dual-signature.
 *
 * Pipeline:
 *   1. openssl genpkey -algorithm ML-DSA-65  -out alice-pq.key
 *   2. openssl genpkey -algorithm EC -pkeyopt ec_paramgen_curve:P-256 -out alice-cl.key
 *   3. openssl req -new -x509 -key alice-pq.key -out alice-pq.crt -subj /CN=Alice (PQ)
 *   4. openssl req -new -x509 -key alice-cl.key -out alice-cl.crt -subj /CN=Alice (Classical)
 *   5. openssl cms -sign -signer alice-pq.crt -inkey alice-pq.key \
 *                       -signer alice-cl.crt -inkey alice-cl.key \
 *                       -in payload -out signed.p7m -nodetach -outform DER -binary
 *   6. Verify pass A: -CAfile alice-pq.crt   → PQ SignerInfo OK?
 *      Verify pass B: -CAfile alice-cl.crt   → classical SignerInfo OK?
 *
 * NOTE: this is NOT LAMPS draft-19 composite (which uses a single
 * combined OID like id-MLDSA65-ECDSA-P256-SHA256). It's multi-SignerInfo
 * — two signatures, one .p7m, RFC 5652 standard. Educationally equivalent
 * for "two algorithms must verify" trust model, but a malicious party
 * could strip one SignerInfo. The WIP chip below points users at the
 * LAMPS roadmap entry for the strictly-stronger composite path.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CheckCircle2,
  AlertTriangle,
  PenLine,
  ShieldCheck,
  Key as KeyIcon,
  Combine,
  RefreshCw,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CMSSigningService, type CmsAlg } from '../services/CMSSigningService'
import { smimeEnvelopeSigned } from '../services/smimeMultipart'

type Stage =
  | 'idle'
  | 'pq-key'
  | 'cl-key'
  | 'pq-cert'
  | 'cl-cert'
  | 'sign'
  | 'verify'
  | 'done'
  | 'error'

interface StageResult {
  pqKeyPem?: string
  classicalKeyPem?: string
  pqCertPem?: string
  classicalCertPem?: string
  signedP7m?: Uint8Array
  ok?: boolean
  signerCount?: number
  stderr?: string
  payload?: Uint8Array
}

const DEFAULT_PAYLOAD =
  'Dual-signed workshop message: ML-DSA-65 + ECDSA-P256 SignerInfos.\n' +
  'A LAMPS-conformant verifier of draft-ietf-lamps-pq-composite-sigs would\n' +
  'reject the message if EITHER signature failed; this multi-SignerInfo\n' +
  'CMS accepts a partial match — see the WIP chip below.\n'

const PQ_ALG_CHOICES: CmsAlg[] = ['ML-DSA-65', 'ML-DSA-44', 'ML-DSA-87', 'SLH-DSA-SHA2-128s']
const CL_ALG_CHOICES: CmsAlg[] = ['EC', 'RSA-PSS']

const PQ_KEY = 'alice-pq'
const CL_KEY = 'alice-cl'
const PQ_CERT = 'alice-pq'
const CL_CERT = 'alice-cl'

interface DualSignDemoProps {
  providerReady: boolean
}

export function DualSignDemo({ providerReady }: DualSignDemoProps) {
  const serviceRef = useRef<CMSSigningService | null>(null)
  const [pqAlg, setPqAlg] = useState<CmsAlg>('ML-DSA-65')
  const [clAlg, setClAlg] = useState<CmsAlg>('EC')
  const [payload, setPayload] = useState<string>(DEFAULT_PAYLOAD)
  const [useHsmIntent, setUseHsmIntent] = useState<boolean>(true)
  const useHsm = providerReady && useHsmIntent
  const [stage, setStage] = useState<Stage>('idle')
  const [error, setError] = useState<string>('')
  const [result, setResult] = useState<StageResult>({})

  useEffect(() => {
    const svc = new CMSSigningService()
    serviceRef.current = svc
    return () => {
      svc.dispose()
      serviceRef.current = null
    }
  }, [])

  const reset = () => {
    setStage('idle')
    setError('')
    setResult({})
  }

  const run = async () => {
    const svc = serviceRef.current
    if (!svc) return
    setError('')
    setResult({})
    try {
      setStage('pq-key')
      const pq = await svc.genKey(pqAlg, PQ_KEY, useHsm)
      setResult((prev) => ({ ...prev, pqKeyPem: pq.keyPem }))

      setStage('cl-key')
      const cl = await svc.genKey(clAlg, CL_KEY, useHsm)
      setResult((prev) => ({ ...prev, classicalKeyPem: cl.keyPem }))

      setStage('pq-cert')
      const pqCert = await svc.mkCert({
        keyId: PQ_KEY,
        certId: PQ_CERT,
        subject: '/CN=Alice (PQ)/O=PQC Workshop/C=US',
        days: 365,
        useHsm,
      })
      setResult((prev) => ({ ...prev, pqCertPem: pqCert.certPem }))

      setStage('cl-cert')
      const clCert = await svc.mkCert({
        keyId: CL_KEY,
        certId: CL_CERT,
        subject: '/CN=Alice (Classical)/O=PQC Workshop/C=US',
        days: 365,
        useHsm,
      })
      setResult((prev) => ({ ...prev, classicalCertPem: clCert.certPem }))

      setStage('sign')
      const s = await svc.dualSign({
        payload: new TextEncoder().encode(payload),
        pqKeyId: PQ_KEY,
        pqCertId: PQ_CERT,
        classicalKeyId: CL_KEY,
        classicalCertId: CL_CERT,
        useHsm,
      })
      setResult((prev) => ({ ...prev, signedP7m: s.signedP7m }))

      setStage('verify')
      const v = await svc.dualVerify({
        signedP7m: s.signedP7m,
        pqCertId: PQ_CERT,
        classicalCertId: CL_CERT,
        useHsm,
      })
      setResult((prev) => ({
        ...prev,
        ok: v.ok,
        signerCount: v.signerCount,
        stderr: v.stderr,
        payload: v.payload,
      }))

      setStage('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setStage('error')
    }
  }

  const recoveredText = useMemo(() => {
    if (!result.payload) return ''
    try {
      return new TextDecoder().decode(result.payload)
    } catch {
      return '<binary>'
    }
  }, [result.payload])

  const busy = stage !== 'idle' && stage !== 'done' && stage !== 'error'

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Combine size={18} className="text-primary" />
          PQ + classical dual signature (multi-SignerInfo)
          <span
            className="ml-2 rounded border border-status-warning/30 bg-status-warning/10 px-1.5 py-0.5 text-[10px] font-medium text-status-warning"
            title="Multi-SignerInfo (RFC 5652) is NOT LAMPS draft-19 composite. A malicious party can strip one SignerInfo. LAMPS composite-sigs (single combined OID) requires both to verify atomically."
          >
            WIP · not LAMPS composite
          </span>
        </h3>
        <p className="text-sm text-muted-foreground">
          Produces ONE CMS SignedData carrying TWO <code>SignerInfo</code> entries — one signed by
          an ML-DSA key, one by ECDSA / RSA-PSS. Verifier runs twice with each cert as the trust
          anchor to report per-signer outcome.{' '}
          <a
            href="https://datatracker.ietf.org/doc/draft-ietf-lamps-pq-composite-sigs/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 text-primary hover:underline"
          >
            LAMPS composite <ExternalLink size={10} />
          </a>{' '}
          is the strictly-stronger Phase 5 path once pkcs11-provider's composite dispatch is
          verified for the target OID pair.
        </p>
      </header>

      <div className="glass-panel space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-medium text-muted-foreground">
            PQ alg
            <select
              value={pqAlg}
              onChange={(e) => setPqAlg(e.target.value as CmsAlg)}
              disabled={busy}
              className="ml-2 rounded border border-input bg-background px-2 py-1 text-xs"
            >
              {PQ_ALG_CHOICES.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-muted-foreground">
            Classical alg
            <select
              value={clAlg}
              onChange={(e) => setClAlg(e.target.value as CmsAlg)}
              disabled={busy}
              className="ml-2 rounded border border-input bg-background px-2 py-1 text-xs"
            >
              {CL_ALG_CHOICES.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>
          <label
            className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium transition-colors ${
              providerReady
                ? useHsm
                  ? 'border-status-success/40 bg-status-success/10 text-status-success cursor-pointer'
                  : 'border-border bg-card cursor-pointer hover:bg-muted/40'
                : 'border-border bg-muted/30 text-muted-foreground cursor-not-allowed opacity-60'
            }`}
            title={
              providerReady
                ? 'Both PQ + classical keys resident in softhsmv3; signing routed via pkcs11-provider'
                : 'Rebuild openssl.wasm (npm run build:openssl-wasm) so pqctoday_cms_init lands'
            }
          >
            <input
              type="checkbox"
              checked={useHsm}
              disabled={!providerReady || busy}
              onChange={(e) => setUseHsmIntent(e.target.checked)}
              className="h-3 w-3"
            />
            <ShieldCheck size={12} />
            Use HSM keys
          </label>
          <Button onClick={run} disabled={busy} variant="gradient" size="sm" className="gap-1.5">
            {busy ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                Running {stage}…
              </>
            ) : (
              <>
                <Combine size={14} />
                Dual-sign + Verify
              </>
            )}
          </Button>
          {(stage === 'done' || stage === 'error') && (
            <Button onClick={reset} variant="ghost" size="sm">
              Clear
            </Button>
          )}
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">Payload</span>
          <textarea
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            disabled={busy}
            rows={4}
            className="rounded border border-input bg-background p-2 font-mono text-xs"
          />
        </label>

        {error && (
          <div className="flex items-start gap-2 rounded-md border border-status-error/30 bg-status-error/10 p-3 text-xs text-status-error">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            <pre className="flex-1 whitespace-pre-wrap font-mono">{error}</pre>
          </div>
        )}
      </div>

      {(stage !== 'idle' || result.pqKeyPem) && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <StageCard
            icon={<KeyIcon size={14} />}
            title="PQ key pair (Alice)"
            done={Boolean(result.pqKeyPem)}
            running={stage === 'pq-key'}
          >
            {result.pqKeyPem ? <KVRow label="Algorithm" value={pqAlg} /> : null}
            {result.pqKeyPem ? (
              <KVRow label="Mode" value={useHsm ? 'HSM (pkcs11:)' : 'Software (PEM)'} />
            ) : null}
          </StageCard>

          <StageCard
            icon={<KeyIcon size={14} />}
            title="Classical key pair (Alice)"
            done={Boolean(result.classicalKeyPem)}
            running={stage === 'cl-key'}
          >
            {result.classicalKeyPem ? <KVRow label="Algorithm" value={clAlg} /> : null}
            {result.classicalKeyPem ? (
              <KVRow label="Mode" value={useHsm ? 'HSM (pkcs11:)' : 'Software (PEM)'} />
            ) : null}
          </StageCard>

          <StageCard
            icon={<ShieldCheck size={14} />}
            title="PQ self-signed cert"
            done={Boolean(result.pqCertPem)}
            running={stage === 'pq-cert'}
          >
            {result.pqCertPem ? <KVRow label="Subject" value="/CN=Alice (PQ)" /> : null}
            {result.pqCertPem ? (
              <KVRow label="Size" value={`${result.pqCertPem.length} chars (PEM)`} />
            ) : null}
          </StageCard>

          <StageCard
            icon={<ShieldCheck size={14} />}
            title="Classical self-signed cert"
            done={Boolean(result.classicalCertPem)}
            running={stage === 'cl-cert'}
          >
            {result.classicalCertPem ? (
              <KVRow label="Subject" value="/CN=Alice (Classical)" />
            ) : null}
            {result.classicalCertPem ? (
              <KVRow label="Size" value={`${result.classicalCertPem.length} chars (PEM)`} />
            ) : null}
          </StageCard>

          <StageCard
            icon={<PenLine size={14} />}
            title="Dual-signed CMS (.p7m, 2 SignerInfos)"
            done={Boolean(result.signedP7m)}
            running={stage === 'sign'}
          >
            {result.signedP7m ? <KVRow label="Encoding" value="DER (binary)" /> : null}
            {result.signedP7m ? (
              <KVRow label="Size" value={`${result.signedP7m.length} bytes`} />
            ) : null}
            {result.signedP7m ? <KVRow label="SignerInfos" value={`${pqAlg} + ${clAlg}`} /> : null}
            {result.signedP7m && (
              <details className="mt-2">
                <summary className="cursor-pointer text-[11px] text-primary">
                  Show S/MIME envelope (.eml)
                </summary>
                <pre className="mt-1 max-h-48 max-w-full overflow-auto whitespace-pre-wrap break-all rounded bg-muted/30 p-1.5 font-mono text-[10px] leading-tight">
                  {smimeEnvelopeSigned(result.signedP7m, {
                    subject: 'PQC workshop dual-signed message',
                  })}
                </pre>
              </details>
            )}
          </StageCard>

          <StageCard
            icon={<CheckCircle2 size={14} />}
            title="Verify (all SignerInfos together)"
            done={stage === 'done'}
            running={stage === 'verify'}
          >
            {result.ok === true && (
              <>
                <div className="flex items-center gap-1.5 text-xs text-status-success">
                  <CheckCircle2 size={14} />
                  <span>
                    {result.signerCount ?? 2} SignerInfo
                    {(result.signerCount ?? 2) === 1 ? '' : 's'} verified — {pqAlg} + {clAlg}
                  </span>
                </div>
                <p className="text-[11px] italic text-muted-foreground">
                  <code>cms -verify -noverify</code> walked every SignerInfo and checked each
                  signature against its embedded signer cert. Chain validation skipped (these certs
                  are self-signed for the demo). Per-SignerInfo atomicity is a LAMPS composite
                  property — see the WIP chip above.
                </p>
              </>
            )}
            {result.ok === false && (
              <>
                <div className="flex items-center gap-1.5 text-xs text-status-error">
                  <AlertTriangle size={14} />
                  <span>Verification failed — at least one SignerInfo signature is invalid</span>
                </div>
                {result.stderr && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-[11px] text-primary">
                      Show verify stderr
                    </summary>
                    <pre className="mt-1 max-h-32 max-w-full overflow-auto whitespace-pre-wrap break-words rounded bg-muted/30 p-1.5 font-mono text-[10px] leading-tight">
                      {result.stderr}
                    </pre>
                  </details>
                )}
              </>
            )}
            {result.payload && recoveredText && result.ok && (
              <details className="mt-2">
                <summary className="cursor-pointer text-[11px] text-primary">
                  Show recovered payload
                </summary>
                <pre className="mt-1 max-h-40 max-w-full overflow-auto whitespace-pre-wrap break-words rounded bg-muted/30 p-1.5 font-mono text-[10px] leading-tight">
                  {recoveredText}
                </pre>
              </details>
            )}
          </StageCard>
        </div>
      )}
    </div>
  )
}

function StageCard({
  icon,
  title,
  done,
  running,
  children,
}: {
  icon: React.ReactNode
  title: string
  done: boolean
  running: boolean
  children: React.ReactNode
}) {
  const tone = done
    ? 'border-status-success/30 bg-status-success/5'
    : running
      ? 'border-primary/40 bg-primary/5'
      : 'border-border bg-card/50'
  const statusIcon = done ? (
    <CheckCircle2 size={12} className="text-status-success" />
  ) : running ? (
    <RefreshCw size={12} className="animate-spin text-primary" />
  ) : null
  return (
    <div className={`space-y-1.5 rounded-md border p-3 ${tone}`}>
      <div className="flex items-center justify-between text-xs font-semibold text-foreground">
        <span className="flex items-center gap-1.5">
          {icon}
          {title}
        </span>
        {statusIcon}
      </div>
      <div className="space-y-1 text-[11px] text-muted-foreground">{children}</div>
    </div>
  )
}

function KVRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-foreground">{value}</span>
    </div>
  )
}
