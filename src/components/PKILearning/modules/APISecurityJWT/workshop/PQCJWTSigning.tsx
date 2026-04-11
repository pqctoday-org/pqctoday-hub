// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useCallback, useMemo } from 'react'
import { PenLine, Key, CheckCircle, Copy, Check } from 'lucide-react'
import { SAMPLE_JWT_PAYLOAD, JOSE_SIGNING_ALGORITHMS } from '../constants'
import { createJWTHeader, createJWTPayload, simulateBase64url, simulateHexBytes } from '../jwtUtils'
import { KatValidationPanel } from '@/components/shared/KatValidationPanel'
import type { KatTestSpec } from '@/utils/katRunner'
import { Button } from '@/components/ui/button'

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

type SigningAlgorithm = 'ES256' | 'ML-DSA-44' | 'ML-DSA-65' | 'ML-DSA-87'

const SIGNABLE_ALGORITHMS = JOSE_SIGNING_ALGORITHMS.filter(
  (a): a is (typeof JOSE_SIGNING_ALGORITHMS)[number] & { sigBytes: number } =>
    ['ES256', 'ML-DSA-44', 'ML-DSA-65', 'ML-DSA-87'].includes(a.jose) && a.sigBytes !== undefined
)

interface KeypairState {
  algorithm: string
  publicKeyHex: string
  privateKeyHex: string
  generated: boolean
}

interface SignedJWT {
  token: string
  headerB64: string
  payloadB64: string
  signatureB64: string
  verified: boolean
}

export const PQCJWTSigning: React.FC = () => {
  const [selectedAlg, setSelectedAlg] = useState<SigningAlgorithm>('ML-DSA-65')
  const [payloadJson, setPayloadJson] = useState(JSON.stringify(SAMPLE_JWT_PAYLOAD, null, 2))
  const [keypair, setKeypair] = useState<KeypairState | null>(null)
  const [signedJwt, setSignedJwt] = useState<SignedJWT | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSigning, setIsSigning] = useState(false)
  const [copied, setCopied] = useState(false)

  const algInfo = useMemo(
    () => SIGNABLE_ALGORITHMS.find((a) => a.jose === selectedAlg),
    [selectedAlg]
  )

  const handleGenerateKeypair = useCallback(() => {
    if (!algInfo) return
    setIsGenerating(true)
    setSignedJwt(null)

    // Simulate key generation with a brief delay
    setTimeout(() => {
      setKeypair({
        algorithm: algInfo.jose,
        publicKeyHex: simulateHexBytes(Math.min(algInfo.keyBytes, 64)),
        privateKeyHex: simulateHexBytes(64),
        generated: true,
      })
      setIsGenerating(false)
    }, 500)
  }, [algInfo])

  const handleSign = useCallback(() => {
    if (!keypair || !algInfo) return

    try {
      const claims = JSON.parse(payloadJson) as Record<string, unknown>
      setIsSigning(true)

      setTimeout(() => {
        const headerB64 = createJWTHeader(algInfo.jose)
        const payloadB64 = createJWTPayload(claims)
        const signatureB64 = simulateBase64url(algInfo.sigBytes)

        setSignedJwt({
          token: `${headerB64}.${payloadB64}.${signatureB64}`,
          headerB64,
          payloadB64,
          signatureB64,
          verified: true,
        })
        setIsSigning(false)
      }, 600)
    } catch {
      // Invalid JSON
    }
  }, [keypair, algInfo, payloadJson])

  const handleCopy = async () => {
    if (!signedJwt) return
    try {
      await navigator.clipboard.writeText(signedJwt.token)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API may not be available
    }
  }

  const isPayloadValid = useMemo(() => {
    try {
      JSON.parse(payloadJson)
      return true
    } catch {
      return false
    }
  }, [payloadJson])

  // Compute comparison data for ES256 vs selected algorithm
  const es256Info = SIGNABLE_ALGORITHMS.find((a) => a.jose === 'ES256')

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">Simulated JWT Signing</h3>
        <p className="text-sm text-muted-foreground">
          Select an algorithm, generate a keypair, edit the payload, and sign. The crypto is
          simulated with realistic output sizes to demonstrate the size differences between
          classical and PQC algorithms.
        </p>
      </div>

      {/* Algorithm Selection */}
      <div className="flex flex-wrap gap-2">
        {SIGNABLE_ALGORITHMS.map((alg) => (
          <Button
            variant="ghost"
            key={alg.jose}
            onClick={() => {
              setSelectedAlg(alg.jose as SigningAlgorithm)
              setKeypair(null)
              setSignedJwt(null)
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedAlg === alg.jose
                ? alg.broken
                  ? 'bg-warning/20 text-warning border border-warning/50'
                  : 'bg-success/20 text-success border border-success/50'
                : 'bg-muted/50 text-muted-foreground border border-border hover:border-primary/30'
            }`}
          >
            {alg.jose}
            {alg.nistLevel && <span className="ml-1 text-[10px] opacity-70">L{alg.nistLevel}</span>}
          </Button>
        ))}
      </div>

      {/* Keypair Generation */}
      <div className="glass-panel p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Key size={16} className="text-primary" />
            <h4 className="text-sm font-bold text-foreground">Keypair Generation</h4>
          </div>
          <Button
            variant="ghost"
            onClick={handleGenerateKeypair}
            disabled={isGenerating}
            className="px-4 py-2 bg-primary text-black text-sm font-bold rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {isGenerating ? 'Generating...' : 'Generate Keypair'}
          </Button>
        </div>

        {keypair && (
          <div className="space-y-3">
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-[10px] font-bold text-primary mb-1">
                Public Key ({algInfo?.keyBytes.toLocaleString()} bytes)
              </div>
              <code className="text-[10px] font-mono text-foreground/70 break-all">
                {keypair.publicKeyHex.substring(0, 128)}...
              </code>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-[10px] font-bold text-secondary mb-1">
                Private Key (truncated for display)
              </div>
              <code className="text-[10px] font-mono text-foreground/70 break-all">
                {keypair.privateKeyHex.substring(0, 128)}...
              </code>
            </div>
          </div>
        )}
      </div>

      {/* Payload Editor */}
      <div className="glass-panel p-4">
        <h4 className="text-sm font-bold text-foreground mb-3">JWT Payload (Editable)</h4>
        <textarea
          value={payloadJson}
          onChange={(e) => {
            setPayloadJson(e.target.value)
            setSignedJwt(null)
          }}
          className={`w-full h-48 p-3 rounded-lg bg-background border text-xs font-mono text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 ${
            isPayloadValid ? 'border-border' : 'border-destructive'
          }`}
          spellCheck={false}
        />
        {!isPayloadValid && (
          <p className="text-[10px] text-destructive mt-1">
            Invalid JSON. Fix the payload to sign.
          </p>
        )}
      </div>

      {/* Sign Button */}
      <div className="flex justify-center">
        <Button
          variant="ghost"
          onClick={handleSign}
          disabled={!keypair || !isPayloadValid || isSigning}
          className="px-6 py-3 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2"
        >
          <PenLine size={16} />
          {isSigning ? 'Signing...' : `Sign JWT with ${selectedAlg}`}
        </Button>
      </div>

      {/* Signed JWT Output */}
      {signedJwt && (
        <div className="glass-panel p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-success" />
              <h4 className="text-sm font-bold text-foreground">Signed JWT</h4>
              {signedJwt.verified && (
                <span className="text-[10px] px-2 py-0.5 rounded border font-bold bg-success/20 text-success border-success/50">
                  Signature Valid
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              onClick={handleCopy}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
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

          {/* Size Info */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
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
                {signedJwt.signatureB64.length} chars
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
      {signedJwt && algInfo && es256Info && selectedAlg !== 'ES256' && (
        <div className="glass-panel p-4">
          <h4 className="text-sm font-bold text-foreground mb-3">
            Size Comparison: ES256 vs {selectedAlg}
          </h4>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">ES256 JWT</span>
                <span className="font-mono text-foreground">
                  ~
                  {(
                    signedJwt.headerB64.length +
                    signedJwt.payloadB64.length +
                    Math.ceil((es256Info.sigBytes * 4) / 3) +
                    2
                  ).toLocaleString()}{' '}
                  chars
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className="bg-warning/60 h-3 rounded-full transition-all"
                  style={{
                    width: `${Math.max(5, ((signedJwt.headerB64.length + signedJwt.payloadB64.length + Math.ceil((es256Info.sigBytes * 4) / 3)) / signedJwt.token.length) * 100)}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">{selectedAlg} JWT</span>
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
            {selectedAlg} signature is {algInfo.sigBytes.toLocaleString()} bytes vs{' '}
            {es256Info.sigBytes.toLocaleString()} bytes for ES256 &mdash; a{' '}
            {Math.round(algInfo.sigBytes / es256Info.sigBytes)}x increase.
          </p>
        </div>
      )}

      {/* Educational note */}
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <p className="text-xs text-muted-foreground">
          <strong>Note:</strong> The crypto operations above are simulated with realistic output
          sizes. In production, JWT signing uses the private key to compute a cryptographic
          signature over the header and payload. The JOSE header&apos;s{' '}
          <code className="text-foreground/70">alg</code> field tells the verifier which algorithm
          to use for validation.
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
