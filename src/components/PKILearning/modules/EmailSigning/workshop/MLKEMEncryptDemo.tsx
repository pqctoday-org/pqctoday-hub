// SPDX-License-Identifier: GPL-3.0-only
/**
 * MLKEMEncryptDemo — Phase 4 end-to-end CMS encrypt + decrypt using
 * ML-KEM-768 (or RSA / X25519 fallback) recipients.
 *
 * Pipeline (all four commands run inside the OpenSSL WASM worker, no
 * network, no external tools):
 *   1. openssl genpkey -algorithm ML-KEM-768 -out bob.key
 *   2. openssl req -new -x509 -key bob.key -out bob.crt -subj /CN=Bob
 *   3. openssl cms -encrypt -aes-256-gcm -in payload bob.crt -out enveloped.p7m
 *   4. openssl cms -decrypt -recip bob.crt -inkey bob.key -in enveloped.p7m
 *
 * The encrypt step produces CMS AuthEnvelopedData. With an ML-KEM
 * recipient cert, OpenSSL 3.5+ emits KEMRecipientInfo (RFC 9629) with
 * an HKDF-SHA256-derived content-encryption key per the RFC 9936
 * ML-KEM-in-CMS profile.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  ShieldCheck,
  Key as KeyIcon,
  Mail,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ErrorAlert } from '@/components/ui/error-alert'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import {
  WorkshopOperationLog,
  type LogEntry,
} from '@/components/PKILearning/common/WorkshopOperationLog'
import {
  CMSSigningService,
  isKemOnlyAlg,
  type CmsAlg,
  type CmsCipher,
} from '../services/CMSSigningService'
import { smimeEnvelopeEncrypted } from '../services/smimeMultipart'

type Stage =
  | 'idle'
  | 'ca-key'
  | 'ca-cert'
  | 'genkey'
  | 'mkcert'
  | 'encrypt'
  | 'decrypt'
  | 'done'
  | 'error'

interface StageResult {
  caKeyPem?: string
  caCertPem?: string
  keyPem?: string
  certPem?: string
  enveloped?: Uint8Array
  decryptOk?: boolean
  decryptPayload?: Uint8Array
  decryptStderr?: string
}

const DEFAULT_PAYLOAD =
  'Confidential workshop message — encrypted in-browser with ML-KEM-768.\n' +
  'CMS AuthEnvelopedData wraps an AES-256-GCM content-encryption key\n' +
  'derived from the ML-KEM shared secret via HKDF-SHA256 (RFC 9629).\n'

const KEM_ALG_CHOICES: CmsAlg[] = ['ML-KEM-768', 'ML-KEM-512', 'ML-KEM-1024', 'RSA', 'X25519']
const CIPHER_CHOICES: CmsCipher[] = [
  'aes-256-gcm',
  'aes-128-gcm',
  'aes-256-cbc',
  'chacha20-poly1305',
]

const KEY_ID = 'bob'
const CERT_ID = 'bob'
const CA_KEY_ID = 'bob-ca'
const CA_CERT_ID = 'bob-ca'
// The CA used to issue Bob's KEM cert. ML-DSA-65 is the educational
// default — pure PQ signature anchoring a pure PQ KEM cert.
const CA_ALG: CmsAlg = 'ML-DSA-65'

interface MLKEMEncryptDemoProps {
  /** True when pqctoday_cms_init has completed successfully; gates HSM toggle. */
  providerReady: boolean
}

export function MLKEMEncryptDemo({ providerReady }: MLKEMEncryptDemoProps) {
  const serviceRef = useRef<CMSSigningService | null>(null)
  const [alg, setAlg] = useState<CmsAlg>('ML-KEM-768')
  const [cipher, setCipher] = useState<CmsCipher>('aes-256-gcm')
  const [payload, setPayload] = useState<string>(DEFAULT_PAYLOAD)
  const [useHsmIntent, setUseHsmIntent] = useState<boolean>(true)
  const useHsm = providerReady && useHsmIntent
  const [stage, setStage] = useState<Stage>('idle')
  const [error, setError] = useState<string>('')
  const [result, setResult] = useState<StageResult>({})
  const [logEntries, setLogEntries] = useState<LogEntry[]>([])

  const beginOp = (message: string) => {
    const startedAt = performance.now()
    setLogEntries((prev) => [...prev, { status: 'pending', message }])
    return {
      done: (label?: string) =>
        setLogEntries((prev) => {
          const next = [...prev]
          const idx = next.length - 1
          next[idx] = {
            status: 'success',
            message: label ?? message,
            durationMs: Math.round(performance.now() - startedAt),
          }
          return next
        }),
      fail: (err: unknown) =>
        setLogEntries((prev) => {
          const next = [...prev]
          const idx = next.length - 1
          next[idx] = {
            status: 'error',
            message: `${message} — ${err instanceof Error ? err.message : String(err)}`,
            durationMs: Math.round(performance.now() - startedAt),
          }
          return next
        }),
    }
  }

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
    setLogEntries([])
  }

  const needsCa = isKemOnlyAlg(alg)

  const run = async () => {
    const svc = serviceRef.current
    if (!svc) return
    setError('')
    setResult({})
    setLogEntries([])
    let op = beginOp('Starting…')
    try {
      // KEM-only keys (ML-KEM-*, X25519) can't self-sign a cert, so we
      // mint an ML-DSA-65 CA first and issue Bob's KEM cert against it.
      // RSA can self-sign (it has both PSS sign and OAEP encrypt) — skip
      // the CA dance in that case.
      if (needsCa) {
        op = beginOp(`Generating CA key (${CA_ALG})…`)
        setStage('ca-key')
        const caK = await svc.genKey(CA_ALG, CA_KEY_ID, useHsm)
        setResult((prev) => ({ ...prev, caKeyPem: caK.keyPem }))
        op.done()

        op = beginOp('Issuing CA certificate…')
        setStage('ca-cert')
        const caC = await svc.mkCert({
          keyId: CA_KEY_ID,
          certId: CA_CERT_ID,
          subject: '/CN=PQC Workshop CA/O=PQC Workshop/C=US',
          days: 730,
          useHsm,
        })
        setResult((prev) => ({ ...prev, caCertPem: caC.certPem }))
        op.done()
      } else {
        op.done('Skipped CA — alg self-signs')
      }

      op = beginOp(`Generating recipient key (${alg})…`)
      setStage('genkey')
      const k = await svc.genKey(alg, KEY_ID, useHsm)
      setResult((prev) => ({ ...prev, keyPem: k.keyPem }))
      op.done()

      op = beginOp(needsCa ? 'Issuing CA-signed recipient cert…' : 'Issuing self-signed cert…')
      setStage('mkcert')
      const c = await svc.mkCert({
        keyId: KEY_ID,
        certId: CERT_ID,
        subject: '/CN=Bob/O=PQC Workshop/C=US',
        days: 365,
        useHsm,
        // Bob's KEM cert is issued by the CA when the alg can't self-sign;
        // RSA falls back to self-signed.
        issuerKeyId: needsCa ? CA_KEY_ID : undefined,
      })
      setResult((prev) => ({ ...prev, certPem: c.certPem }))
      op.done()

      op = beginOp(`Encrypting payload (${payload.length} bytes) with ${cipher}…`)
      setStage('encrypt')
      const e = await svc.encrypt({
        recipientCertId: CERT_ID,
        payload: new TextEncoder().encode(payload),
        cipher,
      })
      setResult((prev) => ({ ...prev, enveloped: e.enveloped }))
      op.done(`Enveloped — ${e.enveloped.length} bytes (.p7m)`)

      op = beginOp('Decrypting via recipient key…')
      setStage('decrypt')
      const d = await svc.decrypt({
        enveloped: e.enveloped,
        recipientCertId: CERT_ID,
        recipientKeyId: KEY_ID,
        useHsm,
      })
      setResult((prev) => ({
        ...prev,
        decryptOk: d.ok,
        decryptPayload: d.payload,
        decryptStderr: d.stderrTail,
      }))
      op.done(d.ok ? 'Decrypt OK' : 'Decrypt completed (see result)')

      setStage('done')
    } catch (err) {
      op.fail(err)
      setError(err instanceof Error ? err.message : String(err))
      setStage('error')
    }
  }

  const decryptedText = useMemo(() => {
    if (!result.decryptPayload) return ''
    try {
      return new TextDecoder().decode(result.decryptPayload)
    } catch {
      return '<binary>'
    }
  }, [result.decryptPayload])

  const sizes = {
    keyBytes: result.keyPem?.length ?? 0,
    certBytes: result.certPem?.length ?? 0,
    envBytes: result.enveloped?.length ?? 0,
  }

  const busy = stage !== 'idle' && stage !== 'done' && stage !== 'error'

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Lock size={18} className="text-primary" />
          ML-KEM CMS encrypt + decrypt (end-to-end)
        </h3>
        <p className="text-sm text-muted-foreground">
          Runs the full <code className="rounded bg-muted px-1 py-0.5 text-xs">genpkey</code> →{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">req -x509</code> →{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">cms -encrypt</code> →{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">cms -decrypt</code> pipeline. With
          an ML-KEM recipient cert, OpenSSL emits CMS <strong>AuthEnvelopedData</strong> with
          KEMRecipientInfo per RFC 9629 + RFC 9936.
        </p>
      </header>

      <div className="glass-panel space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">KEM algorithm</span>
            <div className={busy ? 'pointer-events-none opacity-50' : ''}>
              <FilterDropdown
                items={KEM_ALG_CHOICES}
                selectedId={alg}
                onSelect={(id) => setAlg(id as CmsAlg)}
                size="sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">CEK cipher</span>
            <div className={busy ? 'pointer-events-none opacity-50' : ''}>
              <FilterDropdown
                items={CIPHER_CHOICES}
                selectedId={cipher}
                onSelect={(id) => setCipher(id as CmsCipher)}
                size="sm"
              />
            </div>
          </div>
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
                ? 'Recipient key stays inside softhsmv3; decapsulate routed via pkcs11-provider'
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
            <Lock size={12} />
            Use HSM key
          </label>
          <Button onClick={run} disabled={busy} variant="gradient" size="sm" className="gap-1.5">
            {busy ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                Running {stage}…
              </>
            ) : (
              <>
                <Lock size={14} />
                Encrypt + Decrypt
              </>
            )}
          </Button>
          {(stage === 'done' || stage === 'error') && (
            <Button onClick={reset} variant="ghost" size="sm">
              Clear
            </Button>
          )}
        </div>

        <label htmlFor="mlkem-encrypt-payload" className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">Payload</span>
          <Textarea
            id="mlkem-encrypt-payload"
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            disabled={busy}
            rows={4}
            className="font-mono text-xs"
          />
        </label>

        {logEntries.length > 0 && <WorkshopOperationLog entries={logEntries} />}

        {error && <ErrorAlert message={error} onRetry={run} />}
      </div>

      {(stage !== 'idle' || result.keyPem || result.caKeyPem) && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {needsCa && (
            <>
              <StageCard
                icon={<KeyIcon size={14} />}
                title="Issuer CA key (ML-DSA-65)"
                done={Boolean(result.caKeyPem)}
                running={stage === 'ca-key'}
              >
                <p className="text-[11px] italic">
                  {alg} can't self-sign — a PQ signing CA issues Bob's cert (RFC 9935 path).
                </p>
              </StageCard>
              <StageCard
                icon={<ShieldCheck size={14} />}
                title="Issuer CA cert (self-signed)"
                done={Boolean(result.caCertPem)}
                running={stage === 'ca-cert'}
              >
                {result.caCertPem ? <KVRow label="Subject" value="/CN=PQC Workshop CA" /> : null}
                {result.caCertPem ? <KVRow label="Validity" value="730 days" /> : null}
              </StageCard>
            </>
          )}
          <StageCard
            icon={<KeyIcon size={14} />}
            title="Recipient key pair"
            done={Boolean(result.keyPem)}
            running={stage === 'genkey'}
          >
            {result.keyPem ? <KVRow label="Algorithm" value={alg} /> : null}
            {result.keyPem ? (
              <KVRow label="Mode" value={useHsm ? 'HSM (pkcs11:)' : 'Software (PEM)'} />
            ) : null}
            {result.keyPem ? (
              <KVRow
                label="Private key"
                value={useHsm ? 'resident in softhsmv3' : `${sizes.keyBytes} chars (PEM)`}
              />
            ) : null}
          </StageCard>

          <StageCard
            icon={<ShieldCheck size={14} />}
            title={needsCa ? "Bob's KEM cert (CA-issued)" : "Bob's self-signed cert"}
            done={Boolean(result.certPem)}
            running={stage === 'mkcert'}
          >
            {result.certPem ? <KVRow label="Subject" value="/CN=Bob/O=PQC Workshop/C=US" /> : null}
            {result.certPem ? (
              <KVRow label="Issuer" value={needsCa ? '/CN=PQC Workshop CA' : 'self'} />
            ) : null}
            {result.certPem ? <KVRow label="Validity" value="365 days" /> : null}
            {result.certPem ? (
              <KVRow label="Size" value={`${sizes.certBytes} chars (PEM)`} />
            ) : null}
          </StageCard>

          <StageCard
            icon={<Lock size={14} />}
            title="CMS AuthEnvelopedData (.p7m)"
            done={Boolean(result.enveloped)}
            running={stage === 'encrypt'}
          >
            {result.enveloped ? <KVRow label="Recipient" value={alg} /> : null}
            {result.enveloped ? <KVRow label="CEK cipher" value={cipher} /> : null}
            {result.enveloped ? <KVRow label="Size" value={`${sizes.envBytes} bytes`} /> : null}
            {result.enveloped && (
              <details className="mt-2">
                <summary className="cursor-pointer text-[11px] text-primary">
                  Show S/MIME envelope (.eml)
                </summary>
                <pre className="mt-1 max-h-48 max-w-full overflow-auto whitespace-pre-wrap break-all rounded bg-muted/30 p-1.5 font-mono text-[10px] leading-tight">
                  {smimeEnvelopeEncrypted(result.enveloped, {
                    subject: 'PQC workshop encrypted message',
                  })}
                </pre>
              </details>
            )}
          </StageCard>

          <StageCard
            icon={<Unlock size={14} />}
            title="Decrypt"
            done={stage === 'done'}
            running={stage === 'decrypt'}
          >
            {result.decryptOk === true && (
              <>
                <div className="flex items-center gap-1.5 text-xs text-status-success">
                  <CheckCircle2 size={14} />
                  Plaintext recovered via {useHsm ? 'HSM' : 'software'} key
                </div>
                <KVRow
                  label="Payload"
                  value={`${result.decryptPayload?.length ?? 0} bytes recovered`}
                />
                {decryptedText && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-[11px] text-primary">
                      Show recovered plaintext
                    </summary>
                    <pre className="mt-1 max-h-40 max-w-full overflow-auto whitespace-pre-wrap break-words rounded bg-muted/30 p-1.5 font-mono text-[10px] leading-tight">
                      {decryptedText}
                    </pre>
                  </details>
                )}
              </>
            )}
            {result.decryptOk === false && (
              <>
                <div className="flex items-center gap-1.5 text-xs text-status-error">
                  <AlertTriangle size={14} />
                  Decryption failed
                </div>
                {result.decryptStderr && (
                  <pre className="mt-1 max-h-32 max-w-full overflow-auto whitespace-pre-wrap break-words rounded bg-muted/30 p-1.5 font-mono text-[10px] leading-tight">
                    {result.decryptStderr}
                  </pre>
                )}
              </>
            )}
            {result.decryptOk === undefined && stage !== 'decrypt' && (
              <div className="text-xs text-muted-foreground">Pending — encrypt first.</div>
            )}
          </StageCard>
        </div>
      )}

      <p className="text-[11px] text-muted-foreground">
        <Mail size={11} className="mr-1 inline" />
        The S/MIME envelope shown is the same shape an actual mail client (Thunderbird, Apple Mail)
        would attach. PQ-aware mail clients haven't shipped ML-KEM yet, so the artifact is
        inspection-only inside this workshop.
      </p>
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
