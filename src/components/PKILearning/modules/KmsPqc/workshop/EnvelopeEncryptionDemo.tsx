// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState } from 'react'
import { ChevronRight, ChevronLeft, CheckCircle, Circle, Lock, Info, Loader2 } from 'lucide-react'
import { ENVELOPE_ENCRYPTION_STEPS } from '../data/kmsConstants'
import { useHSM } from '@/hooks/useHSM'
import { LiveHSMToggle } from '@/components/shared/LiveHSMToggle'
import { Pkcs11LogPanel } from '@/components/shared/Pkcs11LogPanel'
import {
  hsm_generateMLKEMKeyPair,
  hsm_generateAESKey,
  hsm_encapsulate,
  hsm_decapsulate,
  hsm_aesWrapKey,
  hsm_extractKeyValue,
} from '@/wasm/softhsm'

const LIVE_OPERATIONS = [
  'C_GenerateKeyPair',
  'C_GenerateKey',
  'C_EncapsulateKey',
  'C_WrapKey',
  'C_DecapsulateKey',
  'C_GetAttributeValue',
]

export const EnvelopeEncryptionDemo: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())

  // Live HSM mode
  const hsm = useHSM()
  const [liveLines, setLiveLines] = useState<string[]>([])
  const [liveRunning, setLiveRunning] = useState(false)
  const [liveError, setLiveError] = useState<string | null>(null)

  const runLiveDemo = async () => {
    if (!hsm.moduleRef.current) return
    setLiveRunning(true)
    setLiveLines([])
    setLiveError(null)
    hsm.clearLog()

    const addLine = (line: string) => setLiveLines((prev) => [...prev, line])

    try {
      const M = hsm.moduleRef.current
      const hSession = hsm.hSessionRef.current

      // Step 1: Generate ML-KEM-768 KEK pair
      const { pubHandle, privHandle } = hsm_generateMLKEMKeyPair(M, hSession, 768)
      const pubKeyBytes = hsm_extractKeyValue(M, hSession, pubHandle)
      addLine(
        `KEK: C_GenerateKeyPair(CKM_ML_KEM_KEY_PAIR_GEN, CKP_ML_KEM_768)` +
          ` → pub=0x${pubHandle.toString(16).padStart(8, '0')} (${pubKeyBytes.length} B), priv=0x${privHandle.toString(16).padStart(8, '0')}`
      )

      // Step 2: Generate AES-256 DEK
      const dekHandle = hsm_generateAESKey(M, hSession, 256)
      const dekBytes = hsm_extractKeyValue(M, hSession, dekHandle)
      addLine(
        `DEK: C_GenerateKey(CKM_AES_KEY_GEN, 256-bit)` +
          ` → handle=0x${dekHandle.toString(16).padStart(8, '0')} (${dekBytes.length} B)`
      )

      // Step 3: Encapsulate — produces KEM ciphertext + shared secret
      const { ciphertextBytes, secretHandle } = hsm_encapsulate(M, hSession, pubHandle, 768)
      const secretBytes = hsm_extractKeyValue(M, hSession, secretHandle)
      addLine(
        `Encaps: C_EncapsulateKey(CKM_ML_KEM)` +
          ` → ciphertext=${ciphertextBytes.length} B, shared_secret=${secretBytes.length} B`
      )

      // Step 4: Wrap the DEK (wrapping key simulates HKDF(shared_secret) in production)
      const wrapKeyHandle = hsm_generateAESKey(M, hSession, 256)
      const wrappedDek = hsm_aesWrapKey(M, hSession, wrapKeyHandle, dekHandle)
      addLine(
        `Wrap: C_WrapKey(CKM_AES_KEY_WRAP, wrappingKey, dekHandle)` +
          ` → ${wrappedDek.length} B wrapped DEK`
      )
      addLine(`      (In production: wrapping key = HKDF(shared_secret, "kms-envelope-v1"))`)

      // Step 5: Decapsulate — recover shared secret from KEM ciphertext
      const recoveredHandle = hsm_decapsulate(M, hSession, privHandle, ciphertextBytes, 768)
      const recoveredBytes = hsm_extractKeyValue(M, hSession, recoveredHandle)
      const match =
        secretBytes.length === recoveredBytes.length &&
        secretBytes.every((b, i) => b === recoveredBytes[i])
      addLine(
        `Decaps: C_DecapsulateKey(CKM_ML_KEM, privHandle, ciphertext)` +
          ` → ${recoveredBytes.length} B, match=${match ? '✓ YES' : '✗ NO'}`
      )

      addLine(
        `Total stored: KEM ciphertext (${ciphertextBytes.length} B) + wrapped DEK (${wrappedDek.length} B) = ${ciphertextBytes.length + wrappedDek.length} B`
      )
    } catch (e) {
      setLiveError(e instanceof Error ? e.message : String(e))
    } finally {
      setLiveRunning(false)
    }
  }

  const step = ENVELOPE_ENCRYPTION_STEPS[currentStep]

  const markComplete = () => {
    setCompletedSteps((prev) => new Set([...prev, currentStep]))
    if (currentStep < ENVELOPE_ENCRYPTION_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  // Calculate totals for the summary
  const classicalTotalSizes = ['256 B', '256 B', 'N/A', '256 B', '32 B']
  const pqcTotalSizes = ['1,184 B', '1,088 + 32 B', '32 B', '1,128 B', '32 B']

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">Envelope Encryption Demo</h3>
        <p className="text-sm text-muted-foreground">
          Step through the complete envelope encryption flow. Compare how RSA-OAEP directly wraps a
          DEK in one step versus the 3-step ML-KEM process: encapsulate &rarr; KDF &rarr; AES-KW
          wrap.
        </p>
      </div>

      {/* Live HSM Mode */}
      <LiveHSMToggle hsm={hsm} operations={LIVE_OPERATIONS} />

      {hsm.isReady && (
        <div className="glass-panel p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">Run Full ML-KEM Envelope Encryption</p>
            <button
              onClick={runLiveDemo}
              disabled={liveRunning}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary text-black font-bold rounded hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {liveRunning ? (
                <>
                  <Loader2 size={11} className="animate-spin" /> Running…
                </>
              ) : (
                'Execute (Live WASM)'
              )}
            </button>
          </div>

          {liveError && <p className="text-xs text-status-error font-mono">{liveError}</p>}

          {liveLines.length > 0 && (
            <div className="bg-status-success/5 border border-status-success/20 rounded-lg p-3 space-y-1">
              {liveLines.map((line, i) => (
                <p key={i} className="text-xs font-mono text-foreground/80 break-all">
                  {line}
                </p>
              ))}
              <p className="text-[10px] text-muted-foreground pt-1 border-t border-border/30">
                Real output from SoftHSM3 WASM · PKCS#11 v3.2
              </p>
            </div>
          )}

          <Pkcs11LogPanel
            log={hsm.log}
            onClear={hsm.clearLog}
            defaultOpen={true}
            title="PKCS#11 Call Log — Envelope Encryption"
            emptyMessage="Click 'Execute' to run the live envelope encryption flow."
          />
        </div>
      )}

      {/* Step stepper */}
      <div className="overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {ENVELOPE_ENCRYPTION_STEPS.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setCurrentStep(idx)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded text-xs font-medium transition-colors ${
                idx === currentStep
                  ? 'bg-primary/20 text-primary border border-primary/50'
                  : completedSteps.has(idx)
                    ? 'bg-success/10 text-success border border-success/20'
                    : 'bg-muted/50 text-muted-foreground border border-border hover:border-primary/30'
              }`}
            >
              {completedSteps.has(idx) ? <CheckCircle size={12} /> : <Circle size={12} />}
              <span className="hidden sm:inline">Step {s.step}</span>
              <span className="sm:hidden">{s.step}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{
            width: `${(completedSteps.size / ENVELOPE_ENCRYPTION_STEPS.length) * 100}%`,
          }}
        />
      </div>

      {/* Current step detail */}
      {step && (
        <div className="glass-panel p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 rounded-lg bg-primary/10 shrink-0">
              <Lock size={24} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-bold">
                  Step {step.step} of {ENVELOPE_ENCRYPTION_STEPS.length}
                </span>
              </div>
              <h4 className="text-xl font-bold text-foreground">{step.title}</h4>
            </div>
          </div>

          {/* Side-by-side comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {/* Classical side */}
            <div className="bg-destructive/5 rounded-lg p-4 border border-destructive/20">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs px-2 py-0.5 rounded bg-destructive/10 text-destructive border border-destructive/20 font-bold">
                  CLASSICAL
                </span>
                <span className="text-xs text-muted-foreground">RSA-OAEP</span>
              </div>
              <p className="text-xs text-foreground/80 mb-3">{step.classicalDescription}</p>
              <div className="bg-background rounded p-3 border border-border">
                <div className="text-[10px] font-bold text-foreground mb-1">Artifact</div>
                <p className="text-xs text-muted-foreground">{step.classicalArtifact}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[10px] font-bold text-foreground">Size:</span>
                  <span className="text-xs font-mono text-destructive">{step.classicalSize}</span>
                </div>
              </div>
            </div>

            {/* PQC side */}
            <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-bold">
                  PQC
                </span>
                <span className="text-xs text-muted-foreground">ML-KEM-768</span>
              </div>
              <p className="text-xs text-foreground/80 mb-3">{step.pqcDescription}</p>
              <div className="bg-background rounded p-3 border border-border">
                <div className="text-[10px] font-bold text-foreground mb-1">Artifact</div>
                <p className="text-xs text-muted-foreground">{step.pqcArtifact}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[10px] font-bold text-foreground">Size:</span>
                  <span className="text-xs font-mono text-primary">{step.pqcSize}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Context note */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="flex items-start gap-2">
              <Info size={14} className="text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-foreground/80">
                {step.step === 1 &&
                  'ML-KEM-768 encapsulation keys are 4.6x larger than RSA-2048 public keys. This impacts certificate sizes and key distribution bandwidth.'}
                {step.step === 2 &&
                  'RSA-OAEP directly encrypts the DEK in one operation. ML-KEM produces a random shared secret that must be derived into a wrapping key — a fundamental paradigm difference.'}
                {step.step === 3 &&
                  'This KDF step is unique to KEMs. The shared secret from ML-KEM.Encaps() is random, not directly usable as a wrapping key. HKDF provides domain separation and key derivation.'}
                {step.step === 4 &&
                  'AES-256-KW (RFC 3394) wraps the 32-byte DEK. The wrapped output is 40 bytes (8-byte IV + 32-byte wrapped key). Store the KEM ciphertext alongside the wrapped DEK.'}
                {step.step === 5 &&
                  'Both paths recover the same 32-byte DEK. The PQC path has more steps but all happen server-side. The key difference is stored data: 256 bytes (RSA) vs 1,128 bytes (ML-KEM + AES-KW).'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Flow diagram */}
      <div className="glass-panel p-6">
        <h4 className="text-sm font-bold text-foreground mb-3">Envelope Encryption Flow</h4>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Classical flow */}
          <div>
            <div className="text-xs font-bold text-destructive mb-2 text-center">
              Classical (RSA-OAEP)
            </div>
            <div className="space-y-2 text-center">
              {[
                { label: '1. Generate RSA-2048 key pair', active: currentStep === 0 },
                { label: '2. RSA-OAEP encrypt DEK → 256 B', active: currentStep === 1 },
                { label: '3. (skipped)', active: currentStep === 2 },
                { label: '4. (DEK already wrapped)', active: currentStep === 3 },
                { label: '5. RSA decrypt → DEK', active: currentStep === 4 },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded border text-[10px] font-bold transition-colors ${
                    item.active
                      ? 'bg-destructive/20 text-destructive border-destructive/50'
                      : completedSteps.has(idx)
                        ? 'bg-success/10 text-success border-success/20'
                        : 'bg-muted/50 text-muted-foreground border-border'
                  }`}
                >
                  {item.label}
                </div>
              ))}
            </div>
          </div>

          {/* PQC flow */}
          <div>
            <div className="text-xs font-bold text-primary mb-2 text-center">PQC (ML-KEM-768)</div>
            <div className="space-y-2 text-center">
              {[
                { label: '1. Generate ML-KEM-768 key pair', active: currentStep === 0 },
                { label: '2. Encaps → ct + shared secret', active: currentStep === 1 },
                { label: '3. HKDF(ss) → wrapping key', active: currentStep === 2 },
                { label: '4. AES-KW wrap DEK → 1,128 B total', active: currentStep === 3 },
                { label: '5. Decaps → HKDF → unwrap → DEK', active: currentStep === 4 },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded border text-[10px] font-bold transition-colors ${
                    item.active
                      ? 'bg-primary/20 text-primary border-primary/50'
                      : completedSteps.has(idx)
                        ? 'bg-success/10 text-success border-success/20'
                        : 'bg-muted/50 text-muted-foreground border-border'
                  }`}
                >
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Total comparison — shown when all steps complete */}
      {completedSteps.size === ENVELOPE_ENCRYPTION_STEPS.length && (
        <div className="glass-panel p-6 border-success/20 animate-fade-in">
          <h4 className="text-sm font-bold text-foreground mb-3">Size Comparison Summary</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-destructive/5 rounded-lg p-3 border border-destructive/20 text-center">
              <div className="text-lg font-bold text-destructive">256 B</div>
              <div className="text-[10px] text-muted-foreground">RSA-OAEP Total</div>
            </div>
            <div className="bg-primary/5 rounded-lg p-3 border border-primary/20 text-center">
              <div className="text-lg font-bold text-primary">1,128 B</div>
              <div className="text-[10px] text-muted-foreground">ML-KEM Total</div>
            </div>
            <div className="bg-warning/5 rounded-lg p-3 border border-warning/20 text-center">
              <div className="text-lg font-bold text-warning">4.4x</div>
              <div className="text-[10px] text-muted-foreground">Size Increase</div>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-3">
            The 4.4x increase in wrapped key storage is the cost of quantum-safe envelope
            encryption. For most applications, this overhead is manageable. The larger concern is
            the operational complexity of the 3-step KEM flow.
          </p>
        </div>
      )}

      {/* Step-by-step size table */}
      <div className="glass-panel p-6">
        <h4 className="text-sm font-bold text-foreground mb-3">Artifact Sizes by Step</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">Step</th>
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">Operation</th>
                <th className="text-right py-2 px-2 text-muted-foreground font-medium">
                  Classical
                </th>
                <th className="text-right py-2 px-2 text-muted-foreground font-medium">PQC</th>
              </tr>
            </thead>
            <tbody>
              {ENVELOPE_ENCRYPTION_STEPS.map((s, idx) => (
                <tr
                  key={s.id}
                  className={`border-b border-border/50 ${idx === currentStep ? 'bg-primary/5' : ''}`}
                >
                  <td className="py-2 px-2 font-bold text-foreground">{s.step}</td>
                  <td className="py-2 px-2 text-foreground">{s.title}</td>
                  <td className="py-2 px-2 text-right font-mono text-destructive">
                    {classicalTotalSizes[idx]}
                  </td>
                  <td className="py-2 px-2 text-right font-mono text-primary">
                    {pqcTotalSizes[idx]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <button
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          className="flex items-center gap-1 px-4 py-2 text-sm rounded border border-border hover:bg-muted disabled:opacity-50 transition-colors"
        >
          <ChevronLeft size={14} /> Previous
        </button>
        <button
          onClick={markComplete}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-black font-bold rounded hover:bg-primary/90 transition-colors"
        >
          {completedSteps.has(currentStep) ? (
            <>
              <CheckCircle size={14} /> Completed
            </>
          ) : currentStep === ENVELOPE_ENCRYPTION_STEPS.length - 1 ? (
            <>
              Mark Complete <CheckCircle size={14} />
            </>
          ) : (
            <>
              Complete &amp; Next <ChevronRight size={14} />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
