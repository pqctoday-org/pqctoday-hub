// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState, useCallback, useRef, useEffect, useLayoutEffect } from 'react'
import {
  Fingerprint,
  HelpCircle,
  ChevronDown,
  RotateCcw,
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
import { getSoftHSMRustModule, createLoggingProxy } from '@/wasm/softhsm'
import type { Pkcs11LogEntry } from '@/wasm/softhsm'
import { Pkcs11LogPanel } from '@/components/shared/Pkcs11LogPanel'
import {
  hsm_initialize,
  hsm_getFirstSlot,
  hsm_initToken,
  hsm_openUserSession,
} from '@/wasm/softhsm/session'
import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import { Button } from '@/components/ui/button'
import { CopyButton } from '@/components/ui/CopyButton'
import { ErrorAlert } from '@/components/ui/error-alert'
import {
  WorkshopOperationLog,
  type LogEntry,
} from '@/components/PKILearning/common/WorkshopOperationLog'

// ── Types ────────────────────────────────────────────────────────────────────

type ConstructionId = 'concatenation' | 'nesting' | 'silithium'

/** HSM or noble key pair, carrying the backend tag for dispatch. */
type KeyState =
  { backend: 'hsm'; pair: HsmHybridKeyPair } | { backend: 'noble'; pair: HybridSigKeyPair }

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
      'Bare concatenation, shown here with no label or prefix (RFC 9955 Table 2, case 1): either component can be stripped and verified alone. RFC 9955 (section 1.3.4) notes that concatenation with a label in the message gives weak non-separability; Composite ML-DSA (draft-ietf-lamps-pq-composite-sigs section 9.2.3) works that way.',
    reference: 'RFC 9955 §2',
    referenceUrl: 'https://www.rfc-editor.org/rfc/rfc9955',
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
    reference: 'RFC 9955 §1.3.3',
    referenceUrl: 'https://www.rfc-editor.org/rfc/rfc9955',
  },
  {
    id: 'silithium',
    label: 'Shared-binding model',
    icon: Fingerprint,
    tagline: 'μ = H(R ‖ pk_ec ‖ pk_ml ‖ msg)',
    nonSeparability: 'Local experiment',
    nsColor: 'text-status-success',
    description:
      'A local shared-binding learning model: the challenge includes the EC commitment, both public keys and the message. Execute the component checks below; their outcomes are not a proof of non-separability or an implementation of published Silithium.',
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
    <span className="inline-flex items-center gap-1 text-xs font-mono bg-muted px-2 py-0.5 rounded animate-in fade-in zoom-in duration-300">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-primary font-semibold">{bytes}B</span>
    </span>
  )
}

function getHybridSigErrorHint(err: unknown): string {
  const msg = String(err)
  if (msg.includes('HSM not ready') || (msg.includes('WASM') && msg.includes('not init'))) {
    return 'HSM is still initializing — wait for the status banner to show "ready" and try again.'
  }
  if (msg.includes('rv=0x') || msg.includes('C_Generate') || msg.includes('C_Sign')) {
    const rv = msg.match(/rv=0x([0-9a-fA-F]+)/)?.[1]
    if (rv === '00000002')
      return 'PKCS#11 error: invalid argument (CKR_ARGUMENTS_BAD). The algorithm parameters may not be supported.'
    if (rv === '00000005')
      return 'PKCS#11 error: operation failed (CKR_GENERAL_ERROR). Try reloading the page.'
    return `PKCS#11 operation failed. If this persists, reload the page and retry.`
  }
  if (msg.includes('Backend mismatch')) {
    return 'Internal configuration error. Please reload the page.'
  }
  return msg.substring(0, 150)
}

// ── Main component ────────────────────────────────────────────────────────────

export const HybridSignatures: React.FC = () => {
  const [activeConstruction, setActiveConstruction] = useState<ConstructionId>('concatenation')
  const [logEntries, setLogEntries] = useState<LogEntry[]>([])

  // Each closer updates only its own entry, including after a message edit.
  const beginOp = useCallback((message: string) => {
    const startedAt = performance.now()
    const pending: LogEntry = { status: 'pending', message }
    setLogEntries((prev) => [...prev, pending])
    const settle = (entry: LogEntry) =>
      setLogEntries((prev) => prev.map((item) => (item === pending ? entry : item)))
    return {
      done: (label?: string) =>
        settle({
          status: 'success',
          message: label ?? message.replace(/…$/, ''),
          durationMs: Math.round(performance.now() - startedAt),
        }),
      fail: (err: unknown) =>
        settle({
          status: 'error',
          message: `${message.replace(/…$/, '')} — ${err instanceof Error ? err.message : String(err)}`,
          durationMs: Math.round(performance.now() - startedAt),
        }),
    }
  }, [])
  const [hsmInitAttempts, setHsmInitAttempts] = useState(0)
  const [signPhase, setSignPhase] = useState<string | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const [message, setMessage] = useState(DEFAULT_MSG)
  const retryInit = useCallback(() => {
    setHsmInitAttempts((n) => n + 1)
  }, [])
  const [hsmStatus, setHsmStatus] = useState<HsmStatus>('loading')
  const [hsmInitError, setHsmInitError] = useState<string | null>(null)
  const hsmRef = useRef<{ M: SoftHSMModule; hSession: number } | null>(null)
  // Real C_* trace. This tool drives the engine through the module directly
  // rather than useHSM, so it does not inherit that hook's logging proxy —
  // without wrapping here, every PKCS#11 call it makes is invisible.
  const [pkcs11Log, setPkcs11Log] = useState<Pkcs11LogEntry[]>([])

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
    setHsmInitError(null)
    async function init() {
      // Stage tracker — populated as we cross each init boundary so the captured
      // error message tells us WHICH step failed (module load vs token init vs session).
      // Rust engine (softhsmrustv3), not the C++ fork. The C++ fork's only
      // crypto backend is OpenSSL libcrypto, so it is not an independent
      // implementation; the Rust engine is (RustCrypto + patched
      // fips204/205/ml-kem). Prefer Rust wherever the needed operations exist.
      let stage = 'getSoftHSMRustModule'
      try {
        // Wrapped so every C_* this tool issues lands in the panel below.
        const M = createLoggingProxy(await getSoftHSMRustModule(), (e) =>
          setPkcs11Log((prev) => [...prev, e])
        )
        stage = 'C_Initialize'
        try {
          hsm_initialize(M)
        } catch {
          // CKR_CRYPTOKI_ALREADY_INITIALIZED — module shared with Playground, proceed
        }
        stage = 'C_GetSlotList'
        const slot0 = hsm_getFirstSlot(M)
        stage = 'C_InitToken'
        const slot = hsm_initToken(M, slot0, 'softhsm', 'hybrid-sig-workshop')
        stage = 'C_OpenSession + C_Login'
        const hSession = hsm_openUserSession(M, slot, 'softhsm', '1234')
        if (!cancelled) {
          hsmRef.current = { M, hSession }
          setHsmStatus('ready')
        }
      } catch (e) {
        if (!cancelled) {
          setHsmStatus('error')
          const msg =
            e instanceof Error
              ? `${e.name}: ${e.message}`
              : typeof e === 'string'
                ? e
                : JSON.stringify(e)
          setHsmInitError(`Stage: ${stage}\n${msg}`)
        }
        console.error('HybridSignatures: HSM init failed', { stage, error: e })
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
  }, [hsmInitAttempts])

  // ── State helpers ───────────────────────────────────────────────────────────

  const updateState = useCallback((id: ConstructionId, patch: Partial<ConstructionState>) => {
    setState((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }))
  }, [])

  const versions = useRef(new Map<ConstructionId, number>())
  const running = useRef(new Set<ConstructionId>())
  const mounted = useRef(true)
  useLayoutEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])
  const beginRun = useCallback((id: ConstructionId) => {
    if (running.current.has(id)) return null
    running.current.add(id)
    const revision = (versions.current.get(id) ?? 0) + 1
    versions.current.set(id, revision)
    return revision
  }, [])
  const isCurrent = useCallback(
    (id: ConstructionId, revision: number) =>
      mounted.current && versions.current.get(id) === revision,
    []
  )
  const finishRun = useCallback(
    (id: ConstructionId) => {
      running.current.delete(id)
      if (mounted.current) updateState(id, { loading: false })
    },
    [updateState]
  )
  const changeMessage = (value: string) => {
    for (const id of ['concatenation', 'nesting', 'silithium'] as const) {
      versions.current.set(id, (versions.current.get(id) ?? 0) + 1)
    }
    setMessage(value)
    setState(
      (prev) =>
        Object.fromEntries(
          Object.entries(prev).map(([id, item]) => [
            id,
            {
              ...item,
              sigResult: null,
              verifyResult: null,
              recombinationResult: null,
              error: null,
            },
          ])
        ) as Record<ConstructionId, ConstructionState>
    )
  }

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleKeygen = useCallback(
    async (id: ConstructionId) => {
      const revision = beginRun(id)
      if (revision === null) return
      updateState(id, {
        loading: true,
        error: null,
        sigResult: null,
        verifyResult: null,
        recombinationResult: null,
      })
      const op = beginOp(
        `Generating ${id === 'silithium' ? 'shared-binding model' : id} hybrid keypair…`
      )
      try {
        await new Promise((r) => setTimeout(r, 10))
        if (!isCurrent(id, revision)) {
          op.fail(new Error('Inputs changed; operation discarded.'))
          return
        }
        let keys: KeyState
        if (id === 'silithium') {
          keys = { backend: 'noble', pair: silithiumKeygen() }
        } else {
          if (!hsmRef.current) throw new Error('HSM not ready')
          const { M, hSession } = hsmRef.current
          keys = { backend: 'hsm', pair: hsmKeygen(M, hSession) }
        }
        if (!isCurrent(id, revision)) return
        updateState(id, { keys, loading: false })
        op.done()
      } catch (err) {
        if (!isCurrent(id, revision)) return
        if (intervalRef.current) clearInterval(intervalRef.current)
        setSignPhase(null)
        updateState(id, { loading: false, error: getHybridSigErrorHint(err) })
        op.fail(err)
      } finally {
        finishRun(id)
      }
    },
    [updateState, beginOp, beginRun, isCurrent, finishRun]
  )

  const handleSign = useCallback(
    async (id: ConstructionId) => {
      const { keys } = state[id]
      if (!keys) return
      const revision = beginRun(id)
      if (revision === null) return
      updateState(id, {
        loading: true,
        error: null,
        sigResult: null,
        verifyResult: null,
        recombinationResult: null,
      })
      if (intervalRef.current) clearInterval(intervalRef.current)
      setSignPhase('Computing EC-Schnorr component (65B)…')
      intervalRef.current = setInterval(() => {
        setSignPhase((prev) =>
          prev?.includes('EC-Schnorr') ? 'Computing ML-DSA-65 component (3,309 B)…' : prev
        )
      }, 80)
      const op = beginOp(
        `Signing message with ${id === 'silithium' ? 'shared-binding model' : id} hybrid construction…`
      )
      try {
        await new Promise((r) => setTimeout(r, 10))
        if (!isCurrent(id, revision)) {
          op.fail(new Error('Inputs changed; operation discarded.'))
          return
        }
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
        if (!isCurrent(id, revision)) return
        updateState(id, { sigResult, loading: false })
        if (intervalRef.current) clearInterval(intervalRef.current)
        setSignPhase(null)
        op.done()
      } catch (err) {
        if (!isCurrent(id, revision)) return
        if (intervalRef.current) clearInterval(intervalRef.current)
        setSignPhase(null)
        updateState(id, { loading: false, error: getHybridSigErrorHint(err) })
        op.fail(err)
      } finally {
        if (intervalRef.current) clearInterval(intervalRef.current)
        if (mounted.current) setSignPhase(null)
        finishRun(id)
      }
    },
    [state, message, updateState, beginOp, beginRun, isCurrent, finishRun]
  )

  const handleVerify = useCallback(
    async (id: ConstructionId) => {
      const { keys, sigResult } = state[id]
      if (!keys || !sigResult) return
      const revision = beginRun(id)
      if (revision === null) return
      updateState(id, { loading: true, error: null, verifyResult: null, recombinationResult: null })
      const op = beginOp(
        `Verifying ${id === 'silithium' ? 'shared-binding model' : id} hybrid signature…`
      )
      try {
        await new Promise((r) => setTimeout(r, 10))
        if (!isCurrent(id, revision)) {
          op.fail(new Error('Inputs changed; operation discarded.'))
          return
        }
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
        if (!isCurrent(id, revision)) return
        if (verifyResult.error) throw new Error(verifyResult.error)
        updateState(id, { verifyResult, loading: false })
        op.done()
      } catch (err) {
        if (!isCurrent(id, revision)) return
        if (intervalRef.current) clearInterval(intervalRef.current)
        setSignPhase(null)
        updateState(id, { loading: false, error: getHybridSigErrorHint(err) })
        op.fail(err)
      } finally {
        finishRun(id)
      }
    },
    [state, message, updateState, beginOp, beginRun, isCurrent, finishRun]
  )

  const handleRecombinationAttack = useCallback(async () => {
    const { keys, sigResult } = state.silithium
    if (!keys || !sigResult || keys.backend !== 'noble') return
    const id = 'silithium'
    const revision = beginRun(id)
    if (revision === null) return
    updateState(id, { loading: true, error: null, recombinationResult: null })
    const op = beginOp('Checking public-only ML replacement…')
    try {
      await new Promise((r) => setTimeout(r, 10))
      if (!isCurrent(id, revision)) {
        op.fail(new Error('Inputs changed; operation discarded.'))
        return
      }
      const msgBytes = new TextEncoder().encode(message)
      const attackerKeys = silithiumKeygen()
      const result = silithiumRecombinationAttack(msgBytes, sigResult.signatureBytes, {
        ecPk: keys.pair.ecPk,
        mlPk: attackerKeys.mlPk,
        mlSk: attackerKeys.mlSk,
      })
      if (!isCurrent(id, revision)) return
      if (result.error) throw new Error(result.error)
      updateState(id, { recombinationResult: result })
      op.done()
    } catch (err) {
      if (!isCurrent(id, revision)) return
      updateState(id, { error: getHybridSigErrorHint(err) })
      op.fail(err)
    } finally {
      finishRun(id)
    }
  }, [state, message, updateState, beginRun, beginOp, isCurrent, finishRun])

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
          <h2 className="text-lg font-semibold text-foreground">Hybrid Signature Spectrums</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Compare concatenation, nesting, and a local shared-binding model. Observe component
            checks and a public-only replacement experiment; these do not establish a security
            proof.
          </p>
        </div>
      </div>

      {/* HSM status banner */}
      {hsmStatus === 'loading' && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 border border-border rounded-lg px-3 py-2">
          <Loader2 size={13} className="animate-spin shrink-0" aria-hidden="true" />
          Loading softhsmv3 WASM for concatenation / nesting ML-DSA operations…
        </div>
      )}
      {hsmStatus === 'error' && (
        <div className="flex flex-col gap-2 text-xs text-status-error bg-status-error/5 border border-status-error/20 rounded-lg px-3 py-2">
          <div className="flex items-center gap-2 flex-wrap">
            <ShieldAlert size={13} className="shrink-0" />
            <span className="text-sm">
              softhsmv3 WASM failed to load — concatenation and nesting unavailable. The
              shared-binding model still works via @noble.
            </span>
            {hsmInitAttempts < 3 ? (
              <Button
                variant="outline"
                size="sm"
                onClick={retryInit}
                className="h-7 text-xs gap-1 shrink-0 text-foreground"
              >
                <RotateCcw size={12} />
                Retry
              </Button>
            ) : (
              <span className="ml-auto font-medium">
                WASM failed to load after 3 attempts — try refreshing the page.
              </span>
            )}
          </div>
          {hsmInitError && (
            <details className="mt-1">
              <summary className="cursor-pointer text-status-error/80 hover:text-status-error select-none">
                Show diagnostic details
              </summary>
              <pre className="mt-2 text-[11px] font-mono whitespace-pre-wrap break-words bg-status-error/10 border border-status-error/20 rounded p-2 text-status-error/90 max-h-48 overflow-y-auto">
                {hsmInitError}
              </pre>
            </details>
          )}
        </div>
      )}
      {hsmStatus === 'ready' && (
        <div className="flex items-center gap-2 text-xs text-status-success bg-status-success/5 border border-status-success/20 rounded-lg px-3 py-2">
          <Server size={13} className="shrink-0" />
          softhsmv3 WASM ready · CKM_ML_DSA (PKCS#11 v3.2) active for concatenation / nesting
        </div>
      )}

      <details className="mb-4">
        <summary className="flex items-center gap-2 cursor-pointer rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/30 transition-colors w-full text-left">
          <HelpCircle size={14} className="text-primary shrink-0" />
          Why hybrid signatures? — Migration context
          <ChevronDown size={14} className="ml-auto text-muted-foreground" />
        </summary>
        <div className="mt-2 rounded-lg border border-border bg-muted/10 px-4 py-3 text-sm text-muted-foreground space-y-2">
          <p>
            During the PQC transition, systems must support verifiers that understand{' '}
            <strong className="text-foreground">only classical algorithms</strong> (legacy) and
            verifiers that require{' '}
            <strong className="text-foreground">post-quantum algorithms</strong> (future-safe).
            Hybrid signatures let one signed artifact satisfy both.
          </p>
          <p>
            The critical security question is:{' '}
            <strong className="text-foreground">
              what prevents an attacker from stripping the PQC component?
            </strong>{' '}
            If they can, the document is no longer quantum-safe — it degrades silently to classical
            security. This tool explores that question with component checks and a limited local
            binding experiment.
          </p>
          <p className="text-xs">
            Standards: IETF draft-ietf-lamps-pq-composite-sigs (a labelled concatenation, not the
            bare form shown here); RFC 9955, Hybrid Signature Spectrums (the concatenation, nesting
            and fused categories); ePrint 2025/2059 (Silithium).
          </p>
        </div>
      </details>

      {/* Construction tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-4">
        {CONSTRUCTIONS.map((c) => {
          const CIcon = c.icon
          const isActive = activeConstruction === c.id
          const constructionState = state[c.id]
          const hasKeys = constructionState?.keys !== null
          return (
            <Button
              key={c.id}
              variant={isActive ? 'gradient' : 'outline'}
              onClick={() => setActiveConstruction(c.id)}
              className="flex items-center gap-2 text-sm relative"
            >
              <CIcon size={15} />
              {c.label}
              {hasKeys && (
                <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-status-success shadow-[0_0_4px_rgba(var(--status-success),0.8)]" />
              )}
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
              {current.sigResult.separable
                ? 'Separable'
                : activeConstruction === 'silithium'
                  ? current.verifyResult
                    ? 'Shared-binding model — component checks shown below'
                    : 'Shared-binding model — verification not run'
                  : 'Non-Separable'}
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
          onChange={(e) => changeMessage(e.target.value)}
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
            <Loader2 size={15} className="animate-spin" aria-hidden="true" />
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
          {current.loading && signPhase ? (
            <>
              <Loader2 size={15} className="animate-spin" aria-hidden="true" />
              {signPhase}
            </>
          ) : current.loading ? (
            <>
              <Loader2 size={15} className="animate-spin" aria-hidden="true" />
              Signing...
            </>
          ) : (
            <>
              <Lock size={15} />
              Sign
            </>
          )}
        </Button>
        <Button
          variant="gradient"
          onClick={() => handleVerify(activeConstruction)}
          disabled={!current.sigResult || current.loading}
          className="flex items-center gap-2"
        >
          {current.loading ? (
            <Loader2 size={15} className="animate-spin" aria-hidden="true" />
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
              <Loader2 size={15} className="animate-spin" aria-hidden="true" />
            ) : (
              <Target size={15} />
            )}
            Recombination Attack
          </Button>
        )}
      </div>

      {/* Operation log + indeterminate progress bar (A7) */}
      {logEntries.length > 0 && <WorkshopOperationLog entries={logEntries} className="max-h-40" />}

      {/* The operation log above narrates the workshop in prose; this is the
          actual PKCS#11 wire trace behind it, in the same format every other
          HSM-backed playground uses. ML-DSA-65 runs on softhsmv3 (Rust); the
          EC-Schnorr half is @noble, since PKCS#11 has no Schnorr mechanism. */}
      <Pkcs11LogPanel
        log={pkcs11Log}
        title="Hybrid Signatures — PKCS#11 trace (ML-DSA-65 via softhsmv3)"
        emptyMessage="No PKCS#11 calls yet — generate a key pair to see the ML-DSA-65 operations. The EC-Schnorr component runs in @noble and will not appear here."
      />

      {/* Error */}
      {current.error && (
        <ErrorAlert message={current.error} onRetry={() => void handleKeygen(activeConstruction)} />
      )}

      {/* Key info */}
      {current.keys && renderKeys(current.keys)}

      {/* Signature result */}
      {current.sigResult && (
        <div className="glass-panel p-4 space-y-4">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Lock size={15} className="text-primary" />
            Signature ({meta.label})
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
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <span className="text-muted-foreground">EC component (R‖s):</span>
                <CopyButton
                  text={current.sigResult.components.ecPart}
                  label="Copy"
                  className="h-6 min-h-[24px] px-2 py-0 text-[10px]"
                />
              </div>
              <span className="text-foreground break-all">
                {hexPreview(current.sigResult.components.ecPart, 64)}
              </span>
            </div>
            <div>
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <span className="text-muted-foreground">ML-DSA component:</span>
                <CopyButton
                  text={current.sigResult.components.mlPart}
                  label="Copy"
                  className="h-6 min-h-[24px] px-2 py-0 text-[10px]"
                />
              </div>
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
                  Local model: H(R ‖ pk_ec ‖ pk_ml ‖ msg), expanded to a 64-byte input
                </div>
                <div className="text-muted-foreground mt-0.5 text-[10px] italic">
                  This model uses the provider’s internal externalMu extension. Its input and
                  operations are not the published Silithium transcript or a standardized external
                  signature profile.
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
              label="EC component in full binding"
              pass={current.verifyResult.ecValid === true}
              detail={
                current.verifyResult.ecValid
                  ? 'EC component check passed'
                  : 'EC component check did not pass'
              }
            />
            <ResultBadge
              label="ML-DSA component in full binding"
              pass={current.verifyResult.mlValid === true}
              detail={
                current.verifyResult.mlValid
                  ? 'ML-DSA component check passed'
                  : 'ML-DSA component check did not pass'
              }
            />
            <ResultBadge
              label="EC-Schnorr alone"
              pass={current.verifyResult.ecAloneValid}
              warn={current.verifyResult.ecAloneValid}
              detail={
                current.verifyResult.ecAloneValid
                  ? activeConstruction === 'silithium'
                    ? 'Raw-message EC check passed in this sample'
                    : 'Separable ⚠ — EC strips cleanly'
                  : 'Raw-message EC check did not pass'
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
                    ? 'Raw-message ML-DSA check did not pass'
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
                  The raw-message EC check did not pass. This local model signs with a shared
                  challenge that also includes the ML public key. These observed component results
                  do not prove Strong Non-Separability or the security of published Silithium; that
                  construction and its analysis are separate research.
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
            Keep the legitimate EC public key and original EC signature bytes. A replacement ML
            signer uses only its own ML secret and the public commitment to sign the new bound
            input. The legitimate EC secret is not used for this experiment.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ResultBadge
              label="Spliced sig verify"
              pass={current.recombinationResult.valid}
              detail={
                current.recombinationResult.valid
                  ? 'Combined replacement check passed'
                  : 'Combined replacement check did not pass'
              }
            />
            <ResultBadge
              label="EC under replacement binding"
              pass={current.recombinationResult.ecValid === true}
              detail={
                current.recombinationResult.ecValid
                  ? 'EC component check passed'
                  : 'EC component check did not pass'
              }
            />
            <ResultBadge
              label="ML-DSA under replacement binding"
              pass={current.recombinationResult.mlValid === true}
              detail={
                current.recombinationResult.mlValid
                  ? 'ML-DSA component check passed'
                  : 'ML-DSA component check did not pass'
              }
            />
          </div>
          <div className="flex gap-2 p-3 rounded-lg border border-status-success/20 bg-status-success/5 text-xs text-muted-foreground">
            <ShieldCheck size={14} className="shrink-0 mt-0.5 text-status-success" />
            <span>
              {current.recombinationResult.ecValid === false &&
              current.recombinationResult.mlValid === true
                ? 'Observed: the replacement ML check passed and the original EC response did not pass under the changed binding. The EC public key was unchanged. This is a local binding experiment, not a general security proof.'
                : 'Read each component result above. This local experiment does not establish general non-separability or a published-scheme security proof.'}
            </span>
          </div>
        </div>
      )}

      {/* Educational disclaimer */}
      <div className="flex gap-2 p-3 bg-muted/50 rounded-lg border border-border text-xs text-muted-foreground">
        <Info size={14} className="shrink-0 mt-0.5" />
        <span>
          Educational demonstration. Keys are ephemeral and never leave your browser. The local
          shared-binding model uses fresh random EC signing nonces and is inspired by{' '}
          <a
            href="https://eprint.iacr.org/2025/2059"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            ePrint 2025/2059
          </a>{' '}
          (Devevey, Guerreau, Roméas). Its approximation uses ML-DSA external-μ operations; it is
          not the published scheme or its security proof.
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
