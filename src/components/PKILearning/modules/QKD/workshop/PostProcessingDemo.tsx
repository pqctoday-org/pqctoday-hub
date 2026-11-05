// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useCallback } from 'react'
import { Play, CheckCircle2, Hash, Key, Shield } from 'lucide-react'
import {
  runFullProtocol,
  getFinalKey,
  bitsToHex,
  type BB84SimulationState,
  type BitValue,
} from '../services/BB84Service'
import { Button } from '@/components/ui/button'

type PostProcessingStep =
  | 'generate'
  | 'error-estimation'
  | 'error-correction'
  | 'privacy-amplification'
  | 'hybrid-derivation'

const STEPS: { id: PostProcessingStep; label: string; icon: React.ElementType }[] = [
  { id: 'generate', label: 'Generate Sifted Key', icon: Key },
  { id: 'error-estimation', label: 'Error Estimation', icon: Shield },
  { id: 'error-correction', label: 'Parity Illustration', icon: CheckCircle2 },
  { id: 'privacy-amplification', label: 'SHA-256 Illustration', icon: Hash },
  { id: 'hybrid-derivation', label: 'Sample HKDF Derivation', icon: Key },
]

function arrayBufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export const PostProcessingDemo: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0)
  const [bb84State, setBB84State] = useState<BB84SimulationState | null>(null)
  const [finalKey, setFinalKey] = useState<BitValue[]>([])
  const [correctedKey, setCorrectedKey] = useState<BitValue[]>([])
  const [amplifiedKeyHex, setAmplifiedKeyHex] = useState<string>('')
  const [hybridKeyHex, setHybridKeyHex] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorsCorrected, setErrorsCorrected] = useState(0)

  // Step 1: Generate a sifted key from BB84
  const handleGenerateKey = useCallback(() => {
    // 64 qubits, no Eve, 100% intercept (ignored), 5% channel noise
    const result = runFullProtocol(64, false, 1.0, 0.05)
    setBB84State(result)
    const key = getFinalKey(result)
    setFinalKey(key)
    setCurrentStep(1)
  }, [])

  // Step 2: Error estimation (already done in BB84 protocol)
  const handleErrorEstimation = useCallback(() => {
    setCurrentStep(2)
  }, [])

  // Step 3: Count odd-parity blocks and copy the sample without changing bits.
  const handleErrorCorrection = useCallback(() => {
    if (finalKey.length === 0) return
    // This display does not compare Alice and Bob or locate/correct bit errors.
    const corrected = [...finalKey]
    let corrections = 0

    // Simulate parity-check blocks of size 4
    for (let i = 0; i < corrected.length; i += 4) {
      const block = corrected.slice(i, Math.min(i + 4, corrected.length))
      const parity = block.reduce((acc, bit) => acc ^ bit, 0 as number)
      // Count odd-parity blocks; do not label them as corrected bit errors.
      if (parity === 1 && block.length === 4) {
        // No error location or bit flipping is performed.
        corrections++
      }
    }

    setCorrectedKey(corrected)
    setErrorsCorrected(corrections)
    setCurrentStep(3)
  }, [finalKey])

  // Step 4: Sample SHA-256 digest; not a QKD privacy-amplification proof.
  const handlePrivacyAmplification = useCallback(async () => {
    if (correctedKey.length === 0) return
    setIsProcessing(true)

    // Convert bits to bytes for hashing
    const keyBytes = new Uint8Array(Math.ceil(correctedKey.length / 8))
    correctedKey.forEach((bit, i) => {
      if (bit) {
        keyBytes[Math.floor(i / 8)] |= 1 << (7 - (i % 8))
      }
    })

    // Compute a fixed-size digest; this can be longer than the sample input.
    const hashBuffer = await crypto.subtle.digest('SHA-256', keyBytes)
    const hex = arrayBufferToHex(hashBuffer)
    setAmplifiedKeyHex(hex)
    setIsProcessing(false)
    setCurrentStep(4)
  }, [correctedKey])

  // Step 5: Illustrate HKDF using the digest and random placeholder input.
  const handleHybridDerivation = useCallback(async () => {
    if (!amplifiedKeyHex) return
    setIsProcessing(true)

    // Random placeholder only: no ML-KEM operation is executed.
    const mlkemSecret = new Uint8Array(32)
    crypto.getRandomValues(mlkemSecret)

    // Convert the sample digest from hex to bytes.
    const qkdBytes = new Uint8Array(32)
    for (let i = 0; i < 32; i++) {
      qkdBytes[i] = parseInt(amplifiedKeyHex.slice(i * 2, i * 2 + 2), 16)
    }

    // Combine: sample digest || random placeholder.
    const combined = new Uint8Array(64)
    combined.set(qkdBytes)
    combined.set(mlkemSecret, 32)

    // HKDF with SHA-256 through Web Crypto.
    const keyMaterial = await crypto.subtle.importKey('raw', combined, 'HKDF', false, [
      'deriveBits',
    ])

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'HKDF',
        hash: 'SHA-256',
        salt: new Uint8Array(32), // zero salt for demo
        info: new TextEncoder().encode('qkd-hybrid-key'),
      },
      keyMaterial,
      256 // 256 bits output
    )

    setHybridKeyHex(arrayBufferToHex(derivedBits))
    setIsProcessing(false)
    setCurrentStep(5)
  }, [amplifiedKeyHex])

  const stepHandlers = [
    handleGenerateKey,
    handleErrorEstimation,
    handleErrorCorrection,
    handlePrivacyAmplification,
    handleHybridDerivation,
  ]

  return (
    <div className="space-y-6">
      <div
        role="note"
        className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground"
      >
        This post-processing illustration counts block parities, copies one sample bit string,
        hashes it and combines the digest with random placeholder bytes using HKDF. It does not
        reconcile Alice’s and Bob’s keys, execute ML-KEM or establish a secure QKD key.
      </div>
      {/* Step Progress */}
      <div className="flex flex-wrap gap-2">
        {STEPS.map((step, idx) => {
          const Icon = step.icon
          return (
            <div
              key={step.id}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border transition-colors ${
                idx === currentStep
                  ? 'bg-primary/10 border-primary/30 text-primary font-bold'
                  : idx < currentStep
                    ? 'bg-success/10 border-success/30 text-success'
                    : 'bg-muted border-border text-muted-foreground'
              }`}
            >
              <Icon size={12} />
              {step.label}
            </div>
          )
        })}
      </div>

      {/* Step Content */}
      <div className="space-y-4">
        {/* Step 1: Generate */}
        {currentStep === 0 && (
          <div className="bg-muted/30 rounded-lg p-4 border border-border">
            <h3 className="text-sm font-bold text-foreground mb-2">Generate Sifted Key via BB84</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Run BB84 with 64 qubits (no eavesdropper) to produce a sifted key for post-processing.
            </p>
            <Button
              variant="gradient"
              onClick={stepHandlers[0]}
              className="px-4 py-2 font-bold rounded text-sm transition-colors flex items-center gap-2"
            >
              <Play size={14} /> Generate Sifted Key
            </Button>
          </div>
        )}

        {/* Step 2: Error Estimation */}
        {currentStep === 1 && bb84State && (
          <div className="bg-muted/30 rounded-lg p-4 border border-border space-y-3">
            <h3 className="text-sm font-bold text-foreground">Error Estimation</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-background rounded p-3 border border-border">
                <div className="text-xs text-muted-foreground">Sifted Key Length</div>
                <div className="text-lg font-bold text-foreground">{finalKey.length} bits</div>
              </div>
              <div className="bg-background rounded p-3 border border-border">
                <div className="text-xs text-muted-foreground">QBER (sampled)</div>
                <div className="text-lg font-bold text-success">
                  {bb84State.qber !== null ? `${(bb84State.qber * 100).toFixed(1)}%` : 'N/A'}
                </div>
              </div>
              <div className="bg-background rounded p-3 border border-border">
                <div className="text-xs text-muted-foreground">Interpretation</div>
                <div className="text-sm font-medium text-foreground">Sample statistic only</div>
              </div>
            </div>
            <div className="bg-background rounded p-3 border border-border">
              <div className="text-xs text-muted-foreground mb-1">Sifted Key (hex)</div>
              <code className="text-xs font-mono text-foreground break-all">
                {bitsToHex(finalKey)}
              </code>
            </div>
            <Button
              variant="gradient"
              onClick={stepHandlers[1]}
              className="px-4 py-2 font-bold rounded text-sm transition-colors flex items-center gap-2"
            >
              <Play size={14} /> Continue to Parity Illustration
            </Button>
          </div>
        )}

        {/* Step 3: Error Correction */}
        {currentStep === 2 && (
          <div className="bg-muted/30 rounded-lg p-4 border border-border space-y-3">
            <h3 className="text-sm font-bold text-foreground">
              Parity Illustration — No Error Correction
            </h3>
            <p className="text-xs text-muted-foreground">
              This sample counts odd-parity blocks of four bits and copies the input unchanged. It
              does not compare Alice’s and Bob’s bit strings, locate erroneous bits or run a
              reconciliation protocol. Odd parity alone does not identify a bit error.
            </p>
            <div className="bg-background rounded p-3 border border-border">
              <div className="text-xs text-muted-foreground mb-2">Parity Check Blocks</div>
              <div className="flex flex-wrap gap-1">
                {Array.from({ length: Math.ceil(finalKey.length / 4) }).map((_, blockIdx) => {
                  const block = finalKey.slice(blockIdx * 4, blockIdx * 4 + 4)
                  const parity = block.reduce((acc, b) => acc ^ b, 0 as number)
                  return (
                    <div
                      key={blockIdx}
                      className={`px-2 py-1 text-xs font-mono rounded border ${
                        parity === 0
                          ? 'bg-success/10 border-success/30 text-success'
                          : 'bg-warning/10 border-warning/30 text-warning'
                      }`}
                    >
                      {block.join('')} {parity === 0 ? '✓' : '⚠'}
                    </div>
                  )
                })}
              </div>
            </div>
            <Button
              variant="gradient"
              onClick={stepHandlers[2]}
              className="px-4 py-2 font-bold rounded text-sm transition-colors flex items-center gap-2"
            >
              <Play size={14} /> Count Parities and Copy Sample
            </Button>
          </div>
        )}

        {/* Step 4: Privacy Amplification */}
        {currentStep === 3 && (
          <div className="bg-muted/30 rounded-lg p-4 border border-border space-y-3">
            <h3 className="text-sm font-bold text-foreground">
              SHA-256 Output Illustration — No Privacy-Amplification Proof
            </h3>
            <p className="text-xs text-muted-foreground">
              The previous step counted {errorsCorrected} odd-parity blocks and copied the sample
              unchanged. This step computes a 256-bit SHA-256 digest, even when the input is
              shorter. It does not calculate a secret-key length or establish that an eavesdropper’s
              information has been removed.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-background rounded p-3 border border-border">
                <div className="text-xs text-muted-foreground mb-1">
                  Input: Unchanged Sample ({correctedKey.length} bits)
                </div>
                <code className="text-xs font-mono text-foreground break-all">
                  {bitsToHex(correctedKey)}
                </code>
              </div>
              <div className="bg-background rounded p-3 border border-border flex items-center justify-center">
                <div className="text-center">
                  <Hash size={24} className="text-primary mx-auto mb-1" />
                  <div className="text-xs text-muted-foreground">Digest Calculation (SHA-256)</div>
                </div>
              </div>
            </div>
            <Button
              variant="gradient"
              onClick={stepHandlers[3]}
              disabled={isProcessing}
              className="px-4 py-2 font-bold rounded text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Play size={14} /> {isProcessing ? 'Hashing...' : 'Calculate Sample Digest'}
            </Button>
          </div>
        )}

        {/* Step 5: Hybrid Key Derivation */}
        {currentStep === 4 && (
          <div className="bg-muted/30 rounded-lg p-4 border border-border space-y-3">
            <h3 className="text-sm font-bold text-foreground">
              Sample HKDF Derivation with Placeholder Input
            </h3>
            <p className="text-xs text-muted-foreground">
              Combine the sample digest with 32 random placeholder bytes using HKDF. No ML-KEM key
              pair, encapsulation or decapsulation is executed, and this output does not establish a
              secure hybrid construction.
            </p>
            <div className="bg-background rounded p-3 border border-border">
              <div className="text-xs text-muted-foreground mb-1">
                Sample Digest (SHA-256 output, 256 bits)
              </div>
              <code className="text-xs font-mono text-primary break-all">{amplifiedKeyHex}</code>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <span>Sample Digest</span> + <span>Random Placeholder</span> &rarr;{' '}
              <span className="text-primary font-bold">HKDF</span>
            </div>
            <Button
              variant="gradient"
              onClick={stepHandlers[4]}
              disabled={isProcessing}
              className="px-4 py-2 font-bold rounded text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Key size={14} /> {isProcessing ? 'Deriving...' : 'Derive Sample HKDF Output'}
            </Button>
          </div>
        )}

        {/* Final Result */}
        {currentStep === 5 && (
          <div className="bg-success/5 rounded-lg p-4 border border-success/20 space-y-3">
            <h3 className="text-sm font-bold text-success flex items-center gap-2">
              <Shield size={16} /> Sample HKDF Output Calculated
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <div className="bg-background rounded p-3 border border-border">
                <div className="text-xs text-muted-foreground mb-1">
                  Sample Digest (not a verified QKD secret)
                </div>
                <code className="text-xs font-mono text-foreground break-all">
                  {amplifiedKeyHex}
                </code>
              </div>
              <div className="bg-background rounded p-3 border border-border">
                <div className="text-xs text-muted-foreground mb-1">
                  Sample HKDF Output (256 bits)
                </div>
                <code className="text-xs font-mono text-success break-all">{hybridKeyHex}</code>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              The output demonstrates the data flow only. When evaluating production QKD tools, look
              for reconciliation and key confirmation, leakage accounting and a documented
              privacy-amplification security analysis. See{' '}
              <a
                href="https://www.etsi.org/deliver/etsi_gs/qkd/001_099/005/01.01.01_60/gs_qkd005v010101p.pdf"
                target="_blank"
                rel="noreferrer"
                className="text-primary underline"
              >
                ETSI GS QKD 005, sections 4.7.3–4.7.5
              </a>
              . A sample hash or HKDF result is not evidence that those capabilities worked.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
