// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { PenLine, Key, CheckCircle, XCircle, Copy, Check, ShieldCheck } from 'lucide-react'
import { SAMPLE_JWT_PAYLOAD, JOSE_SIGNING_ALGORITHMS } from '../constants'
import {
  bytesToHex,
  generateJwsKeyPair,
  isSoftHsmSupported,
  signJWS,
  toAkpJwk,
  verifyJWS,
  type JwsBackend,
  type JwsKeyPair,
  type SignedJwsResult,
} from '../jwtUtils'
import { KatValidationPanel } from '@/components/shared/KatValidationPanel'
import type { KatTestSpec } from '@/utils/katRunner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useHSM } from '@/hooks/useHSM'
import { LiveHSMToggle } from '@/components/shared/LiveHSMToggle'

const JWT_KAT_SPECS: KatTestSpec[] = [
  {
    id: 'jwt-pqc-sigver',
    useCase: 'PQC JWT access token signing (ML-DSA-65)',
    standard: 'RFC 9500 + FIPS 204',
    referenceUrl: 'https://csrc.nist.gov/pubs/fips/204/final',
    kind: { type: 'mldsa-functional', variant: 65 },
    message: '{"sub":"1234567890","name":"PQC User","iat":1735689600,"alg":"ML-DSA-65"}',
  },
  {
    id: 'jwt-kem-exchange',
    useCase: 'JWE key agreement (ML-KEM-768)',
    standard: 'FIPS 203 ACVP',
    referenceUrl: 'https://csrc.nist.gov/pubs/fips/203/final',
    kind: { type: 'mlkem-encap-roundtrip', variant: 768 },
  },
  {
    id: 'jwt-hmac-integrity',
    useCase: 'HMAC token integrity check',
    standard: 'FIPS 198-1 ACVP',
    referenceUrl:
      'https://github.com/usnistgov/ACVP-Server/tree/master/gen-val/json-files/HMAC-SHA2-256',
    kind: { type: 'hmac-verify', hashAlg: 'SHA-256' },
  },
  {
    id: 'jwt-hmac-generate',
    useCase: 'JWT HS256 MAC generation',
    standard: 'RFC 7519 + FIPS 198-1',
    referenceUrl: 'https://csrc.nist.gov/pubs/fips/198-1/final',
    kind: { type: 'hmac-generate', hashAlg: 'SHA-256' },
  },
]

type SigningAlgorithm =
  | 'ML-DSA-44'
  | 'ML-DSA-65'
  | 'ML-DSA-87'
  | 'SLH-DSA-SHA2-128s'
  | 'SLH-DSA-SHA2-192s'
  | 'SLH-DSA-SHA2-256s'
  | 'ML-DSA-44-ES256'
  | 'ML-DSA-65-ES256'
  | 'ML-DSA-87-ES384'
  | 'ML-DSA-44-Ed25519'
  | 'ML-DSA-65-Ed25519'
  | 'ML-DSA-87-Ed448'

const SIGNABLE_ALGS: { jose: SigningAlgorithm; nistLevel: number; sigBytes: number }[] = [
  { jose: 'ML-DSA-44', nistLevel: 2, sigBytes: 2420 },
  { jose: 'ML-DSA-65', nistLevel: 3, sigBytes: 3309 },
  { jose: 'ML-DSA-87', nistLevel: 5, sigBytes: 4627 },
  { jose: 'SLH-DSA-SHA2-128s', nistLevel: 1, sigBytes: 7856 },
  { jose: 'SLH-DSA-SHA2-192s', nistLevel: 3, sigBytes: 16224 },
  { jose: 'SLH-DSA-SHA2-256s', nistLevel: 5, sigBytes: 29792 },
  { jose: 'ML-DSA-44-ES256', nistLevel: 2, sigBytes: 2484 },
  { jose: 'ML-DSA-65-ES256', nistLevel: 3, sigBytes: 3373 },
  { jose: 'ML-DSA-87-ES384', nistLevel: 5, sigBytes: 4723 },
  { jose: 'ML-DSA-44-Ed25519', nistLevel: 2, sigBytes: 2484 },
  { jose: 'ML-DSA-65-Ed25519', nistLevel: 3, sigBytes: 3373 },
  { jose: 'ML-DSA-87-Ed448', nistLevel: 5, sigBytes: 4741 },
]

const ES256_SIG_BYTES = JOSE_SIGNING_ALGORITHMS.find((a) => a.jose === 'ES256')?.sigBytes ?? 64

export const PQCJWTSigning: React.FC = () => {
  const [selectedAlg, setSelectedAlg] = useState<SigningAlgorithm>('ML-DSA-65')
  const [backend, setBackend] = useState<JwsBackend>('noble')
  const [payloadJson, setPayloadJson] = useState(JSON.stringify(SAMPLE_JWT_PAYLOAD, null, 2))
  const [keypair, setKeypair] = useState<JwsKeyPair | null>(null)
  const [signedJwt, setSignedJwt] = useState<SignedJwsResult | null>(null)
  const [verifyResult, setVerifyResult] = useState<{ valid: boolean; backend: JwsBackend } | null>(
    null
  )
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSigning, setIsSigning] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [showJwk, setShowJwk] = useState(false)

  const hsm = useHSM('rust')

  const isPayloadValid = useMemo(() => {
    try {
      JSON.parse(payloadJson)
      return true
    } catch {
      return false
    }
  }, [payloadJson])

  const reset = useCallback(() => {
    setKeypair(null)
    setSignedJwt(null)
    setVerifyResult(null)
    setError(null)
  }, [])

  // If user toggles to a backend that doesn't support the alg, fall back to noble.
  useEffect(() => {
    if (backend === 'softhsmv3' && !isSoftHsmSupported(selectedAlg)) {
      setBackend('noble')
    }
  }, [backend, selectedAlg])

  const hsmCtx = useMemo(() => {
    if (backend !== 'softhsmv3') return undefined
    if (!hsm.isReady || !hsm.moduleRef.current) return undefined
    return { M: hsm.moduleRef.current, session: hsm.hSessionRef.current }
  }, [backend, hsm.isReady, hsm.moduleRef, hsm.hSessionRef])

  const canUseHsm = backend === 'softhsmv3' && hsm.isReady && hsmCtx !== undefined

  const handleGenerateKeypair = useCallback(async () => {
    setIsGenerating(true)
    setError(null)
    setSignedJwt(null)
    setVerifyResult(null)
    try {
      const kp = await generateJwsKeyPair({
        alg: selectedAlg,
        backend,
        hsm: hsmCtx,
      })
      setKeypair(kp)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setIsGenerating(false)
    }
  }, [selectedAlg, backend, hsmCtx])

  const handleSign = useCallback(async () => {
    if (!keypair) return
    setIsSigning(true)
    setError(null)
    setVerifyResult(null)
    try {
      const claims = JSON.parse(payloadJson) as Record<string, unknown>
      const result = await signJWS({
        alg: selectedAlg,
        payload: claims,
        keyPair: keypair,
        backend,
        hsm: hsmCtx,
      })
      setSignedJwt(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setIsSigning(false)
    }
  }, [keypair, payloadJson, selectedAlg, backend, hsmCtx])

  const handleVerify = useCallback(
    async (verifyBackend: JwsBackend) => {
      if (!signedJwt || !keypair) return
      setIsVerifying(true)
      setError(null)
      try {
        const result = await verifyJWS({
          token: signedJwt.token,
          publicKey: keypair.publicKey,
          backend: verifyBackend,
          hsm: hsmCtx,
        })
        setVerifyResult({ valid: result.valid, backend: verifyBackend })
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e))
        setVerifyResult({ valid: false, backend: verifyBackend })
      } finally {
        setIsVerifying(false)
      }
    },
    [signedJwt, keypair, hsmCtx]
  )

  const handleCopy = useCallback(async () => {
    if (!signedJwt) return
    try {
      await navigator.clipboard.writeText(signedJwt.token)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API may not be available
    }
  }, [signedJwt])

  const tamper = useCallback(() => {
    if (!signedJwt) return
    // Flip a bit in the signature segment so verify must fail.
    const parts = signedJwt.token.split('.')
    const sig = parts[2]
    const flipped = sig.startsWith('A') ? 'B' + sig.slice(1) : 'A' + sig.slice(1)
    setSignedJwt({
      ...signedJwt,
      signatureB64: flipped,
      token: `${parts[0]}.${parts[1]}.${flipped}`,
    })
    setVerifyResult(null)
  }, [signedJwt])

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">Real PQC JWT Signing</h3>
        <p className="text-sm text-muted-foreground">
          Generate a real ML-DSA keypair, sign a JWT over the canonical signing input{' '}
          <code className="text-foreground/80">b64u(header).b64u(payload)</code>, and verify the
          compact JWS — all in your browser. Algorithm codes follow{' '}
          <a
            href="https://www.rfc-editor.org/rfc/rfc9964.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            RFC 9964
          </a>{' '}
          (ML-DSA for JOSE and COSE, published May 2026).
        </p>
      </div>

      {/* Algorithm Selection */}
      <div className="flex flex-wrap gap-2">
        {SIGNABLE_ALGS.map((alg) => (
          <Button
            variant="ghost"
            key={alg.jose}
            onClick={() => {
              setSelectedAlg(alg.jose)
              reset()
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedAlg === alg.jose
                ? 'bg-success/20 text-success border border-success/50'
                : 'bg-muted/50 text-muted-foreground border border-border hover:border-primary/30'
            }`}
          >
            {alg.jose}
            <span className="ml-1 text-[10px] opacity-70">L{alg.nistLevel}</span>
          </Button>
        ))}
      </div>

      {/* Backend selector */}
      <div className="glass-panel p-4">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck size={16} className="text-primary" />
          <h4 className="text-sm font-bold text-foreground">Signing backend</h4>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="ghost"
            onClick={() => {
              setBackend('noble')
              reset()
            }}
            className={`px-3 py-1.5 rounded text-xs font-medium border ${
              backend === 'noble'
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
              reset()
            }}
            disabled={!isSoftHsmSupported(selectedAlg)}
            className={`px-3 py-1.5 rounded text-xs font-medium border disabled:opacity-40 ${
              backend === 'softhsmv3'
                ? 'bg-primary/20 text-primary border-primary/50'
                : 'bg-muted/50 text-muted-foreground border-border hover:border-primary/30'
            }`}
          >
            SoftHSM3 (PKCS#11 v3.2 WASM)
          </Button>
        </div>
        {backend === 'softhsmv3' && (
          <div className="mt-3">
            <LiveHSMToggle
              hsm={hsm}
              operations={['C_GenerateKeyPair', 'C_MessageSignInit', 'C_SignMessage']}
            />
          </div>
        )}
      </div>

      {/* Keypair Generation */}
      <div className="glass-panel p-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Key size={16} className="text-primary" />
            <h4 className="text-sm font-bold text-foreground">Keypair Generation</h4>
          </div>
          <Button
            variant="gradient"
            onClick={() => void handleGenerateKeypair()}
            disabled={isGenerating || (backend === 'softhsmv3' && !canUseHsm)}
            className="px-4 py-2 text-sm font-bold rounded-lg disabled:opacity-50 transition-colors"
          >
            {isGenerating ? 'Generating...' : 'Generate Keypair'}
          </Button>
        </div>

        {keypair && (
          <div className="space-y-3">
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-[10px] font-bold text-primary mb-1">
                Public Key ({keypair.publicKey.length.toLocaleString()} bytes)
              </div>
              <code className="text-[10px] font-mono text-foreground/70 break-all">
                {bytesToHex(keypair.publicKey).substring(0, 192)}
                {keypair.publicKey.length > 96 && '…'}
              </code>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-[10px] font-bold text-secondary mb-1">
                Private Key{' '}
                {keypair.hsmHandles
                  ? `(handle ${keypair.hsmHandles.privHandle} — sealed in SoftHSM3)`
                  : `(${keypair.secretKey.length.toLocaleString()} bytes, in-browser)`}
              </div>
              {!keypair.hsmHandles && (
                <code className="text-[10px] font-mono text-foreground/70 break-all">
                  {bytesToHex(keypair.secretKey).substring(0, 192)}…
                </code>
              )}
            </div>
            {toAkpJwk(keypair) !== null && (
              <div className="bg-muted/50 rounded-lg p-3 border border-border">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="text-[10px] font-bold text-accent">
                    AKP JWK (RFC 9964 §3 — kty=&quot;AKP&quot;)
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => setShowJwk((s) => !s)}
                    className="px-2 py-0.5 text-[10px] rounded border border-border hover:border-primary/30"
                  >
                    {showJwk ? 'Hide JWK' : 'View as JWK'}
                  </Button>
                </div>
                {showJwk && (
                  <>
                    <pre className="text-[10px] font-mono text-foreground/80 bg-background rounded p-2 border border-border overflow-x-auto whitespace-pre-wrap break-all">
                      {JSON.stringify(
                        toAkpJwk(keypair, {
                          includePrivate: !keypair.hsmHandles,
                          kid: `${keypair.alg}-key`,
                        }),
                        null,
                        2
                      )}
                    </pre>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Per RFC 9964 §3, ML-DSA private keys are encoded as the 32-byte FIPS 204
                      KeyGen seed (not the expanded secret key).
                      {keypair.hsmHandles && ' Seed sealed in SoftHSM3 — omitted from JWK above.'}
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        )}
        <p className="mt-3 text-[10px] text-muted-foreground">
          <strong>Scope note:</strong> RFC 9964 §7.2 explicitly excludes HashML-DSA (FIPS 204 §5.4)
          from JOSE/COSE — this workshop only exposes the pure-mode variants accordingly.
        </p>
      </div>

      {/* Payload Editor */}
      <div className="glass-panel p-4">
        <h4 className="text-sm font-bold text-foreground mb-3">JWT Payload (Editable)</h4>
        <Textarea
          value={payloadJson}
          onChange={(e) => {
            setPayloadJson(e.target.value)
            setSignedJwt(null)
            setVerifyResult(null)
          }}
          className={`h-48 text-xs font-mono ${isPayloadValid ? '' : 'border-status-error'}`}
          spellCheck={false}
        />
        {!isPayloadValid && (
          <p className="text-[10px] text-status-error mt-1">
            Invalid JSON. Fix the payload to sign.
          </p>
        )}
      </div>

      {/* Sign Button */}
      <div className="flex justify-center">
        <Button
          variant="gradient"
          onClick={() => void handleSign()}
          disabled={!keypair || !isPayloadValid || isSigning}
          className="px-6 py-3 font-bold rounded-lg disabled:opacity-50 transition-colors flex items-center gap-2"
        >
          <PenLine size={16} />
          {isSigning ? 'Signing...' : `Sign JWT with ${selectedAlg}`}
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg p-3 border border-destructive/50 bg-destructive/10 text-xs text-destructive">
          {error}
        </div>
      )}

      {/* Signed JWT Output */}
      {signedJwt && (
        <div className="glass-panel p-4">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-success" />
              <h4 className="text-sm font-bold text-foreground">Signed JWT</h4>
              <span className="text-[10px] px-2 py-0.5 rounded border font-bold bg-primary/10 text-primary border-primary/30">
                signed via {backend === 'noble' ? 'noble' : 'SoftHSM3'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => void handleCopy()}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>

          {/* Color-coded display */}
          <div className="bg-background rounded-lg p-3 border border-border overflow-x-auto mb-3">
            <code className="text-xs break-all">
              <span className="text-primary">{signedJwt.headerB64}</span>
              <span className="text-muted-foreground font-bold">.</span>
              <span className="text-success">{signedJwt.payloadB64}</span>
              <span className="text-muted-foreground font-bold">.</span>
              <span className="text-destructive">
                {signedJwt.signatureB64.substring(0, 100)}
                {signedJwt.signatureB64.length > 100 && '...'}
              </span>
            </code>
          </div>

          {/* Verify */}
          <div className="flex flex-wrap gap-2 items-center mt-3">
            <Button
              variant="outline"
              onClick={() => void handleVerify('noble')}
              disabled={isVerifying}
              className="text-xs"
            >
              Verify (noble)
            </Button>
            <Button
              variant="outline"
              onClick={() => void handleVerify('softhsmv3')}
              disabled={isVerifying || !canUseHsm || !isSoftHsmSupported(selectedAlg)}
              className="text-xs"
            >
              Verify (SoftHSM3)
            </Button>
            <Button
              variant="ghost"
              onClick={tamper}
              className="text-xs text-muted-foreground hover:text-destructive"
            >
              Tamper signature
            </Button>
            {verifyResult && (
              <span
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded border font-bold ${
                  verifyResult.valid
                    ? 'bg-success/20 text-success border-success/50'
                    : 'bg-destructive/20 text-destructive border-destructive/50'
                }`}
              >
                {verifyResult.valid ? <CheckCircle size={12} /> : <XCircle size={12} />}
                {verifyResult.valid ? 'Signature valid' : 'Signature invalid'} ·{' '}
                {verifyResult.backend}
              </span>
            )}
          </div>

          {/* Size Info */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mt-4">
            <div className="bg-muted/50 rounded p-2 border border-border">
              <div className="text-muted-foreground">Header</div>
              <div className="font-mono font-medium text-foreground">
                {signedJwt.headerB64.length} chars
              </div>
            </div>
            <div className="bg-muted/50 rounded p-2 border border-border">
              <div className="text-muted-foreground">Payload</div>
              <div className="font-mono font-medium text-foreground">
                {signedJwt.payloadB64.length} chars
              </div>
            </div>
            <div className="bg-muted/50 rounded p-2 border border-border">
              <div className="text-muted-foreground">Signature</div>
              <div className="font-mono font-medium text-foreground">
                {signedJwt.signatureB64.length} chars ({signedJwt.signature.length} B)
              </div>
            </div>
            <div className="bg-muted/50 rounded p-2 border border-border">
              <div className="text-muted-foreground">Total</div>
              <div className="font-mono font-medium text-foreground">
                {signedJwt.token.length} chars ({(signedJwt.token.length / 1024).toFixed(1)} KB)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Size Comparison */}
      {signedJwt && (
        <div className="glass-panel p-4">
          <h4 className="text-sm font-bold text-foreground mb-3">
            Size Comparison: ES256 vs {selectedAlg}
          </h4>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">ES256 JWT (estimated)</span>
                <span className="font-mono text-foreground">
                  ~
                  {(
                    signedJwt.headerB64.length +
                    signedJwt.payloadB64.length +
                    Math.ceil((ES256_SIG_BYTES * 4) / 3) +
                    2
                  ).toLocaleString()}{' '}
                  chars
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className="bg-warning/60 h-3 rounded-full transition-all"
                  style={{
                    width: `${Math.max(5, ((signedJwt.headerB64.length + signedJwt.payloadB64.length + Math.ceil((ES256_SIG_BYTES * 4) / 3)) / signedJwt.token.length) * 100)}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">{selectedAlg} JWT (measured)</span>
                <span className="font-mono text-foreground">
                  {signedJwt.token.length.toLocaleString()} chars
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
          <p className="text-[10px] text-muted-foreground mt-2">
            {selectedAlg} signature is {signedJwt.signature.length.toLocaleString()} bytes vs{' '}
            {ES256_SIG_BYTES} bytes for ES256 — a{' '}
            {Math.round(signedJwt.signature.length / ES256_SIG_BYTES)}× increase.
          </p>
        </div>
      )}

      {/* Educational note */}
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <p className="text-xs text-muted-foreground">
          <strong>Educational use only.</strong> The signing input is{' '}
          <code className="text-foreground/80">b64u(JOSE header).b64u(payload)</code> per RFC 7515
          §5.1. Both noble and SoftHSM3 produce byte-identical signatures over the same input — a
          token signed via one backend verifies under the other, demonstrating that RFC 9964
          interoperates across implementations.
        </p>
      </div>

      <KatValidationPanel
        specs={JWT_KAT_SPECS}
        label="API Security JWT Known Answer Tests"
        authorityNote="RFC 9500 · FIPS 203 · FIPS 204"
      />
    </div>
  )
}
