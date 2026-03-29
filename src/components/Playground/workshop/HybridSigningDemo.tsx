// SPDX-License-Identifier: GPL-3.0-only
/**
 * HybridSigningDemo — signs the same message with ECDSA-P256 (classical) and
 * ML-DSA-65 (PQC) in parallel and compares signatures side by side.
 *
 * Demonstrates the PQC migration co-existence pattern: run both algorithms
 * simultaneously during transition until PQC is the sole signer.
 *
 * Crypto backends:
 *  - ECDSA-P256: Web Crypto API (browser-native)
 *  - ML-DSA-65:  OpenSSL v3.6.1 WASM via liboqs_dsa wrapper
 */
import React, { useState } from 'react'
import { FileSignature, CheckCircle, XCircle, Loader2, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ErrorAlert } from '@/components/ui/error-alert'
import * as MLDSA from '@/wasm/liboqs_dsa'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const toHex = (buf: ArrayBuffer | Uint8Array): string => {
  const arr = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('')
}

const hexSnippet = (hex: string, head = 16, tail = 8): string => {
  if (hex.length <= head + tail + 3) return hex
  return `${hex.slice(0, head)}…${hex.slice(-tail)}`
}

interface SideResult {
  label: string
  algorithm: string
  keySize: string
  signatureBytes: number
  signatureHex: string
  verifyOk: boolean | null
  timingMs: number
}

// ---------------------------------------------------------------------------
// ECDSA-P256 via Web Crypto
// ---------------------------------------------------------------------------

async function runECDSA(
  message: string
): Promise<{ sigBytes: number; sigHex: string; verifyOk: boolean; ms: number }> {
  const t0 = performance.now()
  const data = new TextEncoder().encode(message)
  const kp = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, [
    'sign',
    'verify',
  ])
  const sigBuf = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, kp.privateKey, data)
  const ok = await crypto.subtle.verify(
    { name: 'ECDSA', hash: 'SHA-256' },
    kp.publicKey,
    sigBuf,
    data
  )
  const ms = Math.round(performance.now() - t0)
  return { sigBytes: sigBuf.byteLength, sigHex: toHex(sigBuf), verifyOk: ok, ms }
}

// ---------------------------------------------------------------------------
// ML-DSA-65 via OpenSSL WASM
// ---------------------------------------------------------------------------

async function runMLDSA(
  message: string
): Promise<{ sigBytes: number; sigHex: string; verifyOk: boolean; ms: number }> {
  const t0 = performance.now()
  const data = new TextEncoder().encode(message)
  const keys = await MLDSA.generateKey({ name: 'ML-DSA-65' })
  const sig = await MLDSA.sign(data, keys.secretKey)
  const ok = await MLDSA.verify(sig, data, keys.publicKey)
  const ms = Math.round(performance.now() - t0)
  return { sigBytes: sig.length, sigHex: toHex(sig), verifyOk: ok, ms }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const HybridSigningDemo: React.FC = () => {
  const [message, setMessage] = useState('Hello, hybrid PQC world!')
  const [ecdsaResult, setEcdsaResult] = useState<SideResult | null>(null)
  const [mldsaResult, setMldsaResult] = useState<SideResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSign = async () => {
    setLoading(true)
    setError(null)
    setEcdsaResult(null)
    setMldsaResult(null)

    try {
      const [ec, ml] = await Promise.all([runECDSA(message), runMLDSA(message)])

      setEcdsaResult({
        label: 'ECDSA-P256',
        algorithm: 'ECDSA with SHA-256 (NIST P-256)',
        keySize: '256-bit (classical)',
        signatureBytes: ec.sigBytes,
        signatureHex: ec.sigHex,
        verifyOk: ec.verifyOk,
        timingMs: ec.ms,
      })
      setMldsaResult({
        label: 'ML-DSA-65',
        algorithm: 'ML-DSA-65 (FIPS 204, NIST Level 3)',
        keySize: '1952-byte public key',
        signatureBytes: ml.sigBytes,
        signatureHex: ml.sigHex,
        verifyOk: ml.verifyOk,
        timingMs: ml.ms,
      })
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  const ecdsaBytes = ecdsaResult?.signatureBytes ?? 0
  const mldsaBytes = mldsaResult?.signatureBytes ?? 0
  const maxBytes = Math.max(ecdsaBytes, mldsaBytes, 1)

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="glass-panel p-4 space-y-1">
        <div className="flex items-center gap-2">
          <FileSignature className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground">Hybrid Signature Demo</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Signs the same message with both a classical (ECDSA-P256) and a post-quantum (ML-DSA-65)
          algorithm simultaneously — the migration co-existence pattern. Both signatures are
          independently verifiable; a verifier that understands only classical or only PQC can still
          validate.
        </p>
      </div>

      {/* Educational callout */}
      <div className="flex items-start gap-3 p-3 rounded border border-primary/20 bg-primary/5 text-sm text-muted-foreground">
        <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
        <p>
          During migration, systems can attach both signatures to artefacts. Once all verifiers
          support PQC, the classical signature is dropped. This is the{' '}
          <span className="text-foreground font-medium">dual-signature</span> approach described in
          NIST IR 8547 and RFC 9629.
        </p>
      </div>

      {/* Input */}
      <div className="space-y-2">
        <label htmlFor="hybrid-sign-message" className="text-sm text-muted-foreground">
          Message to sign
        </label>
        <div className="flex gap-2">
          <Input
            id="hybrid-sign-message"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value)
              setEcdsaResult(null)
              setMldsaResult(null)
            }}
            placeholder="Enter message…"
            className="font-mono"
          />
          <Button variant="gradient" onClick={handleSign} disabled={loading || !message.trim()}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Signing…
              </>
            ) : (
              'Sign Both'
            )}
          </Button>
        </div>
      </div>

      {error && <ErrorAlert message={error} />}

      {/* Results side by side */}
      {(ecdsaResult || mldsaResult) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[ecdsaResult, mldsaResult].map((r) => {
            if (!r) return null
            const isPqc = r.label.startsWith('ML-')
            const barWidth = maxBytes > 0 ? Math.round((r.signatureBytes / maxBytes) * 100) : 0
            return (
              <div
                key={r.label}
                className={`glass-panel p-4 space-y-3 ${isPqc ? 'border-primary/30' : 'border-border'}`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded ${
                      isPqc ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isPqc ? 'Post-Quantum' : 'Classical'}
                  </span>
                  <span className="text-xs text-muted-foreground">{r.timingMs} ms</span>
                </div>

                <div>
                  <p className="font-medium text-foreground">{r.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{r.algorithm}</p>
                  <p className="text-xs text-muted-foreground">{r.keySize}</p>
                </div>

                {/* Signature size bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Signature size</span>
                    <span className="font-mono text-foreground">{r.signatureBytes} bytes</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${isPqc ? 'bg-primary' : 'bg-muted-foreground/60'}`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>

                {/* Signature hex */}
                <div className="p-2 rounded bg-muted/50 font-mono text-xs text-muted-foreground break-all">
                  {hexSnippet(r.signatureHex)}
                </div>

                {/* Verify badge */}
                {r.verifyOk !== null && (
                  <div
                    className={`flex items-center gap-1.5 text-xs rounded px-2 py-1 ${
                      r.verifyOk
                        ? 'bg-status-success/10 text-status-success'
                        : 'bg-status-error/10 text-status-error'
                    }`}
                  >
                    {r.verifyOk ? <CheckCircle size={12} /> : <XCircle size={12} />}
                    {r.verifyOk ? 'Signature verified ✓' : 'Verification failed'}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Size comparison summary */}
      {ecdsaResult && mldsaResult && (
        <div className="glass-panel p-4 text-sm space-y-2">
          <p className="font-medium text-foreground">Size comparison</p>
          <div className="flex items-center gap-3 text-muted-foreground text-xs">
            <span>
              ML-DSA-65 signature is{' '}
              <span className="text-foreground font-mono">
                {(mldsaResult.signatureBytes / ecdsaResult.signatureBytes).toFixed(1)}×
              </span>{' '}
              larger than ECDSA-P256
            </span>
            <span>·</span>
            <span>
              {ecdsaResult.signatureBytes} B vs {mldsaResult.signatureBytes} B
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            PQC signatures are larger because they rely on hard mathematical problems that resist
            quantum attacks (lattice-based hardness in ML-DSA vs elliptic curve discrete logarithm
            in ECDSA). The security guarantee is fundamentally different.
          </p>
        </div>
      )}
    </div>
  )
}
