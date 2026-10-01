// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useCallback, useMemo } from 'react'
import { Layers, ArrowRight, CheckCircle, XCircle, ShieldCheck } from 'lucide-react'
import { SAMPLE_JWT_PAYLOAD, JOSE_SIGNING_ALGORITHMS } from '../constants'
import {
  createJWTHeader,
  createJWTPayload,
  generateJwsKeyPair,
  signJWS,
  verifyJWS,
  base64urlDecode,
  base64urlEncode,
  isSoftHsmSupported,
  type JwsKeyPair,
  type SignedJwsResult,
  type JwsBackend,
} from '../jwtUtils'
import { Button } from '@/components/ui/button'
import { useHSM } from '@/hooks/useHSM'
import { LiveHSMToggle } from '@/components/shared/LiveHSMToggle'

type HybridApproach = 'nested' | 'composite'

interface NestedResult {
  approach: 'nested'
  innerJwt: string
  /** The inner token's ES256 verification key — RFC 8725 §3.3 requires both layers be checked. */
  innerPublicKey: CryptoKey
  outerJwt: SignedJwsResult
  innerSignatureBytes: number
  outerSignatureBytes: number
}

interface NestedVerifyResult {
  outer: boolean
  inner: boolean | null
}

interface CompositeResult {
  approach: 'composite'
  jwt: SignedJwsResult
  signatureBytes: number
}

type HybridResult = NestedResult | CompositeResult

const ES256_INFO = JOSE_SIGNING_ALGORITHMS.find((a) => a.jose === 'ES256')!
const MLDSA65_INFO = JOSE_SIGNING_ALGORITHMS.find((a) => a.jose === 'ML-DSA-65')!

export const HybridJWT: React.FC = () => {
  const [selectedApproach, setSelectedApproach] = useState<HybridApproach>('nested')
  const [backend, setBackend] = useState<JwsBackend>('noble')
  const [result, setResult] = useState<HybridResult | null>(null)
  const [keyPair, setKeyPair] = useState<JwsKeyPair | null>(null)
  const [verifyValid, setVerifyValid] = useState<boolean | null>(null)
  const [nestedVerify, setNestedVerify] = useState<NestedVerifyResult | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [step, setStep] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const hsm = useHSM('rust')

  // Composite always runs noble — softhsmv3 toggle only applies to nested outer sign.
  const effectiveBackend: JwsBackend = selectedApproach === 'composite' ? 'noble' : backend

  const hsmCtx = useMemo(() => {
    if (effectiveBackend !== 'softhsmv3' || !hsm.isReady || !hsm.moduleRef.current) return undefined
    return { M: hsm.moduleRef.current, session: hsm.hSessionRef.current }
  }, [effectiveBackend, hsm.isReady, hsm.moduleRef, hsm.hSessionRef])

  // Outer alg for nested — ML-DSA-65 supports softhsmv3.
  const outerAlg = 'ML-DSA-65' as const
  const hsmAvailable = isSoftHsmSupported(outerAlg)

  const handleCreate = useCallback(async () => {
    setIsCreating(true)
    setStep(0)
    setResult(null)
    setVerifyValid(null)
    setError(null)
    try {
      if (selectedApproach === 'nested') {
        // ── Inner JWT (ES256 via WebCrypto) ────────────────────────────────────
        setStep(1)
        const ecKey = await crypto.subtle.generateKey(
          { name: 'ECDSA', namedCurve: 'P-256' },
          true,
          ['sign', 'verify']
        )
        const innerHeaderB64 = createJWTHeader('ES256')
        const innerPayloadB64 = createJWTPayload(SAMPLE_JWT_PAYLOAD)
        const innerSigningInput = `${innerHeaderB64}.${innerPayloadB64}`
        const innerSigRaw = await crypto.subtle.sign(
          { name: 'ECDSA', hash: 'SHA-256' },
          ecKey.privateKey,
          new TextEncoder().encode(innerSigningInput)
        )
        const innerSigBytes = new Uint8Array(innerSigRaw)
        const innerSigB64 = base64urlEncode(innerSigBytes)
        const innerJwt = `${innerSigningInput}.${innerSigB64}`

        // ── Outer ML-DSA-65 JWT wrapping the inner JWT ────────────────────────
        setStep(2)
        const kp = await generateJwsKeyPair({
          alg: outerAlg,
          backend: effectiveBackend,
          hsm: hsmCtx,
        })
        setKeyPair(kp)

        // RFC 7519 §5.2: the outer payload IS the inner compact JWT, and
        // `cty: "JWT"` tells the recipient to process it as a JWT in turn.
        const outerSigned = await signJWS({
          alg: outerAlg,
          header: { cty: 'JWT' },
          payload: innerJwt,
          keyPair: kp,
          backend: effectiveBackend,
          hsm: hsmCtx,
        })

        setStep(3)
        setResult({
          approach: 'nested',
          innerJwt,
          innerPublicKey: ecKey.publicKey,
          outerJwt: outerSigned,
          innerSignatureBytes: innerSigBytes.length,
          outerSignatureBytes: outerSigned.signature.length,
        })
      } else {
        // ── Composite: ML-DSA-65-Ed25519 per draft-ietf-jose-pq-composite-sigs-04
        // Composite always uses noble — no softhsmv3 path for Ed25519 traditional component.
        setStep(1)
        const kp = await generateJwsKeyPair({ alg: 'ML-DSA-65-Ed25519', backend: 'noble' })
        setKeyPair(kp)
        setStep(2)
        const signed = await signJWS({
          alg: 'ML-DSA-65-Ed25519',
          payload: SAMPLE_JWT_PAYLOAD,
          keyPair: kp,
          backend: 'noble',
        })
        setStep(3)
        setResult({ approach: 'composite', jwt: signed, signatureBytes: signed.signature.length })
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setIsCreating(false)
    }
  }, [selectedApproach, effectiveBackend, hsmCtx])

  const handleVerify = useCallback(async () => {
    if (!result || !keyPair) return
    setNestedVerify(null)
    try {
      if (result.approach === 'composite') {
        const v = await verifyJWS({
          token: result.jwt.token,
          publicKey: keyPair.publicKey,
          backend: 'noble',
        })
        setVerifyValid(v.valid)
      } else {
        // RFC 8725 §3.3: in a nested JWT "both outer and inner operations MUST
        // be validated", each with the key the application expects for it.
        const outer = await verifyJWS({
          token: result.outerJwt.token,
          publicKey: keyPair.publicKey,
          backend: effectiveBackend,
          hsm: hsmCtx,
        })
        let inner: boolean | null = null
        if (outer.valid) {
          const innerJwt = new TextDecoder().decode(
            base64urlDecode(result.outerJwt.token.split('.')[1])
          )
          const [h, p, sig] = innerJwt.split('.')
          inner = await crypto.subtle.verify(
            { name: 'ECDSA', hash: 'SHA-256' },
            result.innerPublicKey,
            base64urlDecode(sig) as Uint8Array<ArrayBuffer>,
            new TextEncoder().encode(`${h}.${p}`)
          )
        }
        setNestedVerify({ outer: outer.valid, inner })
        setVerifyValid(outer.valid && inner === true)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setVerifyValid(false)
    }
  }, [result, keyPair, effectiveBackend, hsmCtx])

  const totalSize =
    result?.approach === 'nested' ? result.outerJwt.token.length : (result?.jwt.token.length ?? 0)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">Hybrid JWT Creation</h3>
        <p className="text-sm text-muted-foreground">
          During the PQC transition, a hybrid JWT combines a classical and a PQC signature so the
          token stays secure if either algorithm fails. Composite mode follows{' '}
          <a
            href="https://datatracker.ietf.org/doc/draft-ietf-jose-pq-composite-sigs/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            draft-ietf-jose-pq-composite-sigs-04
          </a>{' '}
          and verifies against that draft&apos;s published examples; it is a work-in-progress
          Internet-Draft, so treat this tab as experimental.
        </p>
      </div>

      {/* Approach Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button
          variant="ghost"
          size="tile"
          onClick={() => {
            setSelectedApproach('nested')
            setResult(null)
            setVerifyValid(null)
            setStep(0)
          }}
          className={`border transition-colors ${
            selectedApproach === 'nested'
              ? 'bg-primary/10 border-primary/50'
              : 'bg-muted/50 border-border hover:border-primary/30'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Layers
              size={16}
              className={selectedApproach === 'nested' ? 'text-primary' : 'text-muted-foreground'}
            />
            <span className="text-sm font-bold text-foreground">Nested JWT</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Sign the claims with ES256 (WebCrypto), then make that compact JWT the payload of an
            outer ML-DSA-65 JWT with{' '}
            <code className="text-foreground/80">cty: &quot;JWT&quot;</code> (RFC 7519 §5.2). A
            verifier must check both layers (RFC 8725 §3.3). A classical-only verifier rejects the
            outer algorithm, so it only reaches the inner token if a gateway or protocol you define
            unwraps it first.
          </p>
        </Button>
        <Button
          variant="ghost"
          size="tile"
          onClick={() => {
            setSelectedApproach('composite')
            setResult(null)
            setVerifyValid(null)
            setStep(0)
          }}
          className={`border transition-colors ${
            selectedApproach === 'composite'
              ? 'bg-primary/10 border-primary/50'
              : 'bg-muted/50 border-border hover:border-primary/30'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Layers
              size={16}
              className={
                selectedApproach === 'composite' ? 'text-primary' : 'text-muted-foreground'
              }
            />
            <span className="text-sm font-bold text-foreground">Composite (ML-DSA-65-Ed25519)</span>
          </div>
          <p className="text-xs text-muted-foreground">
            A single JWT with <code className="text-foreground/80">alg: ML-DSA-65-Ed25519</code>.
            The signature is the ML-DSA-65 signature followed directly by the Ed25519 signature (no
            length prefix). Both sign M&prime;, a domain-separated hash of the signing input, and
            both must verify.
          </p>
        </Button>
      </div>

      {/* Backend selector — toggle only affects nested outer ML-DSA-65 sign */}
      {hsmAvailable && (
        <div className="glass-panel p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck size={16} className="text-primary" />
            <h4 className="text-sm font-bold text-foreground">Signing backend</h4>
            {selectedApproach === 'composite' && (
              <span className="text-[10px] text-muted-foreground ml-1">(nested outer only)</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setBackend('noble')
                setResult(null)
                setVerifyValid(null)
              }}
              className={`px-3 py-1.5 rounded text-xs font-medium border ${
                effectiveBackend === 'noble'
                  ? 'bg-primary/20 text-primary border-primary/50'
                  : 'bg-muted/50 text-muted-foreground border-border hover:border-primary/30'
              }`}
            >
              @noble/post-quantum (pure JS)
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setBackend('softhsmv3')
                setResult(null)
                setVerifyValid(null)
              }}
              disabled={selectedApproach === 'composite'}
              className={`px-3 py-1.5 rounded text-xs font-medium border disabled:opacity-40 ${
                effectiveBackend === 'softhsmv3'
                  ? 'bg-primary/20 text-primary border-primary/50'
                  : 'bg-muted/50 text-muted-foreground border-border hover:border-primary/30'
              }`}
            >
              SoftHSM3 (PKCS#11 v3.2 WASM)
            </Button>
          </div>
          {effectiveBackend === 'softhsmv3' && (
            <div className="mt-3">
              <LiveHSMToggle
                hsm={hsm}
                operations={['C_GenerateKeyPair', 'C_MessageSignInit', 'C_SignMessage']}
              />
            </div>
          )}
        </div>
      )}

      {/* Step-by-step visual */}
      <div className="glass-panel p-4">
        <h4 className="text-sm font-bold text-foreground mb-3">
          {selectedApproach === 'nested' ? 'Nested JWT' : 'Composite'} Creation Flow
        </h4>
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-0">
          <div
            className={`flex-1 text-center p-3 rounded-lg border transition-colors ${
              step >= 1 ? 'bg-warning/10 border-warning/50' : 'bg-muted/50 border-border'
            }`}
          >
            <div
              className={`text-xs font-bold ${step >= 1 ? 'text-warning' : 'text-muted-foreground'}`}
            >
              Step 1
            </div>
            <div className="text-[10px] text-muted-foreground">
              {selectedApproach === 'nested' ? 'ES256 Inner Sign' : 'Generate composite key'}
            </div>
          </div>
          <ArrowRight size={14} className="text-muted-foreground hidden sm:block mx-1" />
          <div
            className={`flex-1 text-center p-3 rounded-lg border transition-colors ${
              step >= 2 ? 'bg-success/10 border-success/50' : 'bg-muted/50 border-border'
            }`}
          >
            <div
              className={`text-xs font-bold ${step >= 2 ? 'text-success' : 'text-muted-foreground'}`}
            >
              Step 2
            </div>
            <div className="text-[10px] text-muted-foreground">
              {selectedApproach === 'nested'
                ? 'ML-DSA-65 Outer Sign'
                : 'Sign M\u2032 with ML-DSA-65 + Ed25519'}
            </div>
          </div>
          <ArrowRight size={14} className="text-muted-foreground hidden sm:block mx-1" />
          <div
            className={`flex-1 text-center p-3 rounded-lg border transition-colors ${
              step >= 3 ? 'bg-primary/10 border-primary/50' : 'bg-muted/50 border-border'
            }`}
          >
            <div
              className={`text-xs font-bold ${step >= 3 ? 'text-primary' : 'text-muted-foreground'}`}
            >
              Step 3
            </div>
            <div className="text-[10px] text-muted-foreground">
              {selectedApproach === 'nested' ? 'Assemble nested token' : 'Concatenate signatures'}
            </div>
          </div>
        </div>
      </div>

      {/* Create Button */}
      <div className="flex justify-center gap-2">
        <Button
          variant="gradient"
          onClick={() => void handleCreate()}
          disabled={isCreating || (effectiveBackend === 'softhsmv3' && !hsmCtx)}
          className="px-6 py-3 font-bold rounded-lg disabled:opacity-50 transition-colors flex items-center gap-2"
        >
          <Layers size={16} />
          {isCreating ? 'Creating...' : 'Create Hybrid JWT'}
        </Button>
        {result && (
          <Button
            variant="outline"
            onClick={() => void handleVerify()}
            disabled={effectiveBackend === 'softhsmv3' && !hsmCtx}
            className="px-6 py-3 font-bold rounded-lg transition-colors flex items-center gap-2"
          >
            Verify
          </Button>
        )}
        {verifyValid !== null && (
          <span
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded border font-bold ${
              verifyValid
                ? 'bg-success/20 text-success border-success/50'
                : 'bg-destructive/20 text-destructive border-destructive/50'
            }`}
          >
            {verifyValid ? <CheckCircle size={12} /> : <XCircle size={12} />}
            {verifyValid ? 'Signature valid' : 'Signature invalid'}
          </span>
        )}
        {verifyValid !== null && result?.approach === 'nested' && nestedVerify && (
          <span className="flex items-center text-[10px] text-muted-foreground">
            outer ML-DSA-65: {nestedVerify.outer ? 'valid' : 'invalid'} · inner ES256:{' '}
            {nestedVerify.inner === null ? 'not checked' : nestedVerify.inner ? 'valid' : 'invalid'}
          </span>
        )}
      </div>

      {error && (
        <div className="rounded-lg p-3 border border-destructive/50 bg-destructive/10 text-xs text-status-error">
          {error}
        </div>
      )}

      {/* Result Display */}
      {result?.approach === 'nested' && (
        <>
          <div className="glass-panel p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle size={16} className="text-warning" />
              <h4 className="text-sm font-bold text-foreground">Inner JWT (ES256, WebCrypto)</h4>
              <span className="text-[10px] px-2 py-0.5 rounded border font-bold bg-warning/20 text-warning border-warning/50">
                Classical signature
              </span>
            </div>
            <div className="bg-background rounded-lg p-3 border border-border overflow-x-auto">
              <code className="text-[10px] font-mono text-foreground/70 break-all">
                {result.innerJwt.substring(0, 200)}
                {result.innerJwt.length > 200 && '...'}
              </code>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Size: {result.innerJwt.length} chars · ES256 signature: {result.innerSignatureBytes}{' '}
              bytes
            </div>
          </div>

          <div className="glass-panel p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle size={16} className="text-success" />
              <h4 className="text-sm font-bold text-foreground">
                Outer JWT (ML-DSA-65,{' '}
                {effectiveBackend === 'softhsmv3'
                  ? 'softhsmv3 PKCS#11 v3.2'
                  : '@noble/post-quantum'}
                )
              </h4>
              <span className="text-[10px] px-2 py-0.5 rounded border font-bold bg-success/20 text-success border-success/50">
                PQC signature
              </span>
            </div>
            <div className="bg-background rounded-lg p-3 border border-border overflow-x-auto">
              <code className="text-[10px] font-mono text-foreground/70 break-all">
                {result.outerJwt.token.substring(0, 200)}
                {result.outerJwt.token.length > 200 && '...'}
              </code>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Size: {result.outerJwt.token.length} chars · ML-DSA-65 signature:{' '}
              {result.outerSignatureBytes} bytes
            </div>
          </div>
        </>
      )}

      {result?.approach === 'composite' && (
        <div className="glass-panel p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={16} className="text-success" />
            <h4 className="text-sm font-bold text-foreground">Composite JWT (ML-DSA-65-Ed25519)</h4>
            <span className="text-[10px] px-2 py-0.5 rounded border font-bold bg-warning/20 text-warning border-warning/50">
              draft-ietf-jose-pq-composite-sigs-04 · experimental
            </span>
          </div>
          <div className="bg-background rounded-lg p-3 border border-border overflow-x-auto">
            <code className="text-[10px] font-mono text-foreground/70 break-all">
              <span className="text-primary">{result.jwt.headerB64}</span>
              <span className="text-muted-foreground font-bold">.</span>
              <span className="text-success">{result.jwt.payloadB64}</span>
              <span className="text-muted-foreground font-bold">.</span>
              <span className="text-destructive">
                {result.jwt.signatureB64.substring(0, 120)}
                {result.jwt.signatureB64.length > 120 && '…'}
              </span>
            </code>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Size: {result.jwt.token.length} chars · composite signature: {result.signatureBytes}{' '}
            bytes (3,309 B ML-DSA-65 + 64 B Ed25519, directly concatenated)
          </div>
        </div>
      )}

      {result && (
        <div className="glass-panel p-4">
          <h4 className="text-sm font-bold text-foreground mb-3">Size Breakdown</h4>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Classical baseline (~ES256 only)</span>
                <span className="font-mono text-foreground">~{ES256_INFO.sigBytes! + 200} B</span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className="bg-warning/60 h-3 rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, ((ES256_INFO.sigBytes! + 200) / totalSize) * 100)}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">
                  {selectedApproach === 'nested'
                    ? 'Nested Hybrid (ES256 + ML-DSA-65)'
                    : 'Composite ML-DSA-65-Ed25519'}
                </span>
                <span className="font-mono text-foreground">
                  {totalSize.toLocaleString()} chars ({(totalSize / 1024).toFixed(1)} KB)
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className="bg-success/60 h-3 rounded-full transition-all"
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Educational note */}
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <p className="text-xs text-muted-foreground">
          <strong>Key insight:</strong> Neither approach lets an unmodified classical verifier
          accept the token on its own. Nested mode can serve one only if a gateway or protocol you
          define unwraps the inner JWT, and that path carries no PQC protection, so it must be
          retired on a schedule. Composite mode needs every verifier upgraded to
          draft-ietf-jose-pq-composite-sigs, but yields one token (
          {MLDSA65_INFO.sigBytes!.toLocaleString()} B ML-DSA-65 + 64 B Ed25519 signature) that stays
          secure while either algorithm holds. Either way, the verifier&apos;s algorithm allowlist
          is what stops a downgrade to the classical-only path.
        </p>
      </div>
    </div>
  )
}
