// SPDX-License-Identifier: GPL-3.0-only
/**
 * MLDSASignDemo — Phase 2 end-to-end CMS sign + verify using ML-DSA-65.
 *
 * Pipeline (all four commands run inside the OpenSSL WASM worker, no
 * network, no external tools):
 *   1. openssl genpkey -algorithm ML-DSA-65 -out alice.key
 *   2. openssl req -new -x509 -key alice.key -out alice.crt -subj /CN=Alice
 *   3. openssl cms -sign -signer alice.crt -inkey alice.key -in payload
 *   4. openssl cms -verify -in signed.p7m -certfile alice.crt
 *
 * Today this runs entirely on software-resident keys. Once openssl.wasm
 * is rebuilt to export pqctoday_cms_init, the Step 4 banner flips to
 * "provider ok" and a follow-up Phase 3 toggle lets the same demo route
 * through pkcs11: URIs into softhsmv3.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CheckCircle2,
  AlertTriangle,
  PenLine,
  ShieldCheck,
  Key as KeyIcon,
  FileText,
  RefreshCw,
  Lock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CMSSigningService, isCompositeAlg, type CmsAlg } from '../services/CMSSigningService'
import { smimeEnvelopeSigned } from '../services/smimeMultipart'

type Stage = 'idle' | 'genkey' | 'mkcert' | 'sign' | 'verify' | 'done' | 'error'

interface StageResult {
  keyPem?: string
  pubPem?: string
  certPem?: string
  signedP7m?: Uint8Array
  verifyOk?: boolean
  verifyPayload?: Uint8Array
  verifyStderr?: string
}

const DEFAULT_PAYLOAD =
  'Hello from the PQC Email & Document Signing Workshop.\n' +
  'This message was signed in-browser with ML-DSA-65 via OpenSSL 3.6 WASM.\n'

const ALG_CHOICES: CmsAlg[] = [
  'ML-DSA-65',
  'ML-DSA-44',
  'ML-DSA-87',
  'SLH-DSA-SHA2-128s',
  'RSA-PSS',
  'EC',
  // LAMPS draft-19 composite (HSM-only — auto-forces useHsm on selection)
  'id-MLDSA44-RSA2048-PSS-SHA256',
  'id-MLDSA65-ECDSA-P256-SHA512',
  'id-MLDSA87-ECDSA-P384-SHA512',
]

const KEY_ID = 'alice'
const CERT_ID = 'alice'

interface MLDSASignDemoProps {
  /** True when pqctoday_cms_init has completed successfully; gates the HSM toggle. */
  providerReady: boolean
}

export function MLDSASignDemo({ providerReady }: MLDSASignDemoProps) {
  const serviceRef = useRef<CMSSigningService | null>(null)
  const [alg, setAlg] = useState<CmsAlg>('ML-DSA-65')
  const [payload, setPayload] = useState<string>(DEFAULT_PAYLOAD)
  // Raw user intent; the effective flag below ignores it when the provider
  // isn't ready so the demo never accidentally routes to a dead HSM path.
  // Composite algorithms (LAMPS draft-19) only exist inside pkcs11-provider
  // — selecting one forces useHsm to true.
  const [useHsmIntent, setUseHsmIntent] = useState<boolean>(false)
  const composite = isCompositeAlg(alg)
  const useHsm = providerReady && (useHsmIntent || composite)
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
      setStage('genkey')
      const k = await svc.genKey(alg, KEY_ID, useHsm)
      setResult((prev) => ({ ...prev, keyPem: k.keyPem, pubPem: k.pubPem }))

      setStage('mkcert')
      const c = await svc.mkCert({
        keyId: KEY_ID,
        certId: CERT_ID,
        subject: '/CN=Alice/O=PQC Workshop/C=US',
        days: 365,
        useHsm,
      })
      setResult((prev) => ({ ...prev, certPem: c.certPem }))

      setStage('sign')
      const s = await svc.sign({
        keyId: KEY_ID,
        certId: CERT_ID,
        payload: new TextEncoder().encode(payload),
        useHsm,
      })
      setResult((prev) => ({ ...prev, signedP7m: s.signedP7m }))

      setStage('verify')
      const v = await svc.verify({ signedP7m: s.signedP7m, certId: CERT_ID, useHsm })
      setResult((prev) => ({
        ...prev,
        verifyOk: v.ok,
        verifyPayload: v.payload,
        verifyStderr: v.stderrTail,
      }))

      setStage('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setStage('error')
    }
  }

  const verifyPayloadText = useMemo(() => {
    if (!result.verifyPayload) return ''
    try {
      return new TextDecoder().decode(result.verifyPayload)
    } catch {
      return '<binary>'
    }
  }, [result.verifyPayload])

  const sizes = useMemo(
    () => ({
      keyBytes: result.keyPem?.length ?? 0,
      certBytes: result.certPem?.length ?? 0,
      sigBytes: result.signedP7m?.length ?? 0,
    }),
    [result]
  )

  const busy = stage !== 'idle' && stage !== 'done' && stage !== 'error'

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <PenLine size={18} className="text-primary" />
          ML-DSA CMS sign + verify (end-to-end)
        </h3>
        <p className="text-sm text-muted-foreground">
          Runs the full <code className="rounded bg-muted px-1 py-0.5 text-xs">genpkey</code> →{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">req -x509</code> →{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">cms -sign</code> →{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">cms -verify</code> pipeline inside
          the OpenSSL WASM worker. Software keys today; pkcs11-provider routing flips on once Step 4
          reports a green init.
        </p>
      </header>

      <div className="glass-panel space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-medium text-muted-foreground">
            Algorithm
            <select
              value={alg}
              onChange={(e) => setAlg(e.target.value as CmsAlg)}
              disabled={busy}
              className="ml-2 rounded border border-input bg-background px-2 py-1 text-xs"
            >
              {ALG_CHOICES.map((a) => (
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
            } ${composite ? 'cursor-not-allowed opacity-90' : ''}`}
            title={
              composite
                ? 'LAMPS draft-19 composite algorithms only exist in pkcs11-provider — HSM mode forced.'
                : providerReady
                  ? useHsm
                    ? 'Private key stays inside softhsmv3; sign routed via pkcs11-provider'
                    : 'Click to route the signing key through softhsmv3 (HSM)'
                  : 'Rebuild openssl.wasm (npm run build:openssl-wasm) so pqctoday_cms_init lands, then re-init in Step 4 above'
            }
          >
            <input
              type="checkbox"
              checked={useHsm}
              disabled={!providerReady || busy || composite}
              onChange={(e) => setUseHsmIntent(e.target.checked)}
              className="h-3 w-3"
            />
            <Lock size={12} />
            Use HSM key
          </label>
          {composite && (
            <span
              className="inline-flex items-center gap-1 rounded-md border border-accent/40 bg-accent/10 px-2 py-1 text-[10px] font-medium text-accent"
              title="LAMPS draft-ietf-lamps-pq-composite-sigs-19 — single combined-OID SignerInfo. Verifier MUST validate both algorithms. Implemented by pkcs11-provider's composite.c."
            >
              LAMPS composite -19
            </span>
          )}
          <Button onClick={run} disabled={busy} variant="gradient" size="sm" className="gap-1.5">
            {busy ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                Running {stage}…
              </>
            ) : (
              <>
                <PenLine size={14} />
                Sign + Verify
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

      {(stage !== 'idle' || result.keyPem) && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <StageCard
            icon={<KeyIcon size={14} />}
            title="Key pair"
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
            {result.pubPem ? (
              <KVRow label="Public key" value={`${result.pubPem.length} chars (PEM)`} />
            ) : null}
            {result.keyPem && (
              <details className="mt-2">
                <summary className="cursor-pointer text-[11px] text-primary">
                  Show private key PEM
                </summary>
                <pre className="mt-1 max-h-40 max-w-full overflow-auto whitespace-pre rounded bg-muted/30 p-1.5 font-mono text-[10px] leading-tight">
                  {result.keyPem}
                </pre>
              </details>
            )}
          </StageCard>

          <StageCard
            icon={<ShieldCheck size={14} />}
            title="Self-signed cert"
            done={Boolean(result.certPem)}
            running={stage === 'mkcert'}
          >
            {result.certPem ? (
              <KVRow label="Subject" value="/CN=Alice/O=PQC Workshop/C=US" />
            ) : null}
            {result.certPem ? <KVRow label="Validity" value="365 days" /> : null}
            {result.certPem ? (
              <KVRow label="Size" value={`${sizes.certBytes} chars (PEM)`} />
            ) : null}
            {result.certPem && (
              <details className="mt-2">
                <summary className="cursor-pointer text-[11px] text-primary">Show cert PEM</summary>
                <pre className="mt-1 max-h-40 max-w-full overflow-auto whitespace-pre rounded bg-muted/30 p-1.5 font-mono text-[10px] leading-tight">
                  {result.certPem}
                </pre>
              </details>
            )}
          </StageCard>

          <StageCard
            icon={<FileText size={14} />}
            title="CMS SignedData (.p7m)"
            done={Boolean(result.signedP7m)}
            running={stage === 'sign'}
          >
            {result.signedP7m ? <KVRow label="Encoding" value="DER (binary)" /> : null}
            {result.signedP7m ? <KVRow label="Size" value={`${sizes.sigBytes} bytes`} /> : null}
            {result.signedP7m && (
              <details className="mt-2">
                <summary className="cursor-pointer text-[11px] text-primary">
                  First 96 bytes (hex)
                </summary>
                <pre className="mt-1 max-w-full overflow-auto whitespace-pre rounded bg-muted/30 p-1.5 font-mono text-[10px] leading-tight">
                  {hexDump(result.signedP7m.slice(0, 96))}
                </pre>
              </details>
            )}
            {result.signedP7m && (
              <details className="mt-2">
                <summary className="cursor-pointer text-[11px] text-primary">
                  Show S/MIME envelope (.eml)
                </summary>
                <pre className="mt-1 max-h-48 max-w-full overflow-auto whitespace-pre-wrap break-all rounded bg-muted/30 p-1.5 font-mono text-[10px] leading-tight">
                  {smimeEnvelopeSigned(result.signedP7m, {
                    subject: 'PQC workshop signed message',
                  })}
                </pre>
              </details>
            )}
          </StageCard>

          <StageCard
            icon={<CheckCircle2 size={14} />}
            title="Verify"
            done={stage === 'done'}
            running={stage === 'verify'}
          >
            {result.verifyOk === true && (
              <>
                <div className="flex items-center gap-1.5 text-xs text-status-success">
                  <CheckCircle2 size={14} />
                  Signature verifies against signer cert
                </div>
                <KVRow
                  label="Payload"
                  value={`${result.verifyPayload?.length ?? 0} bytes recovered`}
                />
                {verifyPayloadText && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-[11px] text-primary">
                      Show recovered payload
                    </summary>
                    <pre className="mt-1 max-h-40 max-w-full overflow-auto whitespace-pre-wrap break-words rounded bg-muted/30 p-1.5 font-mono text-[10px] leading-tight">
                      {verifyPayloadText}
                    </pre>
                  </details>
                )}
              </>
            )}
            {result.verifyOk === false && (
              <>
                <div className="flex items-center gap-1.5 text-xs text-status-error">
                  <AlertTriangle size={14} />
                  Signature did NOT verify
                </div>
                {result.verifyStderr && (
                  <pre className="mt-1 max-h-32 max-w-full overflow-auto whitespace-pre-wrap break-words rounded bg-muted/30 p-1.5 font-mono text-[10px] leading-tight">
                    {result.verifyStderr}
                  </pre>
                )}
              </>
            )}
            {result.verifyOk === undefined && stage !== 'verify' && (
              <div className="text-xs text-muted-foreground">Pending — sign first.</div>
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

/** Format bytes as a `xxd`-style hex dump: 16 bytes per line, offset prefix,
 *  ASCII gutter. Wraps cleanly inside narrow card columns. */
function hexDump(bytes: Uint8Array): string {
  const lines: string[] = []
  for (let i = 0; i < bytes.length; i += 16) {
    const chunk = bytes.slice(i, i + 16)
    const offset = i.toString(16).padStart(4, '0')
    const hex = Array.from(chunk)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(' ')
      .padEnd(48, ' ')
    const ascii = Array.from(chunk)
      .map((b) => (b >= 0x20 && b < 0x7f ? String.fromCharCode(b) : '.'))
      .join('')
    lines.push(`${offset}  ${hex}  ${ascii}`)
  }
  return lines.join('\n')
}
