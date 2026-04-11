// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useCallback } from 'react'
import { Layers, ArrowRight, CheckCircle } from 'lucide-react'
import { SAMPLE_JWT_PAYLOAD, JOSE_SIGNING_ALGORITHMS } from '../constants'
import { createJWTHeader, createJWTPayload, simulateBase64url } from '../jwtUtils'
import { Button } from '@/components/ui/button'

type HybridApproach = 'nested' | 'composite'

interface HybridResult {
  approach: HybridApproach
  innerJwt: string
  outerJwt: string
  innerSigLength: number
  outerSigLength: number
  totalSize: number
}

const ES256_INFO = JOSE_SIGNING_ALGORITHMS.find((a) => a.jose === 'ES256')!
const MLDSA65_INFO = JOSE_SIGNING_ALGORITHMS.find((a) => a.jose === 'ML-DSA-65')!

export const HybridJWT: React.FC = () => {
  const [selectedApproach, setSelectedApproach] = useState<HybridApproach>('nested')
  const [result, setResult] = useState<HybridResult | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [step, setStep] = useState(0)

  const handleCreate = useCallback(() => {
    setIsCreating(true)
    setStep(0)

    // Simulate step-by-step creation
    const stepTimings = [400, 800, 1200]
    stepTimings.forEach((time, idx) => {
      setTimeout(() => setStep(idx + 1), time)
    })

    setTimeout(() => {
      const payloadB64 = createJWTPayload(SAMPLE_JWT_PAYLOAD)

      // Inner JWT: ES256
      const innerHeaderB64 = createJWTHeader('ES256')
      const innerSig = simulateBase64url(ES256_INFO.sigBytes!)
      const innerJwt = `${innerHeaderB64}.${payloadB64}.${innerSig}`

      // Outer JWT: ML-DSA-65
      const outerHeaderB64 = createJWTHeader('ML-DSA-65')
      const outerPayloadB64 = createJWTPayload({ jwt: innerJwt })
      const outerSig = simulateBase64url(MLDSA65_INFO.sigBytes!)
      const outerJwt = `${outerHeaderB64}.${outerPayloadB64}.${outerSig}`

      setResult({
        approach: selectedApproach,
        innerJwt,
        outerJwt,
        innerSigLength: innerSig.length,
        outerSigLength: outerSig.length,
        totalSize: outerJwt.length,
      })
      setIsCreating(false)
    }, 1600)
  }, [selectedApproach])

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">Hybrid JWT Creation</h3>
        <p className="text-sm text-muted-foreground">
          During the PQC transition, hybrid JWTs provide backwards compatibility by including both a
          classical and a PQC signature. This ensures tokens remain verifiable by systems that
          haven&apos;t yet upgraded to PQC.
        </p>
      </div>

      {/* Approach Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button
          variant="ghost"
          onClick={() => {
            setSelectedApproach('nested')
            setResult(null)
            setStep(0)
          }}
          className={`text-left p-4 rounded-lg border transition-colors ${
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
            Sign the payload with ES256, then wrap the entire inner JWT as the payload of an outer
            ML-DSA-65-signed JWT. Classical verifiers process the inner JWT; PQC verifiers validate
            the outer.
          </p>
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setSelectedApproach('composite')
            setResult(null)
            setStep(0)
          }}
          className={`text-left p-4 rounded-lg border transition-colors ${
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
            <span className="text-sm font-bold text-foreground">Composite Header</span>
          </div>
          <p className="text-xs text-muted-foreground">
            A single JWT with a composite JOSE header that lists both algorithms. The signature
            field contains both signatures concatenated. Requires draft-ietf-jose-composite support.
          </p>
        </Button>
      </div>

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
              {selectedApproach === 'nested' ? 'ES256 Inner Sign' : 'Create composite header'}
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
              {selectedApproach === 'nested' ? 'ML-DSA-65 Outer Sign' : 'Sign with both algorithms'}
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
      <div className="flex justify-center">
        <Button
          variant="ghost"
          onClick={handleCreate}
          disabled={isCreating}
          className="px-6 py-3 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2"
        >
          <Layers size={16} />
          {isCreating ? 'Creating...' : 'Create Hybrid JWT'}
        </Button>
      </div>

      {/* Result Display */}
      {result && (
        <>
          {/* Inner JWT */}
          <div className="glass-panel p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle size={16} className="text-warning" />
              <h4 className="text-sm font-bold text-foreground">Inner JWT (ES256)</h4>
              <span className="text-[10px] px-2 py-0.5 rounded border font-bold bg-warning/20 text-warning border-warning/50">
                Classical Signature
              </span>
            </div>
            <div className="bg-background rounded-lg p-3 border border-border overflow-x-auto">
              <code className="text-[10px] font-mono text-foreground/70 break-all">
                {result.innerJwt.substring(0, 200)}
                {result.innerJwt.length > 200 && '...'}
              </code>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Size: {result.innerJwt.length} chars | ES256 signature: {result.innerSigLength} chars
              (~{ES256_INFO.sigBytes} bytes)
            </div>
          </div>

          {/* Outer JWT */}
          <div className="glass-panel p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle size={16} className="text-success" />
              <h4 className="text-sm font-bold text-foreground">Outer JWT (ML-DSA-65)</h4>
              <span className="text-[10px] px-2 py-0.5 rounded border font-bold bg-success/20 text-success border-success/50">
                PQC Signature
              </span>
            </div>
            <div className="bg-background rounded-lg p-3 border border-border overflow-x-auto">
              <code className="text-[10px] font-mono text-foreground/70 break-all">
                {result.outerJwt.substring(0, 200)}
                {result.outerJwt.length > 200 && '...'}
              </code>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Size: {result.outerJwt.length} chars | ML-DSA-65 signature: {result.outerSigLength}{' '}
              chars (~{MLDSA65_INFO.sigBytes} bytes)
            </div>
          </div>

          {/* Size Breakdown */}
          <div className="glass-panel p-4">
            <h4 className="text-sm font-bold text-foreground mb-3">Size Breakdown</h4>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Inner JWT (ES256 only)</span>
                  <span className="font-mono text-foreground">
                    {result.innerJwt.length.toLocaleString()} chars
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-3">
                  <div
                    className="bg-warning/60 h-3 rounded-full transition-all"
                    style={{
                      width: `${(result.innerJwt.length / result.totalSize) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Nested Hybrid (ES256 + ML-DSA-65)</span>
                  <span className="font-mono text-foreground">
                    {result.totalSize.toLocaleString()} chars (
                    {(result.totalSize / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-3">
                  <div
                    className="bg-success/60 h-3 rounded-full transition-all"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Overhead from nesting</span>
                  <span className="font-mono text-foreground">
                    +{(result.totalSize - result.innerJwt.length).toLocaleString()} chars
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Nested structure diagram */}
          <div className="glass-panel p-4">
            <h4 className="text-sm font-bold text-foreground mb-3">Nested Token Structure</h4>
            <div className="bg-background rounded-lg p-4 border border-border">
              <div className="border-2 border-success/50 rounded-lg p-3">
                <div className="text-xs font-bold text-success mb-2">Outer JWT (ML-DSA-65)</div>
                <div className="flex flex-wrap gap-1 items-center text-[10px] font-mono mb-2">
                  <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                    {'{"alg":"ML-DSA-65","typ":"JWT"}'}
                  </span>
                  <span className="text-muted-foreground font-bold">.</span>
                </div>
                <div className="border-2 border-warning/50 rounded-lg p-3 ml-4">
                  <div className="text-xs font-bold text-warning mb-2">
                    Outer Payload = Inner JWT (ES256)
                  </div>
                  <div className="flex flex-wrap gap-1 items-center text-[10px] font-mono">
                    <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary">Header</span>
                    <span className="text-muted-foreground font-bold">.</span>
                    <span className="px-1.5 py-0.5 rounded bg-success/10 text-success">Claims</span>
                    <span className="text-muted-foreground font-bold">.</span>
                    <span className="px-1.5 py-0.5 rounded bg-warning/10 text-warning">
                      ES256 Sig ({ES256_INFO.sigBytes} B)
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 items-center text-[10px] font-mono mt-2">
                  <span className="text-muted-foreground font-bold">.</span>
                  <span className="px-1.5 py-0.5 rounded bg-success/10 text-success">
                    ML-DSA-65 Sig ({MLDSA65_INFO.sigBytes?.toLocaleString()} B)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Educational note */}
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <p className="text-xs text-muted-foreground">
          <strong>Key insight:</strong> The nested JWT approach is the most practical hybrid
          strategy today because it works with existing JWT libraries. The outer ML-DSA-65 signature
          protects the entire inner JWT (including its ES256 signature). Classical-only verifiers
          can extract and validate just the inner JWT. PQC-aware verifiers validate the outer
          signature for quantum resistance.
        </p>
      </div>
    </div>
  )
}
