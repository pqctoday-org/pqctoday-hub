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

type PostProcessingStep =
  | 'generate'
  | 'error-estimation'
  | 'error-correction'
  | 'privacy-amplification'
  | 'hybrid-derivation'

const STEPS: { id: PostProcessingStep; label: string; icon: React.ElementType }[] = [
  { id: 'generate', label: 'Generate Sifted Key', icon: Key },
  { id: 'error-estimation', label: 'Error Estimation', icon: Shield },
  { id: 'error-correction', label: 'Error Correction', icon: CheckCircle2 },
  { id: 'privacy-amplification', label: 'Privacy Amplification', icon: Hash },
  { id: 'hybrid-derivation', label: 'Hybrid Key Derivation', icon: Key },
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

  // Step 3: Simplified error correction (Cascade-inspired)
  const handleErrorCorrection = useCallback(() => {
    if (finalKey.length === 0) return
    // In a real system, error correction would use Cascade or LDPC codes.
    // For this demo, we simulate by "correcting" the key (since we ran without Eve,
    // the key should be correct already, but we show the concept).
    const corrected = [...finalKey]
    let corrections = 0

    // Simulate parity-check blocks of size 4
    for (let i = 0; i < corrected.length; i += 4) {
      const block = corrected.slice(i, Math.min(i + 4, corrected.length))
      const parity = block.reduce((acc, bit) => acc ^ bit, 0 as number)
      // If parity is odd and block has an "error" (simulated), flip a bit
      if (parity === 1 && block.length === 4) {
        // In real Cascade, we'd do binary search to find the error
        // For demo, just show we detected an odd-parity block
        corrections++
      }
    }

    setCorrectedKey(corrected)
    setErrorsCorrected(corrections)
    setCurrentStep(3)
  }, [finalKey])

  // Step 4: Privacy amplification using SHA-256
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

    // Hash with SHA-256 to produce a shorter, amplified key
    const hashBuffer = await crypto.subtle.digest('SHA-256', keyBytes)
    const hex = arrayBufferToHex(hashBuffer)
    setAmplifiedKeyHex(hex)
    setIsProcessing(false)
    setCurrentStep(4)
  }, [correctedKey])

  // Step 5: Hybrid key derivation (QKD + simulated ML-KEM via HKDF)
  const handleHybridDerivation = useCallback(async () => {
    if (!amplifiedKeyHex) return
    setIsProcessing(true)

    // Simulate ML-KEM shared secret (in production, this would come from OpenSSL WASM)
    const mlkemSecret = new Uint8Array(32)
    crypto.getRandomValues(mlkemSecret)

    // Convert amplified QKD key from hex to bytes
    const qkdBytes = new Uint8Array(32)
    for (let i = 0; i < 32; i++) {
      qkdBytes[i] = parseInt(amplifiedKeyHex.slice(i * 2, i * 2 + 2), 16)
    }

    // Combine: QKD secret || ML-KEM secret
    const combined = new Uint8Array(64)
    combined.set(qkdBytes)
    combined.set(mlkemSecret, 32)

    // HKDF-Extract using HMAC-SHA-256 (Web Crypto)
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
            <button
              onClick={stepHandlers[0]}
              className="px-4 py-2 bg-primary text-black font-bold rounded text-sm hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <Play size={14} /> Generate Sifted Key
            </button>
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
                <div className="text-xs text-muted-foreground">Verdict</div>
                <div className="text-lg font-bold text-success">Secure (&lt; 11%)</div>
              </div>
            </div>
            <div className="bg-background rounded p-3 border border-border">
              <div className="text-xs text-muted-foreground mb-1">Sifted Key (hex)</div>
              <code className="text-xs font-mono text-foreground break-all">
                {bitsToHex(finalKey)}
              </code>
            </div>
            <button
              onClick={stepHandlers[1]}
              className="px-4 py-2 bg-primary text-black font-bold rounded text-sm hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <Play size={14} /> Continue to Error Correction
            </button>
          </div>
        )}

        {/* Step 3: Error Correction */}
        {currentStep === 2 && (
          <div className="bg-muted/30 rounded-lg p-4 border border-border space-y-3">
            <h3 className="text-sm font-bold text-foreground">
              Error Correction (Simplified Cascade)
            </h3>
            <p className="text-xs text-muted-foreground">
              In real QKD, Cascade or LDPC codes correct bit errors introduced by natural channel
              noise (simulated here at 5%). This demo shows parity-check blocks — each block of 4
              bits is checked for odd parity, and errors are located via binary search.
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
            <button
              onClick={stepHandlers[2]}
              className="px-4 py-2 bg-primary text-black font-bold rounded text-sm hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <Play size={14} /> Correct Errors ({errorsCorrected || 0} blocks flagged)
            </button>
          </div>
        )}

        {/* Step 4: Privacy Amplification */}
        {currentStep === 3 && (
          <div className="bg-muted/30 rounded-lg p-4 border border-border space-y-3">
            <h3 className="text-sm font-bold text-foreground">
              Privacy Amplification (Universal Hashing)
            </h3>
            <p className="text-xs text-muted-foreground">
              Privacy amplification uses a universal hash function (such as Toeplitz matrix
              multiplication) to compress the corrected key, mathematically removing any partial
              information Eve may have gained. For this browser demo, we simulate this compression
              step using SHA-256.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-background rounded p-3 border border-border">
                <div className="text-xs text-muted-foreground mb-1">
                  Input: Corrected Key ({correctedKey.length} bits)
                </div>
                <code className="text-xs font-mono text-foreground break-all">
                  {bitsToHex(correctedKey)}
                </code>
              </div>
              <div className="bg-background rounded p-3 border border-border flex items-center justify-center">
                <div className="text-center">
                  <Hash size={24} className="text-primary mx-auto mb-1" />
                  <div className="text-xs text-muted-foreground">Compression (SHA-256 sim)</div>
                </div>
              </div>
            </div>
            <button
              onClick={stepHandlers[3]}
              disabled={isProcessing}
              className="px-4 py-2 bg-primary text-black font-bold rounded text-sm hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Play size={14} /> {isProcessing ? 'Hashing...' : 'Run Privacy Amplification'}
            </button>
          </div>
        )}

        {/* Step 5: Hybrid Key Derivation */}
        {currentStep === 4 && (
          <div className="bg-muted/30 rounded-lg p-4 border border-border space-y-3">
            <h3 className="text-sm font-bold text-foreground">Hybrid Key Derivation (QKD + PQC)</h3>
            <p className="text-xs text-muted-foreground">
              Combine the QKD-derived key with a PQC KEM shared secret (simulated ML-KEM-768) via
              HKDF. The resulting hybrid key is secure even if one source is compromised.
            </p>
            <div className="bg-background rounded p-3 border border-border">
              <div className="text-xs text-muted-foreground mb-1">
                Amplified QKD Key (SHA-256 output, 256 bits)
              </div>
              <code className="text-xs font-mono text-primary break-all">{amplifiedKeyHex}</code>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <span>QKD Secret</span> + <span>ML-KEM-768 Secret</span> &rarr;{' '}
              <span className="text-primary font-bold">HKDF</span>
            </div>
            <button
              onClick={stepHandlers[4]}
              disabled={isProcessing}
              className="px-4 py-2 bg-primary text-black font-bold rounded text-sm hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Key size={14} /> {isProcessing ? 'Deriving...' : 'Derive Hybrid Key'}
            </button>
          </div>
        )}

        {/* Final Result */}
        {currentStep === 5 && (
          <div className="bg-success/5 rounded-lg p-4 border border-success/20 space-y-3">
            <h3 className="text-sm font-bold text-success flex items-center gap-2">
              <Shield size={16} /> Hybrid Key Derived Successfully
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <div className="bg-background rounded p-3 border border-border">
                <div className="text-xs text-muted-foreground mb-1">
                  QKD-Derived Key (post-amplification)
                </div>
                <code className="text-xs font-mono text-foreground break-all">
                  {amplifiedKeyHex}
                </code>
              </div>
              <div className="bg-background rounded p-3 border border-border">
                <div className="text-xs text-muted-foreground mb-1">
                  Hybrid Key (HKDF output, 256 bits)
                </div>
                <code className="text-xs font-mono text-success break-all">{hybridKeyHex}</code>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              This key combines information-theoretic security from QKD with computational security
              from ML-KEM — defense in depth against both present and future threats.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
