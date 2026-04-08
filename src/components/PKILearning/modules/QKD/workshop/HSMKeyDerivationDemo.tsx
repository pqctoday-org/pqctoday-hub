// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useCallback } from 'react'
import { Play, ExternalLink, CheckCircle2, Lock, Key, Cpu, Zap } from 'lucide-react'
import { KatValidationPanel } from '@/components/shared/KatValidationPanel'
import type { KatTestSpec } from '@/utils/katRunner'
import { useHSM } from '@/hooks/useHSM'
import { LiveHSMToggle } from '@/components/shared/LiveHSMToggle'
import { Pkcs11LogPanel } from '@/components/shared/Pkcs11LogPanel'
import { HsmKeyInspector } from '@/components/shared/HsmKeyInspector'

const QKD_KAT_SPECS: KatTestSpec[] = [
  {
    id: 'qkd-hmac-sha256',
    useCase: 'Underlying PRF validation (HMAC-SHA256)',
    standard: 'FIPS 198-1',
    referenceUrl: 'https://csrc.nist.gov/pubs/fips/198/1/final',
    kind: { type: 'hmac-verify', hashAlg: 'SHA-256' },
  },
  {
    id: 'qkd-hkdf',
    useCase: 'Key derivation functional testing (HKDF)',
    standard: 'SP 800-108 + RFC 5869',
    referenceUrl: 'https://www.rfc-editor.org/rfc/rfc5869',
    kind: { type: 'hkdf-derive' },
  },
]

type HSMStep = 'idle' | 'qkd-fetch' | 'hsm-import' | 'kdf' | 'session-key' | 'use'

interface StepDef {
  id: HSMStep
  label: string
  icon: React.ElementType
}

const STEPS: StepDef[] = [
  { id: 'qkd-fetch', label: 'ETSI QKD 014 Key Retrieval', icon: Key },
  { id: 'hsm-import', label: 'Import into HSM', icon: Lock },
  { id: 'kdf', label: 'SP 800-108 Counter-Mode KDF', icon: Cpu },
  { id: 'session-key', label: 'Session Key Output', icon: CheckCircle2 },
  { id: 'use', label: 'Session Key Use', icon: Zap },
]

function getRandomHex(bytes: number): string {
  const buf = new Uint8Array(bytes)
  crypto.getRandomValues(buf)
  return Array.from(buf)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function getRandomUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

import { hsm_importGenericSecret, hsm_kbkdf } from '../../../../../wasm/softhsm'
import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'

function sp800108CounterKDF(
  M: SoftHSMModule,
  hSession: number,
  keyMaterialHex: string,
  label: string,
  context: string,
  outputBytes: number
): { derivedKeyHex: string; baseKeyHandle: number } {
  const ikm = new Uint8Array(32)
  for (let i = 0; i < 32; i++) ikm[i] = parseInt(keyMaterialHex.slice(i * 2, i * 2 + 2), 16)

  // NIST SP 800-108 fixed input = Label || 0x00 || Context
  const fixedInput = new TextEncoder().encode(`${label}\x00${context}`)

  const baseKeyHandle = hsm_importGenericSecret(M, hSession, ikm)
  // Call HSM C_DeriveKey via CKM_SP800_108_COUNTER_KDF with PRF CKM_SHA256_HMAC (0x251)
  const derived = hsm_kbkdf(M, hSession, baseKeyHandle, 0x00000251, fixedInput, outputBytes)

  return {
    derivedKeyHex: Array.from(derived)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(''),
    baseKeyHandle,
  }
}

interface DemoState {
  keyId: string
  qkdSecret: string
  qkdResponseJson: string
  sessionId: string
  sessionKey: string
}

export const HSMKeyDerivationDemo: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(0) // 0 = not started
  const [state, setState] = useState<Partial<DemoState>>({})
  const [processing, setProcessing] = useState(false)
  const hsm = useHSM()

  // Step 1: Simulate ETSI QKD 014 REST key retrieval
  const handleFetch = useCallback(async () => {
    setProcessing(true)
    await new Promise((r) => setTimeout(r, 600)) // simulate network latency
    const keyId = getRandomUUID()
    const qkdSecret = getRandomHex(32)
    const hexArray = qkdSecret.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
    const base64Key = btoa(String.fromCharCode(...hexArray))
    const qkdResponseJson = JSON.stringify(
      {
        keys: [
          {
            key_ID: keyId,
            key: base64Key,
          },
        ],
      },
      null,
      2
    )
    setState({ keyId, qkdSecret, qkdResponseJson })
    setCurrentStep(1)
    setProcessing(false)
  }, [])

  // Step 2: Import into HSM (conceptual — no actual PKCS#11)
  const handleImport = useCallback(async () => {
    setProcessing(true)
    await new Promise((r) => setTimeout(r, 400))
    setCurrentStep(2)
    setProcessing(false)
  }, [])

  const handleKDF = useCallback(async () => {
    if (!state.qkdSecret) return
    setProcessing(true)
    const sessionId = getRandomHex(16)
    let sessionKey = ''
    if (hsm.isReady && hsm.moduleRef.current) {
      const M = hsm.moduleRef.current as unknown as SoftHSMModule
      const { derivedKeyHex, baseKeyHandle } = sp800108CounterKDF(
        M,
        hsm.hSessionRef.current,
        state.qkdSecret,
        'session-key-v1',
        sessionId,
        32
      )
      sessionKey = derivedKeyHex
      // Note: we don't C_DestroyObject so it stays in the HSMKeyInspector for viewing
      hsm.addKey({
        handle: baseKeyHandle,
        label: 'QKD Imported Master Secret',
        family: 'ml-kem', // conceptual mapping for QKD
        role: 'private',
        generatedAt: new Date().toLocaleTimeString('en-US', { hour12: false }),
      })
    } else {
      // Mock if HSM is disabled
      sessionKey = getRandomHex(32)
    }
    await new Promise((r) => setTimeout(r, 400)) // delay for UI effect
    setState((s) => ({ ...s, sessionId, sessionKey }))
    setCurrentStep(3)
    setProcessing(false)
  }, [state.qkdSecret, hsm])

  // Step 4: Show output (no async needed)
  const handleShowKey = useCallback(() => {
    setCurrentStep(4)
  }, [])

  // Step 5: Show session key use
  const handleShowUse = useCallback(() => {
    setCurrentStep(5)
  }, [])

  const stepHandlers = [handleFetch, handleImport, handleKDF, handleShowKey, handleShowUse]

  const stepCompleted = (idx: number) => currentStep > idx

  return (
    <div className="space-y-6">
      <LiveHSMToggle hsm={hsm} operations={['C_CreateObject', 'C_DeriveKey']} />
      {/* Broader KDF context */}
      <div className="glass-panel p-4">
        <h4 className="text-sm font-bold text-foreground mb-2">
          SP 800-108 Key Derivation — Beyond QKD
        </h4>
        <p className="text-xs text-muted-foreground mb-3">
          NIST SP 800-108 counter-mode KDF is a universal primitive used wherever a master secret
          must produce multiple purpose-specific keys. This demo uses QKD as the input source, but
          the same KDF applies to:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-muted-foreground">
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <span className="font-bold text-foreground block mb-1">KEM Shared Secrets</span>
            ML-KEM encapsulation produces a 32-byte random secret. SP 800-108 derives encryption,
            MAC, and IV keys with domain separation (label + context).
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <span className="font-bold text-foreground block mb-1">Pre-Shared Keys (PSK)</span>
            TLS 1.3 external PSK or IPsec IKEv2 PSK imported into an HSM, then expanded via KBKDF to
            produce per-session traffic keys.
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <span className="font-bold text-foreground block mb-1">Password-Based (PBKDF2)</span>
            CKM_PKCS5_PBKD2 derives key material from passwords. Often chained with SP 800-108 for
            key hierarchy (master → KEK → DEK).
          </div>
        </div>
      </div>

      {/* Header note */}
      <div className="bg-primary/5 border border-primary/20 rounded p-4">
        <p className="text-xs text-muted-foreground">
          <strong>QKD scenario below:</strong> This demo follows the{' '}
          <a
            href="https://www.etsi.org/deliver/etsi_gs/QKD/001_099/014/01.01.01_60/gs_qkd014v010101p.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            ETSI GS QKD 014
          </a>{' '}
          key retrieval API →{' '}
          <a
            href="https://docs.oasis-open.org/pkcs11/pkcs11-curr/v3.0/os/pkcs11-curr-v3.0-os.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            PKCS#11 v3.0
          </a>{' '}
          HSM import →{' '}
          <a
            href="https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-108r1.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            NIST SP 800-108
          </a>{' '}
          counter-mode KDF pipeline. Both Alice and Bob run identical steps independently — the
          session key is <strong>never transmitted</strong>.
        </p>
      </div>

      {/* Step progress pills */}
      <div className="flex flex-wrap gap-2">
        {STEPS.map((step, idx) => {
          const Icon = step.icon
          return (
            <div
              key={step.id}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border transition-colors ${
                idx + 1 === currentStep
                  ? 'bg-primary/10 border-primary/30 text-primary font-bold'
                  : stepCompleted(idx)
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

      {/* Step 1: QKD 014 Key Retrieval */}
      {currentStep === 0 && (
        <div className="bg-muted/30 rounded-lg p-4 border border-border space-y-3">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Key size={15} className="text-primary" /> Step 1: ETSI QKD 014 REST Key Retrieval
          </h3>
          <div className="bg-background rounded p-3 border border-border">
            <div className="text-xs text-muted-foreground mb-2">
              Simulated REST request (ETSI GS QKD 014 §6.3.1)
            </div>
            <code className="text-xs font-mono text-foreground block">
              GET /api/v1/keys/&#123;SAE_ID&#125;/1
            </code>
            <code className="text-xs font-mono text-foreground block">
              Authorization: Bearer &#123;client_cert&#125;
            </code>
          </div>
          <p className="text-xs text-muted-foreground">
            Both Alice and Bob independently call their local QKD key managers. They request the
            same <code>key_ID</code> — the secret bytes are identical on both sides because they
            were produced by the QKD hardware.
          </p>
          <button
            onClick={stepHandlers[0]}
            disabled={processing}
            className="px-4 py-2 bg-primary text-black font-bold rounded text-sm hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Play size={14} /> {processing ? 'Fetching…' : 'Fetch QKD Key'}
          </button>
        </div>
      )}

      {/* Step 2: HSM Import */}
      {currentStep === 1 && (
        <div className="bg-muted/30 rounded-lg p-4 border border-border space-y-3">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Lock size={15} className="text-primary" /> Step 2: Import into HSM (PKCS#11)
          </h3>
          <div className="bg-background rounded p-3 border border-border">
            <div className="text-xs text-muted-foreground mb-2">
              QKD Manager Response (ETSI GS QKD 014 JSON)
            </div>
            <pre className="text-xs font-mono text-primary overflow-x-auto">
              {state.qkdResponseJson}
            </pre>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-background rounded p-3 border border-border">
              <div className="text-xs text-muted-foreground mb-1">key_ID (UUID)</div>
              <code className="text-xs font-mono text-foreground break-all">{state.keyId}</code>
            </div>
            <div className="bg-background rounded p-3 border border-border">
              <div className="text-xs text-muted-foreground mb-1">QKD Secret (32 bytes)</div>
              <code className="text-xs font-mono text-primary break-all">{state.qkdSecret}</code>
            </div>
          </div>
          {/* HSM boundary illustration */}
          <div className="border-2 border-dashed border-primary/40 rounded-lg p-4 relative">
            <div className="absolute -top-3 left-4 bg-background px-2 text-xs font-bold text-primary">
              HSM Secure Boundary
            </div>
            <div className="bg-background rounded p-3 border border-border text-xs font-mono">
              <div className="text-muted-foreground mb-1">PKCS#11 C_CreateObject()</div>
              <div>CKA_CLASS = CKO_SECRET_KEY</div>
              <div>CKA_KEY_TYPE = CKK_GENERIC_SECRET</div>
              <div>CKA_VALUE = &lt;qkd_secret&gt;</div>
              <div>CKA_SENSITIVE = TRUE</div>
              <div>CKA_EXTRACTABLE = FALSE</div>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Once imported, <code>CKA_EXTRACTABLE = FALSE</code> ensures the raw QKD secret never
              leaves the HSM. Only derived keys can be exported.
            </div>
          </div>
          <button
            onClick={stepHandlers[1]}
            disabled={processing}
            className="px-4 py-2 bg-primary text-black font-bold rounded text-sm hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Lock size={14} /> {processing ? 'Importing…' : 'Import into HSM'}
          </button>
        </div>
      )}

      {/* Step 3: SP 800-108 KDF */}
      {currentStep === 2 && (
        <div className="bg-muted/30 rounded-lg p-4 border border-border space-y-3">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Cpu size={15} className="text-primary" /> Step 3: NIST SP 800-108 Counter-Mode KDF
          </h3>
          <div className="border-2 border-dashed border-primary/40 rounded-lg p-4 relative">
            <div className="absolute -top-3 left-4 bg-background px-2 text-xs font-bold text-primary">
              HSM — PKCS#11 C_DeriveKey()
            </div>
            <div className="bg-background rounded p-3 border border-border text-xs font-mono space-y-1">
              <div className="text-muted-foreground">Mechanism: CKM_SP800_108_COUNTER_KDF</div>
              <div>PRF: CKM_SHA256_HMAC</div>
              <div>KI: &lt;imported_qkd_key_handle&gt;</div>
              <div>Label: &quot;session-key-v1&quot;</div>
              <div>Context: &lt;session_id (16 bytes)&gt;</div>
              <div>L: 256 bits</div>
            </div>
            <div className="mt-3 bg-muted/40 rounded p-3 border border-border">
              <div className="text-xs font-bold text-muted-foreground mb-1">
                SP 800-108 Counter-Mode formula (§5.1)
              </div>
              <code className="text-xs font-mono text-foreground">
                K(i) = PRF(KI, [i]₂ ‖ Label ‖ 0x00 ‖ Context ‖ [L]₂)
              </code>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <a
              href="https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-108r1.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary flex items-center gap-1 hover:underline"
            >
              NIST SP 800-108 Rev.1 <ExternalLink size={11} />
            </a>
            <span className="text-xs text-muted-foreground">—</span>
            <a
              href="https://docs.oasis-open.org/pkcs11/pkcs11-curr/v3.0/os/pkcs11-curr-v3.0-os.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary flex items-center gap-1 hover:underline"
            >
              PKCS#11 v3.0 Mechanisms <ExternalLink size={11} />
            </a>
          </div>
          <button
            onClick={stepHandlers[2]}
            disabled={processing}
            className="px-4 py-2 bg-primary text-black font-bold rounded text-sm hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Cpu size={14} /> {processing ? 'Deriving…' : 'Run KDF'}
          </button>
        </div>
      )}

      {/* Step 4: Session Key Output */}
      {currentStep === 3 && (
        <div className="bg-muted/30 rounded-lg p-4 border border-border space-y-3">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <CheckCircle2 size={15} className="text-primary" /> Step 4: Session Key Output
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Alice side */}
            <div className="border-2 border-dashed border-primary/40 rounded-lg p-4 relative">
              <div className="absolute -top-3 left-4 bg-background px-2 text-xs font-bold text-primary">
                Alice's HSM
              </div>
              <div className="space-y-2">
                <div className="bg-background rounded p-2 border border-border">
                  <div className="text-xs text-muted-foreground mb-1">Session ID (context)</div>
                  <code className="text-xs font-mono text-foreground break-all">
                    {state.sessionId}
                  </code>
                </div>
                <div className="bg-success/10 rounded p-2 border border-success/30">
                  <div className="text-xs text-muted-foreground mb-1">Derived session key</div>
                  <code className="text-xs font-mono text-success break-all">
                    {state.sessionKey}
                  </code>
                </div>
              </div>
            </div>
            {/* Bob side */}
            <div className="border-2 border-dashed border-success/40 rounded-lg p-4 relative">
              <div className="absolute -top-3 left-4 bg-background px-2 text-xs font-bold text-success">
                Bob's HSM
              </div>
              <div className="space-y-2">
                <div className="bg-background rounded p-2 border border-border">
                  <div className="text-xs text-muted-foreground mb-1">
                    Session ID (same context)
                  </div>
                  <code className="text-xs font-mono text-foreground break-all">
                    {state.sessionId}
                  </code>
                </div>
                <div className="bg-success/10 rounded p-2 border border-success/30">
                  <div className="text-xs text-muted-foreground mb-1">Derived session key</div>
                  <code className="text-xs font-mono text-success break-all">
                    {state.sessionKey}
                  </code>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-success/5 rounded p-3 border border-success/20 text-xs text-muted-foreground">
            Both HSMs derive the <strong>identical key</strong> independently. The session key is
            never transmitted over any network. The shared secret was established exclusively via
            the quantum channel.
          </div>
          <button
            onClick={stepHandlers[3]}
            className="px-4 py-2 bg-primary text-black font-bold rounded text-sm hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <Zap size={14} /> See How the Key Is Used
          </button>
        </div>
      )}

      {/* Step 5: Session Key Use */}
      {currentStep === 4 && (
        <div className="bg-muted/30 rounded-lg p-4 border border-border space-y-3">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Zap size={15} className="text-primary" /> Step 5: Session Key Use
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="glass-panel p-3">
              <div className="font-bold text-foreground mb-2">Option A — Bulk Encryption</div>
              <div className="text-muted-foreground space-y-1">
                <div>Algorithm: AES-256-GCM</div>
                <div>Key: &lt;derived session key&gt;</div>
                <div>Nonce: packet sequence number || IV</div>
                <div className="mt-2 text-muted-foreground">
                  Suitable for MACsec link-layer or IPsec ESP payload encryption.
                </div>
              </div>
            </div>
            <div className="glass-panel p-3">
              <div className="font-bold text-foreground mb-2">
                Option B — TLS 1.3 PSK (RFC 9258)
              </div>
              <div className="text-muted-foreground space-y-1">
                <div>Import session key as external PSK</div>
                <div>Bind to: SHA-256, TLS 1.3</div>
                <div>Use in: ClientHello PSK extension</div>
                <div className="mt-2 text-muted-foreground">
                  See Part 4 → TLS 1.3 tab for the full import flow.
                </div>
              </div>
            </div>
          </div>

          <div className="bg-muted/30 rounded p-3 border border-border">
            <div className="text-xs font-bold text-muted-foreground mb-1">Key rotation</div>
            <p className="text-xs text-muted-foreground">
              QKD continuously generates fresh key material. The HSM can be programmed to rotate
              session keys on a schedule (e.g., every 1 hour or every 1 GB of data) by fetching a
              new key_ID from the QKD key manager and repeating the SP 800-108 derivation with an
              incremented context counter. See{' '}
              <a
                href="https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-108r1.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                NIST SP 800-108 §5.1
              </a>
              .
            </p>
          </div>
        </div>
      )}

      {/* Completed summary */}
      {currentStep === 5 && (
        <div className="bg-success/5 rounded-lg p-4 border border-success/20 space-y-3">
          <h3 className="text-sm font-bold text-success flex items-center gap-2">
            <CheckCircle2 size={16} /> HSM Key Derivation Complete
          </h3>
          <div className="grid grid-cols-1 gap-2">
            <div className="bg-background rounded p-3 border border-border text-xs">
              <div className="text-muted-foreground mb-1">key_ID (shared reference)</div>
              <code className="font-mono text-foreground break-all">{state.keyId}</code>
            </div>
            <div className="bg-background rounded p-3 border border-border text-xs">
              <div className="text-muted-foreground mb-1">Session ID (KDF context)</div>
              <code className="font-mono text-foreground break-all">{state.sessionId}</code>
            </div>
            <div className="bg-success/10 rounded p-3 border border-success/30 text-xs">
              <div className="text-muted-foreground mb-1">
                Session key (256 bits, never transmitted)
              </div>
              <code className="font-mono text-success break-all">{state.sessionKey}</code>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Standards used:{' '}
            <a
              href="https://www.etsi.org/deliver/etsi_gs/QKD/001_099/014/01.01.01_60/gs_qkd014v010101p.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              ETSI GS QKD 014
            </a>{' '}
            ·{' '}
            <a
              href="https://docs.oasis-open.org/pkcs11/pkcs11-base/v3.0/os/pkcs11-base-v3.0-os.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              PKCS#11 v3.0
            </a>{' '}
            ·{' '}
            <a
              href="https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-108r1.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              NIST SP 800-108 Rev.1
            </a>
          </p>
          <div className="text-xs font-bold text-success">
            Simulated — for educational purposes only
          </div>
        </div>
      )}

      {/* Run next step */}
      {currentStep > 0 && currentStep < 5 && (
        <button
          onClick={stepHandlers[currentStep]}
          disabled={processing || (!hsm.isReady && currentStep === 2)}
          className="px-4 py-2 bg-primary text-black font-bold rounded text-sm hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <Play size={14} /> {processing ? 'Processing…' : `Run Step ${currentStep + 1}`}
          {!hsm.isReady && currentStep === 2 && ' (Live HSM Required)'}
        </button>
      )}

      <KatValidationPanel
        specs={QKD_KAT_SPECS}
        label="QKD/HSM PQC Known Answer Tests"
        authorityNote="ETSI GS QKD 014 · NIST FIPS 203"
      />

      {/* PKCS#11 Call Log & Key Inspector */}
      {hsm.isReady && (
        <div className="mt-4 space-y-4">
          <Pkcs11LogPanel
            log={hsm.log}
            onClear={hsm.clearLog}
            title="PKCS#11 Call Log"
            filterFns={['C_CreateObject', 'C_DeriveKey']}
          />
          {hsm.keys.length > 0 && (
            <HsmKeyInspector
              keys={hsm.keys}
              moduleRef={hsm.moduleRef}
              hSessionRef={hsm.hSessionRef}
              onRemoveKey={hsm.removeKey}
              title="QKD Imported Secrets"
            />
          )}
        </div>
      )}
    </div>
  )
}
