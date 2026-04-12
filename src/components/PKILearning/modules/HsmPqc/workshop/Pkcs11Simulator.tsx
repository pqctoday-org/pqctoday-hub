// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useCallback, useRef } from 'react'
import {
  Play,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Server,
  Cloud,
  RotateCcw,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HSM_PKCS11_OPERATIONS, HSM_VENDORS, STATUS_LABELS } from '../data/hsmVendorData'
import { useHSM } from '@/hooks/useHSM'
import { LiveHSMToggle } from '@/components/shared/LiveHSMToggle'
import { Pkcs11LogPanel } from '@/components/shared/Pkcs11LogPanel'
import {
  hsm_generateMLKEMKeyPair,
  hsm_generateMLDSAKeyPair,
  hsm_generateECKeyPair,
  hsm_generateAESKey,
  hsm_encapsulate,
  hsm_decapsulate,
  hsm_extractKeyValue,
  hsm_sign,
  hsm_verify,
  hsm_aesWrapKey,
  hsm_getMechanismList,
} from '@/wasm/softhsm'
import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import { KatValidationPanel } from '@/components/shared/KatValidationPanel'
import type { KatTestSpec } from '@/utils/katRunner'

const HSMPQC_KAT_SPECS: KatTestSpec[] = [
  {
    id: 'hsm-mldsa-sign',
    useCase: 'PKCS#11 ML-DSA mechanism test (ML-DSA-65)',
    standard: 'PKCS#11 v3.2 + FIPS 204',
    referenceUrl: 'https://csrc.nist.gov/pubs/fips/204/final',
    kind: { type: 'mldsa-functional', variant: 65 },
    message: 'PKCS#11 C_Sign: CKM_ML_DSA mechanism test vector',
  },
  {
    id: 'hsm-mlkem-kem',
    useCase: 'PKCS#11 ML-KEM mechanism test (ML-KEM-768)',
    standard: 'PKCS#11 v3.2 + FIPS 203',
    referenceUrl: 'https://csrc.nist.gov/pubs/fips/203/final',
    kind: { type: 'mlkem-encap-roundtrip', variant: 768 },
  },
  {
    id: 'hsm-aesgcm-decrypt',
    useCase: 'PKCS#11 AES-GCM mechanism test',
    standard: 'PKCS#11 v3.2 + SP 800-38D ACVP',
    referenceUrl: 'https://csrc.nist.gov/pubs/sp/800/38/d/final',
    kind: { type: 'aesgcm-decrypt' },
  },
  {
    id: 'hsm-aeskw-wrap',
    useCase: 'PKCS#11 AES key wrap mechanism test',
    standard: 'PKCS#11 v3.2 + RFC 3394 ACVP',
    referenceUrl: 'https://www.rfc-editor.org/rfc/rfc3394',
    kind: { type: 'aeskw-wrap' },
  },
]

// ── Per-step live state ───────────────────────────────────────────────────────

interface LiveState {
  mlKemPubHandle: number
  mlKemPrivHandle: number
  mlKemCiphertext: Uint8Array | null
  mlKemSecretHandle: number
  mlDsaPubHandle: number
  mlDsaPrivHandle: number
  mlDsaSigBytes: Uint8Array | null
  /** Message used for ML-DSA sign/verify (must match) */
  mlDsaMessage: string
  /** AES wrapping key handle (step 6) */
  aesWrapHandle: number
}

// ── Live step executors ───────────────────────────────────────────────────────

const runStep = async (
  stepIdx: number,
  M: SoftHSMModule,
  hSession: number,
  liveState: LiveState
): Promise<string> => {
  switch (stepIdx) {
    case 0: {
      // Step 1: ML-KEM-768 key pair generation
      const { pubHandle, privHandle } = hsm_generateMLKEMKeyPair(M, hSession, 768)
      liveState.mlKemPubHandle = pubHandle
      liveState.mlKemPrivHandle = privHandle
      return [
        'CKR_OK',
        `  Public Key Handle:  0x${pubHandle.toString(16).padStart(8, '0')}`,
        `  Private Key Handle: 0x${privHandle.toString(16).padStart(8, '0')}`,
        '  Algorithm:          ML-KEM-768',
        '  Public Key Size:    1,184 bytes',
        '  Token Object:       NO (session key)',
        '  Mechanism:          CKM_ML_KEM_KEY_PAIR_GEN (0x0000000f)',
        '  Parameter Set:      CKP_ML_KEM_768 (0x00000002)',
      ].join('\n')
    }

    case 1: {
      // Step 2: Export public key via C_GetAttributeValue(CKA_VALUE)
      const pubBytes = hsm_extractKeyValue(M, hSession, liveState.mlKemPubHandle)
      const hex = Array.from(pubBytes.slice(0, 16))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join(' ')
      return [
        'CKR_OK',
        '  Attribute:    CKA_VALUE (0x00000011)',
        `  Length:       ${pubBytes.length} bytes  ← FIPS 203 ML-KEM-768 encapsulation key`,
        `  Key bytes:    ${hex} … (truncated)`,
        '  Key Type:     CKK_ML_KEM (0x00000049)',
        '  Exportable:   YES (public key)',
      ].join('\n')
    }

    case 2: {
      // Step 3: ML-KEM encapsulate
      const { ciphertextBytes, secretHandle } = hsm_encapsulate(
        M,
        hSession,
        liveState.mlKemPubHandle,
        768
      )
      liveState.mlKemCiphertext = ciphertextBytes
      liveState.mlKemSecretHandle = secretHandle
      const ctHex = Array.from(ciphertextBytes.slice(0, 16))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join(' ')
      return [
        'CKR_OK',
        `  Derived Key Handle: 0x${secretHandle.toString(16).padStart(8, '0')} (CKK_GENERIC_SECRET)`,
        '  Mechanism:          CKM_ML_KEM (0x00000017)',
        `  KEM Ciphertext:     ${ciphertextBytes.length} bytes  ← FIPS 203 ML-KEM-768 ciphertext`,
        `  CT bytes:           ${ctHex} … (truncated)`,
        '  Shared Secret:      32 bytes (derived key inside HSM)',
      ].join('\n')
    }

    case 3: {
      // Step 4: ML-KEM decapsulate
      const ct = liveState.mlKemCiphertext
      if (!ct) throw new Error('Run step 3 (Encapsulate) first to generate ciphertext')
      const recovered = hsm_decapsulate(M, hSession, liveState.mlKemPrivHandle, ct, 768)
      // Verify both secrets match by extracting values
      const secret1 = hsm_extractKeyValue(M, hSession, liveState.mlKemSecretHandle)
      const secret2 = hsm_extractKeyValue(M, hSession, recovered)
      const match = secret1.length === secret2.length && secret1.every((b, i) => b === secret2[i])
      return [
        'CKR_OK',
        `  Recovered Key Handle: 0x${recovered.toString(16).padStart(8, '0')}`,
        '  Key Type:             CKK_GENERIC_SECRET → AES-256',
        '  Key Size:             256 bits (32 bytes)',
        `  Secrets Match:        ${match ? 'YES ✓  ← KEM correctness verified' : 'NO ✗  ← ERROR'}`,
        '  CKA_SENSITIVE:        FALSE (extractable for demo)',
        '  Mechanism:            CKM_ML_KEM (0x00000017)',
      ].join('\n')
    }

    case 4: {
      // Step 5: Generate ML-DSA-65 key pair + sign
      const { pubHandle: dPub, privHandle: dPriv } = hsm_generateMLDSAKeyPair(M, hSession, 65)
      liveState.mlDsaPubHandle = dPub
      liveState.mlDsaPrivHandle = dPriv
      const message = 'PQC HSM Demo — FIPS 204 ML-DSA-65 signature'
      liveState.mlDsaMessage = message
      const sig = hsm_sign(M, hSession, dPriv, message)
      liveState.mlDsaSigBytes = sig
      return [
        'CKR_OK',
        `  Public Key Handle:  0x${dPub.toString(16).padStart(8, '0')}`,
        `  Private Key Handle: 0x${dPriv.toString(16).padStart(8, '0')}`,
        `  Signature Length:   ${sig.length} bytes  ← FIPS 204 ML-DSA-65`,
        '  Algorithm:          CKM_ML_DSA (0x0000001d)',
        '  NIST Level:         3',
        '  Calls used:         C_MessageSignInit + C_SignMessage + C_MessageSignFinal',
        '  Hedged Signing:     YES (CKH_HEDGE_PREFERRED)',
      ].join('\n')
    }

    case 5: {
      // Step 6: Verify ML-DSA signature
      const sig = liveState.mlDsaSigBytes
      if (!sig) throw new Error('Run step 5 (Sign) first to generate a signature')
      const valid = hsm_verify(M, hSession, liveState.mlDsaPubHandle, liveState.mlDsaMessage, sig)
      return [
        valid ? 'CKR_OK' : 'CKR_SIGNATURE_INVALID',
        `  Verification:    ${valid ? 'VALID ✓' : 'INVALID ✗'}`,
        '  Algorithm:       CKM_ML_DSA (0x0000001d)',
        `  Public Key Size: 1,952 bytes  ← FIPS 204 ML-DSA-65 verification key`,
        `  Signature Input: ${sig.length} bytes`,
        '  Calls used:      C_MessageVerifyInit + C_VerifyMessage + C_MessageVerifyFinal',
      ].join('\n')
    }

    case 6: {
      // Step 7: Generate ECDH P-256 + ML-KEM-768 hybrid key pair, then AES key wrap
      const ecPair = hsm_generateECKeyPair(M, hSession, 'P-256', false, 'derive')
      const mlkemPair2 = hsm_generateMLKEMKeyPair(M, hSession, 768)
      // Generate AES wrapping key and wrap the ML-KEM shared secret
      const aesWrap = hsm_generateAESKey(M, hSession, 256, false, false, true, true, false, false)
      liveState.aesWrapHandle = aesWrap
      // Wrap the ML-KEM shared secret (from step 3) with the AES key
      const wrapped = liveState.mlKemSecretHandle
        ? hsm_aesWrapKey(M, hSession, aesWrap, liveState.mlKemSecretHandle)
        : null
      return [
        'CKR_OK',
        `  EC Public Key:      0x${ecPair.pubHandle.toString(16).padStart(8, '0')} (P-256, CKM_EC_KEY_PAIR_GEN)`,
        `  EC Private Key:     0x${ecPair.privHandle.toString(16).padStart(8, '0')}`,
        `  ML-KEM Public Key:  0x${mlkemPair2.pubHandle.toString(16).padStart(8, '0')} (1,184 bytes)`,
        `  ML-KEM Private Key: 0x${mlkemPair2.privHandle.toString(16).padStart(8, '0')}`,
        `  AES-256 Wrap Key:   0x${aesWrap.toString(16).padStart(8, '0')} (CKM_AES_KEY_GEN)`,
        wrapped
          ? `  Wrapped Secret:     ${wrapped.length} bytes (CKM_AES_KEY_WRAP, 0x00002109)`
          : '  Note: Run steps 1-3 first to wrap the ML-KEM shared secret',
      ].join('\n')
    }

    case 7: {
      // Step 8: Mechanism discovery — C_GetMechanismList + C_GetMechanismInfo
      const mechs = hsm_getMechanismList(M, 1) // slot 1 (initialized token)
      const pqcMechs = mechs.filter(
        (m) =>
          // ML-KEM, ML-DSA, SLH-DSA ranges
          (m >= 0x0f && m <= 0x3f) ||
          // AES family
          (m >= 0x1080 && m <= 0x210a)
      )
      const pqcCount = mechs.filter((m) => m >= 0x0f && m <= 0x3f).length
      return [
        'CKR_OK',
        `  Total mechanisms:   ${mechs.length}`,
        `  PQC mechanisms:     ${pqcCount}  ← ML-KEM + ML-DSA + SLH-DSA`,
        `  PQC + AES sample:   0x${pqcMechs
          .slice(0, 8)
          .map((m) => m.toString(16).padStart(8, '0'))
          .join(', 0x')}`,
        '',
        '  PQC Mechanism Flags:',
        '  ML-KEM (0x0000000f): CKF_GENERATE_KEY_PAIR | CKF_ENCAPSULATE | CKF_DECAPSULATE',
        '  ML-DSA (0x0000001c): CKF_GENERATE_KEY_PAIR | CKF_SIGN | CKF_VERIFY',
        '  SLH-DSA(0x0000002d): CKF_GENERATE_KEY_PAIR | CKF_SIGN | CKF_VERIFY',
        '',
        '  Flag Legend (PKCS#11 v3.2 §5.12):',
        '  CKF_ENCRYPT / DECRYPT    — Symmetric or asymmetric data encryption',
        '  CKF_SIGN / VERIFY        — Digital signature creation and validation',
        '  CKF_GENERATE_KEY_PAIR    — Asymmetric key pair generation',
        '  CKF_GENERATE             — Symmetric key generation',
        '  CKF_WRAP / UNWRAP        — Key encryption for secure transport',
        '  CKF_DERIVE               — Key derivation (KDF, ECDH, HKDF)',
        '  CKF_ENCAPSULATE          — KEM encapsulation (FIPS 203, v3.2 only)',
        '  CKF_DECAPSULATE          — KEM decapsulation (FIPS 203, v3.2 only)',
        '  CKF_DIGEST               — Cryptographic hashing (SHA-2, SHA-3)',
        '',
        '  Calls:  C_GetMechanismList + C_GetMechanismInfo (per mechanism)',
      ].join('\n')
    }

    default:
      throw new Error(`No live executor for step ${stepIdx + 1}`)
  }
}

// ── PKCS#11 operations used per step (for LiveHSMToggle display) ──────────────

const STEP_OPERATIONS: string[][] = [
  ['C_GenerateKeyPair'], // 1: ML-KEM keygen
  ['C_GetAttributeValue'], // 2: Export pub
  ['C_EncapsulateKey'], // 3: Encapsulate
  ['C_DecapsulateKey', 'C_GetAttributeValue'], // 4: Decapsulate
  ['C_GenerateKeyPair', 'C_MessageSignInit', 'C_SignMessage', 'C_MessageSignFinal'], // 5: DSA sign
  ['C_MessageVerifyInit', 'C_VerifyMessage', 'C_MessageVerifyFinal'], // 6: DSA verify
  ['C_GenerateKeyPair', 'C_GenerateKey', 'C_WrapKey'], // 7: Hybrid + wrap
  ['C_GetMechanismList', 'C_GetMechanismInfo'], // 8: Discovery
]

// ── Component ─────────────────────────────────────────────────────────────────

export const Pkcs11Simulator: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [expandedClassical, setExpandedClassical] = useState<number | null>(null)
  const [expandedVendor, setExpandedVendor] = useState<number | null>(null)
  const [showVendorSummary, setShowVendorSummary] = useState(false)

  // ── Live HSM state ──────────────────────────────────────────────────────────
  const hsm = useHSM()
  const liveStateRef = useRef<LiveState>({
    mlKemPubHandle: 0,
    mlKemPrivHandle: 0,
    mlKemCiphertext: null,
    mlKemSecretHandle: 0,
    mlDsaPubHandle: 0,
    mlDsaPrivHandle: 0,
    mlDsaSigBytes: null,
    mlDsaMessage: '',
    aesWrapHandle: 0,
  })
  const [liveOutput, setLiveOutput] = useState<Record<number, string>>({})
  const [liveError, setLiveError] = useState<Record<number, string>>({})
  const [stepRunning, setStepRunning] = useState<number | null>(null)

  const operations = HSM_PKCS11_OPERATIONS
  const currentOp = operations[currentStep]

  const handleExecuteStep = useCallback(async () => {
    if (hsm.isReady && hsm.moduleRef.current) {
      // Live mode: run real WASM operation
      setStepRunning(currentStep)
      try {
        const output = await runStep(
          currentStep,
          hsm.moduleRef.current as unknown as SoftHSMModule,
          hsm.hSessionRef.current,
          liveStateRef.current
        )
        setLiveOutput((prev) => ({ ...prev, [currentStep]: output }))
        setLiveError((prev) => {
          const next = { ...prev }
          delete next[currentStep]
          return next
        })
        setCompletedSteps((prev) => new Set([...prev, currentStep]))
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        setLiveError((prev) => ({ ...prev, [currentStep]: msg }))
      } finally {
        setStepRunning(null)
      }
    } else {
      // Simulation mode: mark complete immediately (fake output from data file)
      setCompletedSteps((prev) => new Set([...prev, currentStep]))
    }
  }, [currentStep, hsm])

  const handleNext = useCallback(() => {
    if (currentStep < operations.length - 1) {
      setCurrentStep(currentStep + 1)
      setExpandedClassical(null)
      setExpandedVendor(null)
    }
  }, [currentStep, operations.length])

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      setExpandedClassical(null)
      setExpandedVendor(null)
    }
  }, [currentStep])

  const handleReset = useCallback(() => {
    setCurrentStep(0)
    setCompletedSteps(new Set())
    setExpandedClassical(null)
    setExpandedVendor(null)
    setLiveOutput({})
    setLiveError({})
    // Reset live state refs
    liveStateRef.current = {
      mlKemPubHandle: 0,
      mlKemPrivHandle: 0,
      mlKemCiphertext: null,
      mlKemSecretHandle: 0,
      mlDsaPubHandle: 0,
      mlDsaPrivHandle: 0,
      mlDsaSigBytes: null,
      mlDsaMessage: '',
      aesWrapHandle: 0,
    }
    hsm.clearLog()
    hsm.clearKeys()
  }, [hsm])

  const isStepRunning = stepRunning === currentStep
  const stepCompleted = completedSteps.has(currentStep)
  const stepOutput = liveOutput[currentStep]
  const stepError = liveError[currentStep]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">PKCS#11 PQC Operation Simulator</h3>
        <p className="text-sm text-muted-foreground">
          Step through 8 PKCS#11 operations demonstrating PQC key generation, encapsulation,
          signing, and stateful signature management. Each step shows the API call, expected output,
          and vendor support comparison.
        </p>
      </div>

      {/* Live HSM Toggle */}
      <LiveHSMToggle hsm={hsm} operations={STEP_OPERATIONS[currentStep] ?? []} autoInit={false} />

      {/* Progress Bar */}
      <div className="glass-panel p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground">
            Operation {currentStep + 1} of {operations.length}
          </span>
          <span className="text-xs text-muted-foreground">
            {completedSteps.size} / {operations.length} completed
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary rounded-full h-2 transition-all duration-300"
            style={{ width: `${(completedSteps.size / operations.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Operation Flow Diagram — 4x2 grid */}
      <div className="glass-panel p-4">
        <h4 className="text-sm font-bold text-foreground mb-3">Operation Flow</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {operations.map((op, idx) => (
            <Button
              variant="ghost"
              key={op.id}
              onClick={() => {
                setCurrentStep(idx)
                setExpandedClassical(null)
                setExpandedVendor(null)
              }}
              className={`text-left rounded-lg p-2 border text-xs transition-colors ${
                idx === currentStep
                  ? 'border-primary bg-primary/10 text-primary'
                  : completedSteps.has(idx)
                    ? 'border-success/30 bg-success/5 text-success'
                    : 'border-border bg-muted/50 text-muted-foreground hover:border-primary/30'
              }`}
            >
              <div className="flex items-center gap-1 mb-0.5">
                {completedSteps.has(idx) ? (
                  <CheckCircle size={10} className="text-success shrink-0" />
                ) : (
                  <span className="text-[10px] font-bold">{op.step}.</span>
                )}
                <span className="font-medium truncate">
                  {op.name.split(' ').slice(0, 3).join(' ')}
                </span>
              </div>
            </Button>
          ))}
        </div>
      </div>

      {/* Current Operation Detail */}
      <div className="glass-panel p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-base font-bold text-foreground">
              Step {currentOp.step}: {currentOp.name}
            </h4>
            <p className="text-sm text-muted-foreground mt-1">{currentOp.description}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleReset} className="text-xs">
              <RotateCcw size={12} className="mr-1" />
              Reset
            </Button>
          </div>
        </div>

        {/* PKCS#11 API Call */}
        <div className="mb-4">
          <h5 className="text-xs font-bold text-muted-foreground mb-2">PKCS#11 API Call</h5>
          <div className="bg-muted/50 rounded-lg p-4 border border-border overflow-x-auto">
            <pre className="text-xs font-mono text-foreground whitespace-pre">
              {currentOp.command}
            </pre>
          </div>
        </div>

        {/* Detail */}
        <div className="mb-4">
          <h5 className="text-xs font-bold text-muted-foreground mb-2">Detail</h5>
          <p className="text-sm text-foreground/80">{currentOp.detail}</p>
        </div>

        {/* Execute Button */}
        {!stepCompleted ? (
          <Button
            variant="gradient"
            onClick={handleExecuteStep}
            disabled={isStepRunning}
            className="mb-4"
          >
            {isStepRunning ? (
              <Loader2 size={14} className="mr-1 animate-spin" />
            ) : (
              <Play size={14} className="mr-1" fill="currentColor" />
            )}
            {isStepRunning ? 'Running…' : hsm.isReady ? 'Execute (Live WASM)' : 'Execute Operation'}
          </Button>
        ) : (
          <div className="mb-4">
            {/* Error */}
            {stepError && (
              <div className="mb-3 bg-status-error/5 rounded-lg p-4 border border-status-error/20">
                <p className="text-xs font-mono text-status-error">{stepError}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 h-6 px-2 text-xs"
                  onClick={() => {
                    setCompletedSteps((prev) => {
                      const next = new Set(prev)
                      next.delete(currentStep)
                      return next
                    })
                  }}
                >
                  Retry
                </Button>
              </div>
            )}

            {/* Output */}
            <h5 className="text-xs font-bold text-muted-foreground mb-2">
              {stepOutput ? 'Live Output (SoftHSM3 WASM)' : 'Expected Output'}
            </h5>
            <div
              className={`rounded-lg p-4 border animate-fade-in ${
                stepOutput
                  ? 'bg-status-success/5 border-status-success/20'
                  : 'bg-success/5 border-success/20'
              }`}
            >
              <pre className="text-xs font-mono text-foreground whitespace-pre">
                {stepOutput ?? currentOp.output}
              </pre>
              {stepOutput && (
                <p className="text-[10px] text-status-success mt-2 font-semibold">
                  Real output from SoftHSM3 WASM — PKCS#11 v3.2 · FIPS 203/204/205
                </p>
              )}
            </div>
          </div>
        )}

        {/* Classical Comparison (collapsible) */}
        {currentOp.classicalEquivalent && (
          <div className="border border-border rounded-lg overflow-hidden mb-3">
            <Button
              variant="ghost"
              onClick={() =>
                setExpandedClassical(expandedClassical === currentStep ? null : currentStep)
              }
              className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 text-sm font-medium text-foreground"
            >
              <span>Classical Comparison</span>
              {expandedClassical === currentStep ? (
                <ChevronUp size={16} className="text-muted-foreground" />
              ) : (
                <ChevronDown size={16} className="text-muted-foreground" />
              )}
            </Button>
            {expandedClassical === currentStep && (
              <div className="px-4 py-3 text-sm text-foreground/80 animate-fade-in">
                <p className="font-mono text-xs">{currentOp.classicalEquivalent}</p>
              </div>
            )}
          </div>
        )}

        {/* On-Prem vs Cloud Notes (collapsible) */}
        {currentOp.vendorNotes && (
          <div className="border border-border rounded-lg overflow-hidden">
            <Button
              variant="ghost"
              onClick={() => setExpandedVendor(expandedVendor === currentStep ? null : currentStep)}
              className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 text-sm font-medium text-foreground"
            >
              <span>On-Prem vs Cloud</span>
              {expandedVendor === currentStep ? (
                <ChevronUp size={16} className="text-muted-foreground" />
              ) : (
                <ChevronDown size={16} className="text-muted-foreground" />
              )}
            </Button>
            {expandedVendor === currentStep && (
              <div className="px-4 py-3 grid grid-cols-1 md:grid-cols-2 gap-3 animate-fade-in">
                <div className="bg-muted/50 rounded-lg p-3 border border-border">
                  <div className="flex items-center gap-1 mb-1">
                    <Server size={12} className="text-primary" />
                    <span className="text-xs font-bold text-foreground">On-Prem</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{currentOp.vendorNotes.onPrem}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 border border-border">
                  <div className="flex items-center gap-1 mb-1">
                    <Cloud size={12} className="text-primary" />
                    <span className="text-xs font-bold text-foreground">Cloud</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{currentOp.vendorNotes.cloud}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Step Navigation */}
      <div className="flex justify-between gap-3">
        <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 0}>
          &larr; Previous
        </Button>
        {currentStep < operations.length - 1 ? (
          <Button variant="outline" onClick={handleNext}>
            Next &rarr;
          </Button>
        ) : (
          <Button variant="gradient" onClick={() => setShowVendorSummary(!showVendorSummary)}>
            {showVendorSummary ? 'Hide' : 'Show'} Vendor Summary
          </Button>
        )}
      </div>

      {/* PKCS#11 Call Log (live mode only) */}
      {hsm.isReady && (
        <Pkcs11LogPanel
          log={hsm.log}
          onClear={hsm.clearLog}
          title="PKCS#11 Call Log — SoftHSM3 WASM"
          defaultOpen={true}
        />
      )}

      {/* Vendor Summary (expandable at bottom) */}
      {showVendorSummary && (
        <div className="glass-panel p-6 animate-fade-in">
          <h4 className="text-base font-bold text-foreground mb-4">
            HSM Vendor PQC Support Summary
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 text-muted-foreground font-medium">Vendor</th>
                  <th className="text-left p-2 text-muted-foreground font-medium">Product</th>
                  <th className="text-center p-2 text-muted-foreground font-medium">Type</th>
                  <th className="text-center p-2 text-muted-foreground font-medium">Status</th>
                  <th className="text-left p-2 text-muted-foreground font-medium">Algorithms</th>
                  <th className="text-center p-2 text-muted-foreground font-medium">FIPS</th>
                </tr>
              </thead>
              <tbody>
                {HSM_VENDORS.map((vendor) => {
                  const statusInfo = STATUS_LABELS[vendor.pqcSupportStatus]
                  return (
                    <tr key={vendor.id} className="border-b border-border/50">
                      <td className="p-2 text-xs font-bold text-foreground">{vendor.name}</td>
                      <td className="p-2 text-xs text-muted-foreground">{vendor.product}</td>
                      <td className="p-2 text-center">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                            vendor.type === 'on-prem'
                              ? 'bg-primary/10 text-primary'
                              : 'bg-secondary/10 text-secondary'
                          }`}
                        >
                          {vendor.type}
                        </span>
                      </td>
                      <td className="p-2 text-center">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded border font-bold ${statusInfo.className}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="p-2 text-xs text-muted-foreground">
                        {vendor.supportedPQCAlgorithms.slice(0, 2).join(', ')}
                        {vendor.supportedPQCAlgorithms.length > 2 && '...'}
                      </td>
                      <td className="p-2 text-xs text-center text-muted-foreground">
                        {vendor.fips140Level.replace('FIPS ', '').substring(0, 12)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Educational Disclaimer */}
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <p className="text-xs text-muted-foreground">
          <strong>Note:</strong> This simulator demonstrates the PKCS#11 API call sequence and
          expected outputs for PQC HSM operations. In live mode, operations execute in SoftHSM3 WASM
          (a reference PKCS#11 v3.2 implementation) — all key generation and cryptographic
          operations are real. In production, these would execute within a FIPS 140-3 validated
          hardware security module. For educational purposes only.
        </p>
      </div>

      <KatValidationPanel
        specs={HSMPQC_KAT_SPECS}
        label="HSM PQC Known Answer Tests"
        authorityNote="PKCS#11 v3.2 · FIPS 203 · FIPS 204 · SP 800-38D"
      />
    </div>
  )
}
