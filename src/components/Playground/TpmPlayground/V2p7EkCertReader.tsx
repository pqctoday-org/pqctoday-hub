/**
 * V2p7EkCertReader.tsx — V2.7 RC1 EK Certificate NV Slot Reader
 *
 * For each of the 6 V2.7 §5.3.1 NV cert indices, TPM2_NV_Read (chunked) →
 * @peculiar/x509 parse → byte-exact SPKI OID match vs the NIST CSOR
 * reference from V2.7 §6.2.x.
 */
import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, XCircle, AlertCircle, RefreshCw, Download } from 'lucide-react'
import * as x509 from '@peculiar/x509'
import { Button } from '@/components/ui/button'
import { nvReadAll } from '../../../wasm/tpmBridge'
import { V2P7_EK_SPECS, type V2p7EkSpec, toHex, bytesEqual } from './v2p7-reference'

interface Props {
  isWasmReady: boolean
  v2p7Status: number[] | null
}

interface CertResult {
  spec: V2p7EkSpec
  error?: string
  cert?: x509.X509Certificate
  certDer?: Uint8Array
  spkiOidBody?: Uint8Array
}

// ── Minimal DER walker — find the SPKI AlgorithmIdentifier OID body ─────────
function readDerLen(b: Uint8Array, off: number): { len: number; hdr: number } {
  const first = b[off]
  if ((first & 0x80) === 0) return { len: first, hdr: 1 }
  const n = first & 0x7f
  let v = 0
  for (let i = 1; i <= n; i++) v = (v << 8) | b[off + i]
  return { len: v, hdr: 1 + n }
}

/**
 * Pull the AlgorithmIdentifier OID *body bytes* (post tag/length) out of a
 * SubjectPublicKeyInfo DER blob. Throws if the structure is malformed.
 */
function extractSpkiOidBody(spkiDer: Uint8Array): Uint8Array {
  // SPKI outer SEQUENCE
  if (spkiDer[0] !== 0x30) throw new Error('SPKI: outer not SEQUENCE')
  let off = 1
  off += readDerLen(spkiDer, off).hdr
  // Inner SEQUENCE = AlgorithmIdentifier
  if (spkiDer[off] !== 0x30) throw new Error('SPKI: AlgorithmIdentifier not SEQUENCE')
  off += 1
  off += readDerLen(spkiDer, off).hdr
  // OBJECT IDENTIFIER
  if (spkiDer[off] !== 0x06) throw new Error('SPKI: first child not OID')
  off += 1
  const oidLen = readDerLen(spkiDer, off)
  off += oidLen.hdr
  return spkiDer.slice(off, off + oidLen.len)
}

export function V2p7EkCertReader({ isWasmReady, v2p7Status }: Props) {
  const [results, setResults] = useState<CertResult[]>([])
  const [loading, setLoading] = useState(false)

  const readAll = useCallback(async () => {
    if (!isWasmReady) return
    setLoading(true)
    const out: CertResult[] = []
    for (const spec of V2P7_EK_SPECS) {
      try {
        const certDer = await nvReadAll(spec.nvCertIndex)
        // Copy into a fresh ArrayBuffer so peculiar/x509 sees a plain
        // ArrayBuffer (not the SharedArrayBuffer-typed WASM HEAP backing).
        const detached = new Uint8Array(certDer).buffer
        const cert = new x509.X509Certificate(detached)
        const spkiBytes = new Uint8Array(cert.publicKey.rawData)
        const oidBody = extractSpkiOidBody(spkiBytes)
        out.push({ spec, cert, certDer, spkiOidBody: oidBody })
      } catch (err: unknown) {
        out.push({ spec, error: err instanceof Error ? err.message : String(err) })
      }
    }
    setResults(out)
    setLoading(false)
  }, [isWasmReady])

  useEffect(() => {
    if (!isWasmReady) return
    queueMicrotask(() => {
      void readAll()
    })
  }, [isWasmReady, readAll])

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold mb-2">V2.7 RC1 EK Certificate NV Reader</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Reads the X.509 EK certificate from each of the 6 spec-mandated NV slots in V2.7
              §5.3.1 (<code>0x01c00060/62/64/70/72/74</code>), parses with{' '}
              <code>@peculiar/x509</code>, and byte-matches the SPKI AlgorithmIdentifier OID against
              the NIST CSOR reference per V2.7 §6.2.3 (ML-KEM) / §6.2.4 (ML-DSA). This is the same
              five-step conformance check that <code>make ek-cert-conformance-xcheck</code> runs in
              C against native swtpm — now running entirely in your browser.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={readAll} disabled={loading || !isWasmReady}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Re-read
          </Button>
        </div>
        {v2p7Status && (
          <div className="mt-4 text-xs font-mono text-muted-foreground">
            V2.7 cert provisioning status:{' '}
            {v2p7Status.map((s, i) => (
              <span key={i} className="mr-2">
                {
                  [
                    'ML-KEM-512',
                    'ML-KEM-768',
                    'ML-KEM-1024',
                    'ML-DSA-44',
                    'ML-DSA-65',
                    'ML-DSA-87',
                  ][i]
                }
                <span
                  className={
                    s === 1
                      ? 'text-status-success ml-1'
                      : s === 2
                        ? 'text-status-error ml-1'
                        : 'text-muted-foreground ml-1'
                  }
                >
                  {s === 1 ? '✓' : s === 2 ? '✗' : '·'}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {results.map((r) => (
          <CertCard key={r.spec.label} r={r} />
        ))}
      </div>
    </div>
  )
}

function CertCard({ r }: { r: CertResult }) {
  const s = r.spec
  if (r.error || !r.cert) {
    return (
      <div className="glass-panel p-5 border-l-4 border-l-status-error">
        <div className="flex items-start gap-2">
          <AlertCircle className="text-status-error h-5 w-5 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <div className="font-bold">{s.label} EK Cert</div>
            <div className="text-xs text-muted-foreground mt-1 font-mono">
              NV 0x{s.nvCertIndex.toString(16)}
            </div>
            <div className="text-xs text-status-error mt-2 font-mono break-all">
              {r.error || 'unknown error'}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const cert = r.cert
  const certDer = r.certDer!
  const oidMatch = r.spkiOidBody ? bytesEqual(r.spkiOidBody, s.nistCsorOid) : false
  const now = new Date()
  const validityOk = cert.notBefore <= now && now <= cert.notAfter
  const allOk = oidMatch && validityOk

  const downloadCert = () => {
    const blob = new Blob([new Uint8Array(certDer)], { type: 'application/x-x509-ca-cert' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${s.label.toLowerCase()}-ek.cert`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div
      className={`glass-panel p-5 border-l-4 ${
        allOk ? 'border-l-status-success' : 'border-l-status-warning'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="min-w-0">
          <div className="font-bold">{s.label} EK Cert</div>
          <div className="text-xs text-muted-foreground font-mono">
            NV 0x{s.nvCertIndex.toString(16)} · {certDer.length} B DER
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={downloadCert} title="Download cert DER">
          <Download className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2 text-xs font-mono">
        <div className="flex items-start gap-2">
          {oidMatch ? (
            <CheckCircle2 className="text-status-success h-3.5 w-3.5 mt-0.5 shrink-0" />
          ) : (
            <XCircle className="text-status-error h-3.5 w-3.5 mt-0.5 shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <div className="text-muted-foreground">SPKI OID (V2.7 §6.2.x)</div>
            <div className="text-foreground break-all">
              {r.spkiOidBody ? toHex(r.spkiOidBody, ' ') : '—'}
            </div>
            <div className="text-muted-foreground">
              expected: {toHex(s.nistCsorOid, ' ')} ({s.nistCsorOidDotted})
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2">
          {validityOk ? (
            <CheckCircle2 className="text-status-success h-3.5 w-3.5 mt-0.5 shrink-0" />
          ) : (
            <XCircle className="text-status-error h-3.5 w-3.5 mt-0.5 shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <div className="text-muted-foreground">validity</div>
            <div className="text-foreground">
              {cert.notBefore.toISOString().slice(0, 10)} →{' '}
              {cert.notAfter.toISOString().slice(0, 10)}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <CheckCircle2 className="text-muted-foreground h-3.5 w-3.5 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-muted-foreground">subject / issuer</div>
            <div className="text-foreground break-all">{cert.subject}</div>
            <div className="text-muted-foreground break-all">issued by: {cert.issuer}</div>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <CheckCircle2 className="text-muted-foreground h-3.5 w-3.5 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-muted-foreground">serial</div>
            <div className="text-foreground font-mono break-all">{cert.serialNumber}</div>
          </div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
        Note: issuer is an ephemeral ML-DSA-65 dev CA. Cert is <strong>educational</strong>, not a
        production trust anchor — V2.7 RC1 deliberately doesn't mandate a CA hierarchy.
      </div>
    </div>
  )
}
