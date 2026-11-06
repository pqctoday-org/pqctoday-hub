// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useCallback, useEffect, useRef } from 'react'
import { Play, ExternalLink, CheckCircle2, Lock, Key, Cpu, Zap, RotateCcw } from 'lucide-react'
import { KatValidationPanel } from '@/components/shared/KatValidationPanel'
import type { KatTestSpec } from '@/utils/katRunner'
import { useHSM, type HsmKey } from '@/hooks/useHSM'
import { LiveHSMToggle } from '@/components/shared/LiveHSMToggle'
import { WasmModeIndicator } from '@/components/shared/WasmModeIndicator'
import { Pkcs11LogPanel } from '@/components/shared/Pkcs11LogPanel'
import { HsmKeyInspector } from '@/components/shared/HsmKeyInspector'
import { Button } from '@/components/ui/button'
import { WhyThisMatters } from '@/components/ui/WhyThisMatters'
import { ScopeTransparencyBanner } from '@/components/ui/ScopeTransparencyBanner'

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
    referenceUrl: '/library?ref=RFC 5869',
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
  { id: 'qkd-fetch', label: 'Local Sample Key Retrieval', icon: Key },
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

interface DemoState {
  keyId: string
  qkdSecret: string
  qkdResponseJson: string
  sessionId: string
  sessionKey: string
  importedHandle?: number // real PKCS#11 handle from C_CreateObject (step 2)
  importWasLive?: boolean // true only after the current session import succeeds
  outputOrigin?: 'live-kbkdf' | 'illustrative-random'
}

export const HSMKeyDerivationDemo: React.FC<{ initialStep?: number }> = ({ initialStep = 0 }) => {
  const [currentStep, setCurrentStep] = useState<number>(initialStep) // 0 = not started
  const [state, setState] = useState<Partial<DemoState>>({})
  const [processing, setProcessing] = useState(false)
  const hsm = useHSM()

  const [operationError, setOperationError] = useState<string | null>(null)
  const busy = useRef(false)
  const mounted = useRef(true)
  const generation = useRef(0)
  const currentHsm = useRef(hsm)
  currentHsm.current = hsm
  const previousMode = useRef({ ready: hsm.isReady, engine: hsm.engine })

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  useEffect(() => {
    if (previousMode.current.ready !== hsm.isReady || previousMode.current.engine !== hsm.engine) {
      generation.current++
      setState((prev) => ({
        ...prev,
        importedHandle: undefined,
        importWasLive: undefined,
        sessionId: undefined,
        sessionKey: undefined,
        outputOrigin: undefined,
      }))
      setCurrentStep((step) => (step > 1 ? 1 : step))
      setOperationError(null)
      previousMode.current = { ready: hsm.isReady, engine: hsm.engine }
    }
  }, [hsm.isReady, hsm.engine])

  const handleReset = useCallback(() => {
    if (busy.current) return
    generation.current++
    setCurrentStep(0)
    setState({})
    setOperationError(null)
  }, [])

  const perform = useCallback(
    async (
      operation: (active: () => boolean) => Promise<{
        next: Partial<DemoState>
        step: number
      }>
    ) => {
      if (busy.current) return
      busy.current = true
      const attempt = ++generation.current
      const selected = currentHsm.current
      const selectedModule = selected.moduleRef.current
      const selectedSession = selected.hSessionRef.current
      const active = () =>
        mounted.current &&
        attempt === generation.current &&
        selected.isReady === currentHsm.current.isReady &&
        selected.engine === currentHsm.current.engine &&
        selectedModule === currentHsm.current.moduleRef.current &&
        selectedSession === currentHsm.current.hSessionRef.current
      setProcessing(true)
      setOperationError(null)
      setState((prev) => ({
        ...prev,
        sessionId: undefined,
        sessionKey: undefined,
        outputOrigin: undefined,
      }))
      try {
        const { next, step } = await operation(active)
        if (active()) {
          setState((prev) => ({ ...prev, ...next }))
          setCurrentStep(step)
        }
      } catch (cause) {
        if (active()) setOperationError(cause instanceof Error ? cause.message : String(cause))
      } finally {
        // Invalidating an attempt does not permit a conflicting backend operation before it settles.
        busy.current = false
        if (mounted.current) setProcessing(false)
      }
    },
    []
  )

  const handleFetch = useCallback(
    () =>
      perform(async (active) => {
        await new Promise((resolve) => setTimeout(resolve, 600))
        if (!active()) throw new Error('Sample attempt changed; retry the step.')
        const keyId = getRandomUUID()
        const qkdSecret = getRandomHex(32)
        const hexArray = qkdSecret.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
        const base64Key = btoa(String.fromCharCode(...hexArray))
        const qkdResponseJson = JSON.stringify(
          { keys: [{ key_ID: keyId, key: base64Key }] },
          null,
          2
        )
        return {
          next: {
            keyId,
            qkdSecret,
            qkdResponseJson,
            importedHandle: undefined,
            importWasLive: undefined,
          },
          step: 1,
        }
      }),
    [perform]
  )

  const handleImport = useCallback(
    () =>
      perform(async (active) => {
        if (!state.qkdSecret) throw new Error('Generate the local sample key first.')
        if (hsm.phase === 'error' || hsm.phase === 'loading')
          throw new Error(
            'The sample HSM is unavailable or still initializing. Retry, or explicitly disable it for an illustration.'
          )
        await new Promise((resolve) => setTimeout(resolve, 300))
        if (!active()) throw new Error('Sample HSM mode changed; repeat import.')
        if (hsm.isReady) {
          if (!hsm.moduleRef.current) throw new Error('The sample HSM session is unavailable.')
          const M = hsm.moduleRef.current as unknown as SoftHSMModule
          const hSession = hsm.hSessionRef.current
          const ikm = new Uint8Array(32)
          for (let i = 0; i < 32; i++)
            ikm[i] = parseInt((state.qkdSecret ?? '').slice(i * 2, i * 2 + 2), 16)
          const handle = hsm_importGenericSecret(M, hSession, ikm)
          hsm.registerKey(M, hSession, {
            handle,
            label: 'QKD Imported Master Secret',
            family: 'ml-kem',
            role: 'private',
            generatedAt: new Date().toLocaleTimeString('en-US', { hour12: false }),
          })
          return { next: { importedHandle: handle, importWasLive: true }, step: 2 }
        }
        return { next: { importedHandle: undefined, importWasLive: false }, step: 2 }
      }),
    [perform, hsm, state.qkdSecret]
  )

  const handleKDF = useCallback(
    () =>
      perform(async (active) => {
        if (!state.qkdSecret) throw new Error('Generate the local sample key first.')
        if (hsm.phase === 'error' || hsm.phase === 'loading')
          throw new Error(
            'The sample HSM is unavailable or still initializing. Retry, or explicitly disable it for an illustration.'
          )
        if (!active()) throw new Error('Sample HSM mode changed; repeat import.')
        const sessionId = getRandomHex(16)
        let sessionKey = ''
        let outputOrigin: DemoState['outputOrigin']
        if (hsm.isReady) {
          if (
            !hsm.moduleRef.current ||
            state.importedHandle === undefined ||
            state.importWasLive !== true
          )
            throw new Error(
              'A successful import into the current sample HSM session is required before derivation.'
            )
          const M = hsm.moduleRef.current as unknown as SoftHSMModule
          const hSession = hsm.hSessionRef.current
          const fixedInput = new TextEncoder().encode(`session-key-v1\x00${sessionId}`)
          // Existing helper expects the SHA-256 hash selector; rejection is an error, never substituted.
          const derived = hsm_kbkdf(M, hSession, state.importedHandle, 0x00000250, fixedInput, 32)
          if (derived.length !== 32)
            throw new Error('The sample derivation did not return the requested 32 bytes.')
          sessionKey = Array.from(derived)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('')
          outputOrigin = 'live-kbkdf'
        } else {
          sessionKey = getRandomHex(32)
          outputOrigin = 'illustrative-random'
        }
        await new Promise((resolve) => setTimeout(resolve, 400))
        return { next: { sessionId, sessionKey, outputOrigin }, step: 3 }
      }),
    [perform, state.qkdSecret, state.importedHandle, state.importWasLive, hsm]
  )

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
      {operationError && (
        <p role="alert" className="text-sm text-status-error">
          Sample operation failed: {operationError} The step remains incomplete; retry when ready.
        </p>
      )}
      <p className="text-xs text-muted-foreground" role="note">
        Local sample workflow: key retrieval is simulated. Successful optional PKCS#11 calls are
        separate from the walkthrough; no QKD network or second peer runs. The sample secret and any
        returned key bytes are visible in browser memory. This is not a non-exportability test.
      </p>
      <ScopeTransparencyBanner
        realOps={[
          'Optional C_DeriveKey call; a failed call has no derived result and returned bytes are displayed in JavaScript',
          'Optional C_CreateObject — sample session secret, sensitive=false and extractable=true',
          'KAT validation: HMAC-SHA-256 and HKDF against FIPS 198-1 / RFC 5869 vectors',
        ]}
        simulatedOps={[
          'ETSI QKD 014 REST key retrieval (network call replaced by local random)',
          'Step 2 illustration when HSM is in software mode',
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <LiveHSMToggle hsm={hsm} operations={['C_CreateObject', 'C_DeriveKey']} />
        <WasmModeIndicator
          isLive={hsm.isReady}
          simulationReason="WASM mode active for SP 800-108 Key Derivation Demo"
        />
      </div>
      {/* Broader KDF context */}
      <div className="glass-panel p-4">
        <h2 className="text-sm font-bold text-foreground mb-2">
          SP 800-108 Key Derivation — Beyond QKD
        </h2>
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
            Protocol-specific PSK processing must follow the agreed profile. A generic KBKDF call is
            not a replacement for a TLS or IKE key schedule.
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <span className="font-bold text-foreground block mb-1">Password-Based (PBKDF2)</span>
            CKM_PKCS5_PBKD2 derives key material from passwords. Often chained with SP 800-108 for
            key hierarchy (master → KEK → DEK).
          </div>
        </div>
      </div>

      {/* KBKDF vs HKDF comparison */}
      <div className="glass-panel p-4">
        <h2 className="text-sm font-bold text-foreground mb-3">
          KBKDF vs HKDF — Choosing the Right KDF
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
            <div className="font-bold text-foreground mb-1.5">KBKDF (SP 800-108 Counter Mode)</div>
            <div className="text-muted-foreground space-y-1">
              <div>
                <span className="font-semibold text-foreground">Where:</span> Inside the HSM —{' '}
                <span className="font-mono">CKM_SP800_108_COUNTER_KDF</span>
              </div>
              <div>
                <span className="font-semibold text-foreground">Input:</span> A single fixed-length
                key handle (e.g., QKD master secret) already in HSM storage
              </div>
              <div>
                <span className="font-semibold text-foreground">Output:</span> One or more
                purpose-specific sub-keys; this sample reads returned bytes into JavaScript
              </div>
              <div>
                <span className="font-semibold text-foreground">Use when:</span> Key hierarchy
                expansion (master → KEK → DEK) must stay within the HSM security boundary
              </div>
            </div>
          </div>
          <div className="bg-muted/50 border border-border rounded-lg p-3">
            <div className="font-bold text-foreground mb-1.5">HKDF (RFC 5869)</div>
            <div className="text-muted-foreground space-y-1">
              <div>
                <span className="font-semibold text-foreground">Where:</span> Software layer or HSM
                via <span className="font-mono">CKM_HKDF_DERIVE</span> (PKCS#11 v3.0)
              </div>
              <div>
                <span className="font-semibold text-foreground">Input:</span> Variable-length IKM +
                optional salt (extract phase), then context info (expand phase)
              </div>
              <div>
                <span className="font-semibold text-foreground">Output:</span> Arbitrary-length OKM;
                each caller context produces independent key material
              </div>
              <div>
                <span className="font-semibold text-foreground">Use when:</span> TLS 1.3 key
                schedule, QUIC, or Signal — where IKM arrives from a DH/KEM exchange in software
              </div>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Both mechanism support and key attributes depend on the actual tool and configuration.
          This sample imports an extractable session secret and reads derived bytes back into
          JavaScript. It does not establish that KBKDF or HKDF keeps keys inside a production HSM.
          Evaluate supported mechanisms, attributes, output policy and failure behavior in your own
          tools.
        </p>
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
          related key-derivation concepts. The network retrieval and second peer are not executed.
          Evaluate mutual authentication, delivered-key correlation, token attributes and actual
          protocol integration with production tools.
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
                    ? 'bg-status-success/10 border-status-success/30 text-status-success'
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
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Key size={15} className="text-primary" /> Step 1: Local Key-Delivery Illustration
          </h2>
          <div className="bg-background rounded p-3 border border-border">
            <div className="text-xs text-muted-foreground mb-2">
              Reference flow — not executed (ETSI GS QKD 014 §§5.1, 5.3–5.4)
            </div>
            <code className="text-xs font-mono text-foreground block">
              POST /api/v1/keys/&#123;slave_SAE_ID&#125;/enc_keys
            </code>
            <code className="text-xs font-mono text-foreground block">
              Peer: POST /api/v1/keys/&#123;master_SAE_ID&#125;/dec_keys with delivered key_IDs
            </code>
          </div>
          <p className="text-xs text-muted-foreground">
            SAE and KME authenticate certificates and identities using mutual TLS before API use. A
            certificate is not an HTTP bearer token. This button only generates local random sample
            bytes and JSON; it contacts no key manager or QKD hardware.
          </p>
          <Button
            variant="gradient"
            onClick={stepHandlers[0]}
            disabled={processing}
            className="px-4 py-2 font-bold rounded text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Play size={14} /> {processing ? 'Fetching…' : 'Fetch QKD Key'}
          </Button>
        </div>
      )}

      {/* Step 2: HSM Import */}
      {currentStep === 1 && (
        <div className="bg-muted/30 rounded-lg p-4 border border-border space-y-3">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Lock size={15} className="text-primary" /> Step 2: Import into HSM (PKCS#11)
          </h2>
          <div className="bg-background rounded p-3 border border-border">
            <div className="text-xs text-muted-foreground mb-2">
              Locally Generated Sample Key Container
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
              Sample Token Call — Browser-Visible Bytes
            </div>
            <div className="bg-background rounded p-3 border border-border text-xs font-mono">
              <div className="text-muted-foreground mb-1">PKCS#11 C_CreateObject()</div>
              <div>CKA_CLASS = CKO_SECRET_KEY</div>
              <div>CKA_KEY_TYPE = CKK_GENERIC_SECRET</div>
              <div>CKA_VALUE = &lt;qkd_secret&gt;</div>
              <div>CKA_SENSITIVE = FALSE</div>
              <div>CKA_EXTRACTABLE = TRUE</div>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              These are the current sample helper attributes, not a non-exportability policy. The
              original sample is already in JavaScript and derived bytes are read back for display.
              Evaluate appropriate attributes and export controls with your production HSM.
            </div>
          </div>
          {state.importWasLive === true && (
            <div className="flex items-center gap-2 text-xs text-status-success font-semibold">
              <CheckCircle2 size={13} />
              Live HSM — C_CreateObject returned CKR_OK · handle stored in HSMKeyInspector
            </div>
          )}
          {state.importWasLive === false && (
            <div className="text-xs text-muted-foreground">
              Illustrative mode — enable Live HSM above to run real C_CreateObject.
            </div>
          )}
          <Button
            variant="gradient"
            onClick={stepHandlers[1]}
            disabled={processing}
            className="px-4 py-2 font-bold rounded text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Lock size={14} /> {processing ? 'Importing…' : 'Import into HSM'}
          </Button>
        </div>
      )}

      {/* Step 3: SP 800-108 KDF */}
      {currentStep === 2 && (
        <div className="bg-muted/30 rounded-lg p-4 border border-border space-y-3">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Cpu size={15} className="text-primary" /> Step 3: NIST SP 800-108 Counter-Mode KDF
          </h2>
          <div className="border-2 border-dashed border-primary/40 rounded-lg p-4 relative">
            <div className="absolute -top-3 left-4 bg-background px-2 text-xs font-bold text-primary">
              HSM — PKCS#11 C_DeriveKey()
            </div>
            <div className="bg-background rounded p-3 border border-border text-xs font-mono space-y-1">
              <div className="text-muted-foreground">Mechanism: CKM_SP800_108_COUNTER_KDF</div>
              <div>PRF: HMAC-SHA-256 (helper selector: CKM_SHA256)</div>
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
          <WhyThisMatters title="Why KDF After Key Exchange?" variant="info">
            <p>
              The shared secret from a KEM or QKD channel has zero domain separation — if used
              directly as a key, the same 32 bytes would be reused for encryption, MAC, and IV
              across every session, allowing cross-protocol correlation.
            </p>
            <p>
              Counter-Mode KDF (SP 800-108) addresses this by deriving additional keying material
              from an existing key: <code>K(i) = PRF(KI, [i] ‖ Label ‖ 0x00 ‖ Context ‖ [L])</code>.
              Different <strong>Label</strong> values (&quot;session-key-v1&quot;,
              &quot;mac-key-v1&quot;) produce cryptographically independent sub-keys from the same
              master secret. The <strong>Context</strong> field (session ID below) carries
              per-session data. SP 800-56C Rev 2 defines Context as &quot;a bit string of
              context-specific data&quot;, a subcomponent of the FixedInfo.
            </p>
            <p>
              <strong>Choosing L:</strong> L is the requested length of the derived keying material
              in bits: L = 256 for a 256-bit AES key, L = 384 for a 384-bit key for HMAC-SHA-384, L
              = 512 for 512-bit material for HMAC-SHA-512 (an HSM call that takes a byte count would
              be given 32, 48 or 64 bytes). The label &amp; context bind purpose and session so all
              three can be derived from the same QKD secret without leaking information between
              them.
            </p>
          </WhyThisMatters>
          <Button
            variant="gradient"
            onClick={stepHandlers[2]}
            disabled={processing}
            className="px-4 py-2 font-bold rounded text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Cpu size={14} />{' '}
            {processing
              ? 'Processing…'
              : hsm.isReady
                ? 'Attempt Sample HSM Derivation'
                : 'Show Illustrative Random Output'}
          </Button>
        </div>
      )}

      {/* Step 4: Session Key Output */}
      {currentStep === 3 && (
        <div className="bg-muted/30 rounded-lg p-4 border border-border space-y-3">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <CheckCircle2 size={15} className="text-primary" /> Step 4: Session Key Output
          </h2>
          <p className="text-xs text-muted-foreground" role="status">
            {state.outputOrigin === 'live-kbkdf'
              ? 'Sample C_DeriveKey returned bytes; displayed in JavaScript.'
              : 'Illustrative random output — no KDF executed.'}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Alice side */}
            <div className="border-2 border-dashed border-primary/40 rounded-lg p-4 relative">
              <div className="absolute -top-3 left-4 bg-background px-2 text-xs font-bold text-primary">
                Sample Output — View A
              </div>
              <div className="space-y-2">
                <div className="bg-background rounded p-2 border border-border">
                  <div className="text-xs text-muted-foreground mb-1">Session ID (context)</div>
                  <code className="text-xs font-mono text-foreground break-all">
                    {state.sessionId}
                  </code>
                </div>
                <div className="bg-status-success/10 rounded p-2 border border-status-success/30">
                  <div className="text-xs text-muted-foreground mb-1">Local sample output</div>
                  <code className="text-xs font-mono text-status-success break-all">
                    {state.sessionKey}
                  </code>
                </div>
              </div>
            </div>
            {/* Bob side */}
            <div className="border-2 border-dashed border-status-success/40 rounded-lg p-4 relative">
              <div className="absolute -top-3 left-4 bg-background px-2 text-xs font-bold text-status-success">
                Same Sample Output — View B
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
                <div className="bg-status-success/10 rounded p-2 border border-status-success/30">
                  <div className="text-xs text-muted-foreground mb-1">Local sample output</div>
                  <code className="text-xs font-mono text-status-success break-all">
                    {state.sessionKey}
                  </code>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-status-success/5 rounded p-3 border border-status-success/20 text-xs text-muted-foreground">
            Both views repeat the same locally stored value; they are not two independent HSM
            derivations. No quantum channel or remote peer is involved. Check actual peer agreement,
            supported mechanisms and key handling with your own production tools.
          </div>
          <Button
            variant="gradient"
            onClick={stepHandlers[3]}
            className="px-4 py-2 font-bold rounded text-sm transition-colors flex items-center gap-2"
          >
            <Zap size={14} /> See How the Key Is Used
          </Button>
        </div>
      )}

      {/* Step 5: Session Key Use */}
      {currentStep === 4 && (
        <div className="bg-muted/30 rounded-lg p-4 border border-border space-y-3">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Zap size={15} className="text-primary" /> Step 5: Session Key Use
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="glass-panel p-3">
              <div className="font-bold text-foreground mb-2">Option A — Bulk Encryption</div>
              <div className="text-muted-foreground space-y-1">
                <div>Algorithm: AES-256-GCM</div>
                <div>Key: &lt;derived session key&gt;</div>
                <div>Nonce construction and packet encryption are not executed here.</div>
                <div className="mt-2 text-muted-foreground">
                  Production tools must implement the exact negotiated profile, key installation,
                  nonce rules and rotation; no packet encryption is demonstrated here.
                </div>
              </div>
            </div>
            <div className="glass-panel p-3">
              <div className="font-bold text-foreground mb-2">
                Option B — TLS 1.3 PSK (RFC 9258)
              </div>
              <div className="text-muted-foreground space-y-1 text-xs">
                <div className="font-mono bg-muted/60 rounded p-2 border border-border space-y-0.5">
                  <div>RFC 9258 importer and binder derivation are not executed.</div>
                  <div>
                    Production tools must bind external identity, context, target protocol and
                    target KDF.
                  </div>
                </div>
                <div className="mt-1.5">
                  RFC 9258 requires separate PSK diversification plus identity, context, target
                  protocol and KDF binding. None of that importer or the TLS handshake is run here;
                  the related protocol tab is also a local sample, not interoperability evidence.
                </div>
              </div>
            </div>
          </div>

          <div className="bg-muted/30 rounded p-3 border border-border">
            <div className="text-xs font-bold text-muted-foreground mb-1">Key rotation</div>
            <p className="text-xs text-muted-foreground">
              QKD continuously generates fresh key material. The HSM can be programmed to rotate
              session keys on a schedule by fetching a new key_ID from the QKD key manager and
              repeating the SP 800-108 derivation with an incremented context counter. See{' '}
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
        <div className="bg-status-success/5 rounded-lg p-4 border border-status-success/20 space-y-3">
          <h2 className="text-sm font-bold text-status-success flex items-center gap-2">
            <CheckCircle2 size={16} /> Sample Walkthrough Complete — Scope Shown Below
          </h2>
          <p className="text-xs text-muted-foreground" role="status">
            {state.outputOrigin === 'live-kbkdf'
              ? 'Sample C_DeriveKey returned bytes; displayed in JavaScript.'
              : 'Illustrative random output — no KDF executed.'}
          </p>
          <div className="grid grid-cols-1 gap-2">
            <div className="bg-background rounded p-3 border border-border text-xs">
              <div className="text-muted-foreground mb-1">key_ID (shared reference)</div>
              <code className="font-mono text-foreground break-all">{state.keyId}</code>
            </div>
            <div className="bg-background rounded p-3 border border-border text-xs">
              <div className="text-muted-foreground mb-1">Session ID (KDF context)</div>
              <code className="font-mono text-foreground break-all">{state.sessionId}</code>
            </div>
            <div className="bg-status-success/10 rounded p-3 border border-status-success/30 text-xs">
              <div className="text-muted-foreground mb-1">
                Local 32-byte output — see operation origin
              </div>
              <code className="font-mono text-status-success break-all">{state.sessionKey}</code>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Related standards (not protocol conformance):{' '}
            <a href="/library?ref=ETSI-GS-QKD-014" className="text-primary hover:underline">
              ETSI GS QKD 014
            </a>{' '}
            ·{' '}
            <a href="/library?ref=PKCS11-V32-OS-OASIS" className="text-primary hover:underline">
              PKCS#11 v3.0
            </a>{' '}
            ·{' '}
            <a href="/library?ref=NIST-SP-800-108-R1" className="text-primary hover:underline">
              NIST SP 800-108 Rev.1
            </a>{' '}
            ·{' '}
            <a href="/library?ref=RFC-9258" className="text-primary hover:underline">
              RFC 9258 (TLS 1.3 PSK Import)
            </a>
          </p>
          <div className="text-xs font-bold text-status-success">
            Educational sample only — no protocol validation
          </div>
          <div className="flex justify-end pt-2">
            <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5 text-xs">
              <RotateCcw size={12} aria-hidden="true" />
              Start Over
            </Button>
          </div>
        </div>
      )}

      {/* Run next step */}
      {currentStep > 0 && currentStep < 5 && (
        <Button
          variant="gradient"
          onClick={stepHandlers[currentStep]}
          disabled={processing || (!hsm.isReady && currentStep === 2)}
          className="px-4 py-2 font-bold rounded text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <Play size={14} /> {processing ? 'Processing…' : `Run Step ${currentStep + 1}`}
          {!hsm.isReady && currentStep === 2 && ' (Live HSM Required)'}
        </Button>
      )}

      <KatValidationPanel
        specs={QKD_KAT_SPECS}
        label="QKD/HSM PQC Known Answer Tests"
        authorityNote="ETSI GS QKD 014 · NIST FIPS 198-1 (HMAC-SHA-256) · SP 800-108r1 + RFC 5869 (HKDF)"
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
              onRemoveKey={(key: HsmKey) => hsm.removeKey(key.handle)}
              title="QKD Imported Secrets"
            />
          )}
        </div>
      )}
    </div>
  )
}
