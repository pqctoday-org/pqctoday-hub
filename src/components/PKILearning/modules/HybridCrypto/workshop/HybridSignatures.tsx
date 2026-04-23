// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useCallback, useRef, useEffect } from 'react'
import {
  Fingerprint,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  Info,
  ExternalLink,
  Lock,
  Layers,
  Target,
  Server,
  FlaskConical,
} from 'lucide-react'
import {
  silithiumKeygen,
  silithiumSign,
  silithiumVerify,
  silithiumRecombinationAttack,
  type HybridSigKeyPair,
  type HybridSigResult,
  type VerifyResult,
} from '../services/HybridSignatureService'
import {
  hsmKeygen,
  hsmConcatenationSign,
  hsmConcatenationVerify,
  hsmNestingSign,
  hsmNestingVerify,
  type HsmHybridKeyPair,
} from '../services/HybridSignatureHsmService'
import { getSoftHSMCppModule } from '@/wasm/softhsm'
import {
  hsm_initialize,
  hsm_getFirstSlot,
  hsm_initToken,
  hsm_openUserSession,
} from '@/wasm/softhsm/session'
import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import { Button } from '@/components/ui/button'

// ── Types ────────────────────────────────────────────────────────────────────

type ConstructionId = 'concatenation' | 'nesting' | 'silithium'

/** HSM or noble key pair, carrying the backend tag for dispatch. */
type KeyState =
  | { backend: 'hsm'; pair: HsmHybridKeyPair }
  | { backend: 'noble'; pair: HybridSigKeyPair }

interface ConstructionState {
  keys: KeyState | null
  sigResult: HybridSigResult | null
  verifyResult: VerifyResult | null
  recombinationResult: VerifyResult | null
  loading: boolean
  error: string | null
}

type HsmStatus = 'loading' | 'ready' | 'error'

const DEFAULT_MSG =
  'Hello from the post-quantum transition. This message must be signed by both classical and PQC algorithms.'

const CONSTRUCTIONS: Array<{
  id: ConstructionId
  label: string
  icon: React.ElementType
  tagline: string
  nonSeparability: string
  nsColor: string
  description: string
  reference: string
  referenceUrl: string
}> = [
  {
    id: 'concatenation',
    label: 'Concatenation',
    icon: Layers,
    tagline: 'sig₁ ‖ sig₂',
    nonSeparability: 'None / WNS',
    nsColor: 'text-status-warning',
    description:
      'Two independent signatures concatenated. Either component can be stripped and verified alone. Provides defence in depth but no separability resistance.',
    reference: 'IETF draft §1.3.3',
    referenceUrl: 'https://datatracker.ietf.org/doc/draft-ietf-pquip-hybrid-signature-spectrums/',
  },
  {
    id: 'nesting',
    label: 'Nesting',
    icon: Lock,
    tagline: 'sign_ML(msg ‖ sig_EC)',
    nonSeparability: 'WNS',
    nsColor: 'text-status-warning',
    description:
      'The outer ML-DSA signature covers msg ‖ ecSig, binding the EC component. Swapping the EC signature invalidates the outer layer, but the EC component still verifies alone on the original message.',
    reference: 'IETF draft §1.3.3',
    referenceUrl: 'https://datatracker.ietf.org/doc/draft-ietf-pquip-hybrid-signature-spectrums/',
  },
  {
    id: 'silithium',
    label: 'Silithium (Fused)',
    icon: Fingerprint,
    tagline: 'μ = H(R ‖ pk_ec ‖ pk_ml ‖ msg)',
    nonSeparability: 'SNS',
    nsColor: 'text-status-success',
    description:
      'Fused Fiat-Shamir: both components share a single challenge μ that includes the EC commitment R. Neither component verifies without the shared μ. Achieves Strong Non-Separability.',
    reference: 'ePrint 2025/2059',
    referenceUrl: 'https://eprint.iacr.org/2025/2059',
  },
]

// ── Backend legend badges ─────────────────────────────────────────────────────

function BackendLegend({ id }: { id: ConstructionId }) {
  if (id === 'silithium') {
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        <BackendBadge kind="noble" label="Both components — @noble/post-quantum + @noble/curves" />
        <span className="text-xs text-muted-foreground self-center">
          Fused Fiat-Shamir requires Sign_internal (below PKCS#11 boundary)
        </span>
      </div>
    )
  }
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      <BackendBadge kind="hsm" label="ML-DSA-65 — softhsmv3 WASM (CKM_ML_DSA, PKCS#11 v3.2)" />
      <BackendBadge kind="noble" label="EC-Schnorr — @noble/curves (no PKCS#11 Schnorr)" />
    </div>
  )
}

function BackendBadge({ kind, label }: { kind: 'hsm' | 'noble'; label: string }) {
  const isHsm = kind === 'hsm'
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-mono px-2 py-0.5 rounded border ${
        isHsm
          ? 'bg-primary/5 border-primary/20 text-primary'
          : 'bg-muted border-border text-muted-foreground'
      }`}
    >
      {isHsm ? <Server size={10} /> : <FlaskConical size={10} />}
      {label}
    </span>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function hexPreview(hex: string, chars = 32): string {
  return hex.length > chars ? hex.slice(0, chars) + '…' : hex
}

function toHexDisplay(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function SizeBadge({ bytes, label }: { bytes: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-mono bg-muted px-2 py-0.5 rounded">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-primary font-semibold">{bytes}B</span>
    </span>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export const HybridSignatures: React.FC = () => {
  const [activeConstruction, setActiveConstruction] = useState<ConstructionId>('concatenation')
  const [message, setMessage] = useState(DEFAULT_MSG)
  const [hsmStatus, setHsmStatus] = useState<HsmStatus>('loading')
  const hsmRef = useRef<{ M: SoftHSMModule; hSession: number } | null>(null)

  const [state, setState] = useState<Record<ConstructionId, ConstructionState>>({
    concatenation: {
      keys: null,
      sigResult: null,
      verifyResult: null,
      recombinationResult: null,
      loading: false,
      error: null,
    },
    nesting: {
      keys: null,
      sigResult: null,
      verifyResult: null,
      recombinationResult: null,
      loading: false,
      error: null,
    },
    silithium: {
      keys: null,
      sigResult: null,
      verifyResult: null,
      recombinationResult: null,
      loading: false,
      error: null,
    },
  })

  // ── HSM init ────────────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false
    async function init() {
      try {
        const M = await getSoftHSMCppModule()
        try {
          hsm_initialize(M)
        } catch {
          // CKR_CRYPTOKI_ALREADY_INITIALIZED — module shared with Playground, proceed
        }
        const slot0 = hsm_getFirstSlot(M)
        const slot = hsm_initToken(M, slot0, 'softhsm', 'hybrid-sig-workshop')
        const hSession = hsm_openUserSession(M, slot, 'softhsm', '1234')
        if (!cancelled) {
          hsmRef.current = { M, hSession }
          setHsmStatus('ready')
        }
      } catch (e) {
        if (!cancelled) setHsmStatus('error')
        console.warn('HybridSignatures: HSM init failed', e)
      }
    }
    init()
    return () => {
      cancelled = true
      if (hsmRef.current) {
        try {
          hsmRef.current.M._C_CloseSession(hsmRef.current.hSession)
        } catch {
          /* ignore */
        }
        hsmRef.current = null
      }
    }
  }, [])

  // ── State helpers ───────────────────────────────────────────────────────────

  const updateState = useCallback((id: ConstructionId, patch: Partial<ConstructionState>) => {
    setState((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }))
  }, [])

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleKeygen = useCallback(
    async (id: ConstructionId) => {
      updateState(id, {
        loading: true,
        error: null,
        sigResult: null,
        verifyResult: null,
        recombinationResult: null,
      })
      try {
        await new Promise((r) => setTimeout(r, 10))
        let keys: KeyState
        if (id === 'silithium') {
          keys = { backend: 'noble', pair: silithiumKeygen() }
        } else {
          if (!hsmRef.current) throw new Error('HSM not ready')
          const { M, hSession } = hsmRef.current
          keys = { backend: 'hsm', pair: hsmKeygen(M, hSession) }
        }
        updateState(id, { keys, loading: false })
      } catch (err) {
        updateState(id, { loading: false, error: String(err) })
      }
    },
    [updateState]
  )

  const handleSign = useCallback(
    async (id: ConstructionId) => {
      const { keys } = state[id]
      if (!keys) return
      updateState(id, { loading: true, error: null, verifyResult: null })
      try {
        await new Promise((r) => setTimeout(r, 10))
        const msgBytes = new TextEncoder().encode(message)
        let sigResult: HybridSigResult
        if (id === 'silithium' && keys.backend === 'noble') {
          sigResult = silithiumSign(msgBytes, keys.pair)
        } else if (keys.backend === 'hsm') {
          if (!hsmRef.current) throw new Error('HSM session lost')
          const { M, hSession } = hsmRef.current
          sigResult =
            id === 'concatenation'
              ? hsmConcatenationSign(msgBytes, keys.pair, M, hSession)
              : hsmNestingSign(msgBytes, keys.pair, M, hSession)
        } else {
          throw new Error('Backend mismatch')
        }
        updateState(id, { sigResult, loading: false })
      } catch (err) {
        updateState(id, { loading: false, error: String(err) })
      }
    },
    [state, message, updateState]
  )

  const handleVerify = useCallback(
    async (id: ConstructionId) => {
      const { keys, sigResult } = state[id]
      if (!keys || !sigResult) return
      updateState(id, { loading: true, error: null })
      try {
        await new Promise((r) => setTimeout(r, 10))
        const msgBytes = new TextEncoder().encode(message)
        let verifyResult: VerifyResult
        if (id === 'silithium' && keys.backend === 'noble') {
          verifyResult = silithiumVerify(msgBytes, sigResult.signatureBytes, keys.pair)
        } else if (keys.backend === 'hsm') {
          if (!hsmRef.current) throw new Error('HSM session lost')
          const { M, hSession } = hsmRef.current
          verifyResult =
            id === 'concatenation'
              ? hsmConcatenationVerify(msgBytes, sigResult.signatureBytes, keys.pair, M, hSession)
              : hsmNestingVerify(msgBytes, sigResult.signatureBytes, keys.pair, M, hSession)
        } else {
          throw new Error('Backend mismatch')
        }
        updateState(id, { verifyResult, loading: false })
      } catch (err) {
        updateState(id, { loading: false, error: String(err) })
      }
    },
    [state, message, updateState]
  )

  const handleRecombinationAttack = useCallback(async () => {
    const { keys, sigResult } = state['silithium']
    if (!keys || !sigResult || keys.backend !== 'noble') return
    updateState('silithium', { loading: true, error: null, recombinationResult: null })
    try {
      await new Promise((r) => setTimeout(r, 10))
      const msgBytes = new TextEncoder().encode(message)
      const attackerKeys = silithiumKeygen()
      const result = silithiumRecombinationAttack(msgBytes, sigResult.signatureBytes, attackerKeys)
      updateState('silithium', { loading: false, recombinationResult: result })
    } catch (err) {
      updateState('silithium', { loading: false, error: String(err) })
    }
  }, [state, message, updateState])

  const current = state[activeConstruction]
  const meta = CONSTRUCTIONS.find((c) => c.id === activeConstruction)!
  const MetaIcon = meta.icon
  const isHsmConstruction = activeConstruction !== 'silithium'
  const hsmBlocked = isHsmConstruction && hsmStatus !== 'ready'

  // ── Key display helpers ─────────────────────────────────────────────────────

  function renderKeys(keys: KeyState) {
    const ecPkHex = toHexDisplay(keys.pair.ecPk)
    const mlPkHex =
      keys.backend === 'hsm'
        ? toHexDisplay(keys.pair.mlPubBytes)
        : toHexDisplay((keys.pair as HybridSigKeyPair).mlPk)
    const mlPkLen =
      keys.backend === 'hsm'
        ? keys.pair.mlPubBytes.length
        : (keys.pair as HybridSigKeyPair).mlPk.length

    return (
      <div className="glass-panel p-4 space-y-3">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Fingerprint size={15} className="text-primary" />
          Key Pairs
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
          {/* EC-Schnorr — always noble */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <FlaskConical size={11} />
              EC-Schnorr (secp256k1) · @noble/curves
            </div>
            <div className="bg-muted rounded px-2 py-1 text-foreground break-all">
              pk: {hexPreview(ecPkHex)}
            </div>
            <div className="flex gap-2">
              <SizeBadge bytes={keys.pair.ecPk.length} label="pk" />
              <SizeBadge bytes={keys.pair.ecSk.length} label="sk" />
            </div>
          </div>
          {/* ML-DSA — HSM or noble */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              {keys.backend === 'hsm' ? <Server size={11} /> : <FlaskConical size={11} />}
              ML-DSA-65 (FIPS 204) ·{' '}
              {keys.backend === 'hsm' ? 'softhsmv3 WASM (PKCS#11 v3.2)' : '@noble/post-quantum'}
            </div>
            <div className="bg-muted rounded px-2 py-1 text-foreground break-all">
              pk: {hexPreview(mlPkHex)}
            </div>
            <div className="flex gap-2 flex-wrap">
              <SizeBadge bytes={mlPkLen} label="pk" />
              {keys.backend === 'hsm' ? (
                <span className="inline-flex items-center gap-1 text-xs font-mono bg-primary/5 border border-primary/20 text-primary px-2 py-0.5 rounded">
                  <Server size={9} />
                  handle #{keys.pair.mlPubHandle}
                </span>
              ) : (
                <SizeBadge bytes={(keys.pair as HybridSigKeyPair).mlSk.length} label="sk" />
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Fingerprint className="text-primary mt-1 shrink-0" size={22} />
        <div>
          <h3 className="text-lg font-semibold text-foreground">Hybrid Signature Spectrums</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Compare concatenation, nesting, and Silithium — ranging from no non-separability to
            Strong Non-Separability (SNS).
          </p>
        </div>
      </div>

      {/* HSM status banner */}
      {hsmStatus === 'loading' && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 border border-border rounded-lg px-3 py-2">
          <Loader2 size={13} className="animate-spin shrink-0" />
          Loading softhsmv3 WASM for concatenation / nesting ML-DSA operations…
        </div>
      )}
      {hsmStatus === 'error' && (
        <div className="flex items-center gap-2 text-xs text-status-error bg-status-error/5 border border-status-error/20 rounded-lg px-3 py-2">
          <ShieldAlert size={13} className="shrink-0" />
          softhsmv3 WASM failed to load — concatenation and nesting unavailable. Silithium still
          works via @noble.
        </div>
      )}
      {hsmStatus === 'ready' && (
        <div className="flex items-center gap-2 text-xs text-status-success bg-status-success/5 border border-status-success/20 rounded-lg px-3 py-2">
          <Server size={13} className="shrink-0" />
          softhsmv3 WASM ready · CKM_ML_DSA (PKCS#11 v3.2) active for concatenation / nesting
        </div>
      )}

      {/* Construction tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-4">
        {CONSTRUCTIONS.map((c) => {
          const CIcon = c.icon
          const isActive = activeConstruction === c.id
          return (
            <Button
              key={c.id}
              variant={isActive ? 'gradient' : 'outline'}
              onClick={() => setActiveConstruction(c.id)}
              className="flex items-center gap-2 text-sm"
            >
              <CIcon size={15} />
              {c.label}
            </Button>
          )
        })}
      </div>

      {/* Construction info card */}
      <div className="glass-panel p-4 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <MetaIcon className="text-primary" size={18} />
            <span className="font-semibold text-foreground">{meta.label}</span>
            <code className="text-xs font-mono bg-muted px-2 py-0.5 rounded text-primary">
              {meta.tagline}
            </code>
            <span className={`text-xs font-semibold ${meta.nsColor}`}>
              Non-separability: {meta.nonSeparability}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{meta.description}</p>
          <a
            href={meta.referenceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <ExternalLink size={12} />
            {meta.reference}
          </a>
          {/* Backend legend */}
          <BackendLegend id={activeConstruction} />
        </div>
        {/* Separability indicator */}
        {current.sigResult && (
          <div
            className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg border ${
              current.sigResult.separable
                ? 'border-status-warning/30 bg-status-warning/5'
                : 'border-status-success/30 bg-status-success/5'
            }`}
          >
            {current.sigResult.separable ? (
              <ShieldAlert className="text-status-warning" size={24} />
            ) : (
              <ShieldCheck className="text-status-success" size={24} />
            )}
            <span
              className={`text-xs font-semibold ${current.sigResult.separable ? 'text-status-warning' : 'text-status-success'}`}
            >
              {current.sigResult.separable ? 'Separable' : 'Non-Separable'}
            </span>
          </div>
        )}
      </div>

      {/* Message input */}
      <div className="space-y-2">
        <label htmlFor="hybrid-sig-message" className="text-sm font-medium text-foreground">
          Message to sign
        </label>
        <textarea
          id="hybrid-sig-message"
          className="w-full h-20 bg-muted border border-input rounded-lg px-3 py-2 text-sm font-mono text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>

      {/* Action row */}
      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          onClick={() => handleKeygen(activeConstruction)}
          disabled={current.loading || hsmBlocked}
          className="flex items-center gap-2"
        >
          {current.loading ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Fingerprint size={15} />
          )}
          Generate Key Pairs
        </Button>
        <Button
          variant="outline"
          onClick={() => handleSign(activeConstruction)}
          disabled={!current.keys || current.loading}
          className="flex items-center gap-2"
        >
          {current.loading ? <Loader2 size={15} className="animate-spin" /> : <Lock size={15} />}
          Sign
        </Button>
        <Button
          variant="gradient"
          onClick={() => handleVerify(activeConstruction)}
          disabled={!current.sigResult || current.loading}
          className="flex items-center gap-2"
        >
          {current.loading ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <ShieldCheck size={15} />
          )}
          Verify
        </Button>
        {activeConstruction === 'silithium' && (
          <Button
            variant="outline"
            onClick={handleRecombinationAttack}
            disabled={!current.sigResult || current.loading}
            className="flex items-center gap-2 border-status-warning/40 text-status-warning hover:bg-status-warning/10"
          >
            {current.loading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Target size={15} />
            )}
            Recombination Attack
          </Button>
        )}
      </div>

      {/* Error */}
      {current.error && (
        <div className="text-sm text-status-error bg-status-error/10 border border-status-error/20 rounded-lg px-4 py-3">
          {current.error}
        </div>
      )}

      {/* Key info */}
      {current.keys && renderKeys(current.keys)}

      {/* Signature result */}
      {current.sigResult && (
        <div className="glass-panel p-4 space-y-4">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Lock size={15} className="text-primary" />
            Signature ({current.sigResult.construction})
          </h4>

          {/* Size comparison */}
          <div className="flex flex-wrap gap-3 items-center">
            <SizeBadge bytes={current.sigResult.sizes.totalBytes} label="total" />
            {activeConstruction === 'silithium' && (
              <>
                <SizeBadge bytes={current.sigResult.sizes.ecBytes} label="EC-Schnorr" />
                <SizeBadge bytes={current.sigResult.sizes.mlBytes} label="ML-DSA" />
                <span className="text-xs text-muted-foreground">
                  vs concatenation:{' '}
                  <span className="font-mono text-foreground">
                    {current.sigResult.sizes.concatenationBytes}B
                  </span>{' '}
                  (saves{' '}
                  <span className="text-status-success font-semibold">
                    {current.sigResult.sizes.savedBytes}B
                  </span>
                  )
                </span>
              </>
            )}
            <span className="text-xs text-muted-foreground ml-auto">
              {current.sigResult.timingMs.toFixed(1)}ms
            </span>
          </div>

          {/* Component hex display */}
          <div className="space-y-2 text-xs font-mono">
            <div>
              <span className="text-muted-foreground">EC component (R‖s): </span>
              <span className="text-foreground break-all">
                {hexPreview(current.sigResult.components.ecPart, 64)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">ML-DSA component: </span>
              <span className="text-foreground break-all">
                {current.sigResult.components.mlPart}
              </span>
            </div>
            {current.sigResult.components.sharedChallenge && (
              <div className="border-t border-border pt-2">
                <span className="text-muted-foreground">Shared challenge μ[:32]: </span>
                <span className="text-primary break-all">
                  {current.sigResult.components.sharedChallenge}
                </span>
                <div className="text-muted-foreground mt-1 text-[11px]">
                  μ = H(R ‖ pk_ec ‖ pk_ml ‖ msg) — both components are bound to this value
                </div>
                <div className="text-muted-foreground/60 mt-0.5 text-[10px] italic">
                  Approximation: full Silithium (ePrint 2025/2059) also includes the ML-DSA round-1
                  lattice commitment w1 in μ. Not exposed by @noble/post-quantum externalMu API.
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Verification result */}
      {current.verifyResult && (
        <div className="glass-panel p-4 space-y-4">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <ShieldCheck size={15} className="text-primary" />
            Verification Results
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <ResultBadge
              label="Full hybrid verify"
              pass={current.verifyResult.valid}
              detail={current.verifyResult.valid ? 'Both components valid' : 'Failed'}
            />
            <ResultBadge
              label="EC-Schnorr alone"
              pass={current.verifyResult.ecAloneValid}
              warn={current.verifyResult.ecAloneValid}
              detail={
                current.verifyResult.ecAloneValid
                  ? activeConstruction === 'silithium'
                    ? 'UNEXPECTED — fused challenge mismatch should prevent this'
                    : 'Separable ⚠ — EC strips cleanly'
                  : 'Blocked ✓ — requires shared μ'
              }
            />
            <ResultBadge
              label="ML-DSA alone"
              pass={current.verifyResult.mlAloneValid}
              warn={current.verifyResult.mlAloneValid}
              detail={
                current.verifyResult.mlAloneValid
                  ? 'Separable ⚠ — ML-DSA verifies on raw message alone'
                  : activeConstruction === 'silithium'
                    ? 'Blocked ✓ — ML-DSA signed with fused μ, not raw msg'
                    : 'Blocked ✓ — ML-DSA signed over msg‖ecSig, not msg alone'
              }
            />
          </div>

          {/* Separability explanation */}
          <div
            className={`flex gap-3 p-3 rounded-lg border text-sm ${
              current.verifyResult.ecAloneValid
                ? 'border-status-warning/30 bg-status-warning/5'
                : 'border-status-success/30 bg-status-success/5'
            }`}
          >
            <Info
              size={16}
              className={`shrink-0 mt-0.5 ${current.verifyResult.ecAloneValid ? 'text-status-warning' : 'text-status-success'}`}
            />
            <div>
              {activeConstruction === 'concatenation' && (
                <p className="text-muted-foreground">
                  The EC component verified independently. An adversary could strip the ML-DSA
                  component and present just the EC signature — the verifier would accept it if it
                  only checks EC. This is the separability attack.
                </p>
              )}
              {activeConstruction === 'nesting' && (
                <p className="text-muted-foreground">
                  The EC component still verifies alone (the outer ML-DSA layer doesn&apos;t prevent
                  extraction). However, swapping the EC signature for a different one would
                  invalidate the outer ML-DSA sig. This is Weak Non-Separability.
                </p>
              )}
              {activeConstruction === 'silithium' && !current.verifyResult.ecAloneValid && (
                <p className="text-muted-foreground">
                  The EC-Schnorr component cannot be verified with the standard challenge H(R ‖ pk ‖
                  msg). The signer used the fused challenge μ that also incorporates pk_ml — so any
                  attempt to verify just the EC part with the wrong challenge fails. This is Strong
                  Non-Separability (SNS).
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recombination attack result — Silithium only */}
      {activeConstruction === 'silithium' && current.recombinationResult && (
        <div className="glass-panel p-4 space-y-3">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Target size={15} className="text-status-warning" />
            Recombination Attack Result
          </h4>
          <p className="text-xs text-muted-foreground">
            An attacker generates a fresh Silithium key pair and signs the same message. They then
            splice the <em>legitimate EC component</em> (R, s) with their own ML-DSA component (z)
            and attempt to verify against their own public keys.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ResultBadge
              label="Spliced sig verify"
              pass={current.recombinationResult.valid}
              detail={
                current.recombinationResult.valid
                  ? 'UNEXPECTED — recombination succeeded!'
                  : 'Blocked ✓ — forged sig rejected'
              }
            />
            <ResultBadge
              label="EC alone (spliced)"
              pass={current.recombinationResult.ecAloneValid}
              warn={current.recombinationResult.ecAloneValid}
              detail={
                current.recombinationResult.ecAloneValid
                  ? 'EC verifies — attacker reused legit EC component'
                  : 'Blocked ✓'
              }
            />
          </div>
          <div className="flex gap-2 p-3 rounded-lg border border-status-success/20 bg-status-success/5 text-xs text-muted-foreground">
            <ShieldCheck size={14} className="shrink-0 mt-0.5 text-status-success" />
            <span>
              The attack fails because μ = H(R ‖ <strong>pk_ec ‖ pk_ml</strong> ‖ msg) binds both
              public keys. Substituting the attacker&apos;s ML-DSA component requires their pk_ml,
              which changes μ, making the legitimate EC response s invalid for the new challenge.
            </span>
          </div>
        </div>
      )}

      {/* Educational disclaimer */}
      <div className="flex gap-2 p-3 bg-muted/50 rounded-lg border border-border text-xs text-muted-foreground">
        <Info size={14} className="shrink-0 mt-0.5" />
        <span>
          Educational demonstration. Keys are ephemeral and never leave your browser. Silithium uses
          the fused Fiat-Shamir construction from{' '}
          <a
            href="https://eprint.iacr.org/2025/2059"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            ePrint 2025/2059
          </a>{' '}
          (Devevey, Guerreau, Roméas) with ML-DSA external-μ mode (FIPS 204 §5.2).
        </span>
      </div>
    </div>
  )
}

// ── Sub-component: Result badge ───────────────────────────────────────────────

function ResultBadge({
  label,
  pass,
  warn,
  detail,
}: {
  label: string
  pass: boolean
  warn?: boolean
  detail: string
}) {
  const color = pass
    ? warn
      ? 'border-status-warning/30 bg-status-warning/5'
      : 'border-status-success/30 bg-status-success/5'
    : 'border-status-error/30 bg-status-error/5'
  const iconColor = pass
    ? warn
      ? 'text-status-warning'
      : 'text-status-success'
    : 'text-status-error'
  const Icon = pass ? ShieldCheck : ShieldAlert

  return (
    <div className={`rounded-lg border p-3 ${color}`}>
      <div className={`flex items-center gap-2 font-semibold text-sm ${iconColor}`}>
        <Icon size={15} />
        {pass ? (warn ? 'Warning' : 'Pass') : 'Fail'}
      </div>
      <div className="text-xs text-muted-foreground mt-1 font-medium">{label}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{detail}</div>
    </div>
  )
}
