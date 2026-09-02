// SPDX-License-Identifier: GPL-3.0-only
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import type { Pkcs11LogEntry } from '../../../wasm/softhsm'
import {
  getSoftHSMCppModule,
  getSoftHSMRustModule,
  createLoggingProxy,
  hsm_initialize,
  hsm_finalize,
  hsm_getFirstSlot,
  hsm_initToken,
  hsm_openUserSession,
} from '../../../wasm/softhsm'

// ── Types ──────────────────────────────────────────────────────────────────

export type HsmPhase = 'idle' | 'initialized' | 'session_open'
export type HsmFamily =
  | 'ml-kem'
  | 'frodo-kem'
  | 'classic-mceliece'
  | 'ml-dsa'
  | 'slh-dsa'
  | 'hss'
  | 'lms'
  | 'xmss'
  | 'rsa'
  | 'ecdsa'
  | 'eddsa'
  | 'ecdh'
  | 'kdf'
  | 'aes'
  | 'chacha20'
  | 'hmac'
  | 'sha'
  | 'hpke'

export type EngineMode = 'software' | 'cpp' | 'rust' | 'dual'

export type HsmKeyRole = 'public' | 'private' | 'secret'

/** Semantic purpose of a key within a provisioning or crypto workflow */
export type HsmKeyPurpose = 'attestation' | 'application' | 'tls' | 'kek' | 'general'

export interface HsmKey {
  handle: number
  family: HsmFamily
  role: HsmKeyRole
  /** Human-readable label, e.g. "ML-DSA-65 Private Key" */
  label: string
  /** Variant/size identifier, e.g. "65", "P-256", "2048", "sha2-128s" */
  variant?: string
  /** Which PKCS#11 engine owns this key (for dual-mode attribute reads) */
  engine?: 'cpp' | 'rust'
  /** Wall-clock time when generated (for display) */
  generatedAt: string
  /** Semantic role in a provisioning workflow (optional, defaults to 'general') */
  purpose?: HsmKeyPurpose
  /** Which crypto token slot this key belongs to (e.g., Slot 1 = Client, Slot 2 = Server) */
  slotId?: number
  /** Raw public key bytes (CKA_VALUE), cached at generation time for cross-engine transport */
  rawBytes?: Uint8Array
  /** CKA_PARAMETER_SET value (e.g. CKP_XMSS_*), required for C_CreateObject on XMSS public keys */
  paramSet?: number
  /** PKCS#11 session handle that owns this key (for multi-session scenarios like VPN sim) */
  sessionHandle?: number
  /**
   * CKA_UNIQUE_ID — the object's durable identity. `handle` is a
   * session-specific lookup result (PKCS#11 v3.2 §3.2: a handle is only
   * meaningful within the session that returned it), never stable across
   * a re-opened session — real bug found live 2026-08-30: the Developer
   * tab registered a handle printed by the script's OWN (now-closed)
   * session, and a fresh session saw the same private key under a
   * DIFFERENT handle (106 vs the real 107), so every attribute read
   * failed with CKR_OBJECT_HANDLE_INVALID. When present, callers must
   * re-resolve the current handle via a CKA_UNIQUE_ID find before reading
   * attributes — never trust a stored `handle` across a session boundary.
   */
  uniqueId?: string
  /**
   * Which WASM instance owns this key. Defaults to 'main' (panel softhsm). VPN sim uses
   * 'worker-init' / 'worker-resp' for keys that live inside a strongSwan worker's local
   * softhsmv3 — those handles are invalid in the panel WASM and require worker RPC to inspect.
   */
  wasmContext?: 'main' | 'worker-init' | 'worker-resp'
}

export interface HsmContextValue {
  // ── WASM handles ──────────────────────────────────────────────────────────
  /** Primary execution engine */
  moduleRef: React.MutableRefObject<SoftHSMModule | null>
  /**
   * The SAME module as `moduleRef`, unwrapped (no logging proxy) — for
   * internal bookkeeping calls that aren't part of any lesson's taught
   * content and must never appear in the call log (e.g. discoverHsmObjects'
   * per-step registry sync). Never use this for anything a learner should
   * see; use `moduleRef` for that.
   */
  rawModuleRef: React.MutableRefObject<SoftHSMModule | null>
  /** Secondary execution engine (fallback verification) */
  crossCheckModuleRef: React.MutableRefObject<SoftHSMModule | null>
  hSessionRef: React.MutableRefObject<number>
  slotRef: React.MutableRefObject<number>
  /** Execution Configuration */
  engineMode: EngineMode
  setEngineMode: React.Dispatch<React.SetStateAction<EngineMode>>

  // ── Token lifecycle ───────────────────────────────────────────────────────
  phase: HsmPhase
  setPhase: (p: HsmPhase) => void
  tokenCreated: boolean
  setTokenCreated: (v: boolean) => void
  /** True when phase === 'session_open' — gates all HSM operations */
  isReady: boolean

  // ── Key registry ──────────────────────────────────────────────────────────
  /** All PKCS#11 key handles generated during this session */
  hsmKeys: HsmKey[]
  /**
   * Always-current mirror of `hsmKeys` — read this instead of `hsmKeys`
   * when checking "is this handle already registered" inside a loop that
   * calls `addHsmKey` more than once per tick (a plain state read would be
   * stale until the next render, causing duplicate registrations).
   */
  hsmKeysRef: React.MutableRefObject<HsmKey[]>
  /**
   * Register a key after generation. Returns the registered key for
   * convenience (same object that was passed in).
   */
  addHsmKey: (key: HsmKey) => HsmKey
  /** Remove a single key by handle (e.g. after explicit C_DestroyObject) */
  removeHsmKey: (handle: number) => void
  /** Wipe the registry — call when session closes or HSM is finalized */
  clearHsmKeys: () => void
  /**
   * Look up the most recently generated key for a given family + role.
   * Returns undefined if none have been generated yet.
   */
  latestKey: (family: HsmFamily, role: HsmKeyRole) => HsmKey | undefined
  /** All keys for a given family + role, newest first */
  keysForFamily: (family: HsmFamily, role: HsmKeyRole) => HsmKey[]

  // ── PKCS#11 call log ─────────────────────────────────────────────────────
  hsmLog: Pkcs11LogEntry[]
  /**
   * Always-current mirror of `hsmLog` — read this instead of `hsmLog` when
   * you need a synchronous snapshot inside one tick (e.g. "how many log
   * entries existed right before this step started"). A plain state read
   * would be stale until the next render, exactly the closure-over-stale-
   * state bug class this file's `hsmKeysRef` was already introduced to avoid.
   */
  hsmLogRef: React.MutableRefObject<Pkcs11LogEntry[]>
  addHsmLog: (e: Pkcs11LogEntry) => void
  clearHsmLog: () => void
  /** Inject a visual step-separator entry into the log (isStepHeader: true). Call BEFORE the step's ops. */
  addHsmStepLog: (label: string) => void

  // ── Auto-init (deep-link / programmatic) ─────────────────────────────────
  /**
   * Silently run the full 3-step HSM init (load WASM → init token → open
   * session) without requiring button clicks. Used by deep-link URL handling
   * so recipients can land directly on an operation tab.
   * @param engine - Override engine mode for this init (optional; defaults to current engineMode)
   * @returns true on success, false if any step fails
   */
  autoInit: (engine?: EngineMode) => Promise<boolean>
  /**
   * The error message from the most recent `autoInit` failure, or null if
   * the last call succeeded (or none has run yet). `autoInit`'s own return
   * value stays a plain boolean for every existing caller — this is an
   * additive diagnostic for callers that need to know *why* init failed
   * (e.g. a conformance runner surfacing a real init failure instead of a
   * bare false).
   */
  lastInitErrorRef: React.MutableRefObject<string | null>
}

// ── Context ────────────────────────────────────────────────────────────────

const HsmContext = createContext<HsmContextValue | undefined>(undefined)

export const useHsmContext = (): HsmContextValue => {
  const ctx = useContext(HsmContext)
  if (!ctx) throw new Error('useHsmContext must be used within HsmProvider')
  return ctx
}

// ── Provider ───────────────────────────────────────────────────────────────

export const HsmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const moduleRef = useRef<SoftHSMModule | null>(null)
  const rawModuleRef = useRef<SoftHSMModule | null>(null)
  const crossCheckModuleRef = useRef<SoftHSMModule | null>(null)
  const hSessionRef = useRef<number>(0)
  const slotRef = useRef<number>(0)
  /** Real bug found live (dev-tabs-pkcs11-kmip plan G9, W1): the deep-link
   *  mount effect (HsmPlayground.tsx) and a tab's own "ensure ready" effect
   *  (e.g. PkcsPipelineBuilder.tsx) can both call `autoInit()` on the SAME
   *  mount — neither guards against a call already in flight, since both
   *  read `phase === 'idle'` before either has had a chance to flip it. Two
   *  concurrent init sequences each try to claim SoftHSM's one available
   *  token slot (confirmed live: the C++ engine's WASM build starts with
   *  exactly one, per SlotManager's own upstream design — "always one slot
   *  available containing an uninitialised token" — that count does NOT
   *  grow after C_InitToken, so a second concurrent caller starves).
   *  Reproduces in a real production build too (not just React StrictMode's
   *  dev-only double-effect-invoke, which only amplifies the same race).
   *  A second call while one is in flight now joins it instead of starting
   *  an independent sequence. */
  const autoInitInFlightRef = useRef<Promise<boolean> | null>(null)
  const lastInitErrorRef = useRef<string | null>(null)

  const [engineMode, setEngineMode] = useState<EngineMode>('rust')
  const [phase, setPhase] = useState<HsmPhase>('idle')
  const [tokenCreated, setTokenCreated] = useState(false)
  const [hsmKeys, setHsmKeys] = useState<HsmKey[]>([])
  const [hsmLog, setHsmLog] = useState<Pkcs11LogEntry[]>([])
  const hsmLogRef = useRef<Pkcs11LogEntry[]>([])
  // Mirrors `hsmKeys`, updated synchronously (unlike the batched state
  // setter) so callers that add several keys in a tight loop within one
  // tick — e.g. the Learn tab's per-step object discovery — can check
  // "is this handle already registered" without racing a stale render.
  const hsmKeysRef = useRef<HsmKey[]>([])

  const isReady = phase === 'session_open'

  const addHsmKey = useCallback((key: HsmKey): HsmKey => {
    hsmKeysRef.current = [key, ...hsmKeysRef.current]
    setHsmKeys(hsmKeysRef.current)
    return key
  }, [])

  const removeHsmKey = useCallback((handle: number) => {
    hsmKeysRef.current = hsmKeysRef.current.filter((k) => k.handle !== handle)
    setHsmKeys(hsmKeysRef.current)
  }, [])

  const clearHsmKeys = useCallback(() => {
    hsmKeysRef.current = []
    setHsmKeys([])
  }, [])

  const latestKey = useCallback(
    (family: HsmFamily, role: HsmKeyRole): HsmKey | undefined =>
      hsmKeys.find((k) => k.family === family && k.role === role),
    [hsmKeys]
  )

  const keysForFamily = useCallback(
    (family: HsmFamily, role: HsmKeyRole): HsmKey[] =>
      hsmKeys.filter((k) => k.family === family && k.role === role),
    [hsmKeys]
  )

  const addHsmLog = useCallback((e: Pkcs11LogEntry) => {
    const next = [e, ...hsmLogRef.current]
    // 1000, not 500: a full run through both Learn-tab tracks in one
    // sitting (17 lessons) plus workbench-tab use in the same session
    // can approach the old cap, silently dropping early lessons' rows.
    const capped = next.length > 1000 ? next.slice(0, 1000) : next
    hsmLogRef.current = capped
    setHsmLog(capped)
  }, [])

  const clearHsmLog = useCallback(() => {
    hsmLogRef.current = []
    setHsmLog([])
  }, [])

  const addHsmStepLog = useCallback(
    (label: string) => {
      addHsmLog({
        id: Math.random(),
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
        fn: label,
        args: '',
        rvHex: '',
        rvName: '',
        ms: 0,
        ok: true,
        isStepHeader: true,
      })
    },
    [addHsmLog]
  )

  const autoInitImpl = useCallback(
    async (engine?: EngineMode): Promise<boolean> => {
      const mode = engine ?? engineMode
      if (engine) setEngineMode(mode)
      lastInitErrorRef.current = null
      try {
        // Step 1: load WASM module(s) and call C_Initialize
        let M: SoftHSMModule | null = null
        let checkM: SoftHSMModule | null = null
        if (mode === 'cpp') {
          M = await getSoftHSMCppModule()
        } else if (mode === 'rust') {
          M = await getSoftHSMRustModule()
        } else if (mode === 'dual') {
          M = await getSoftHSMCppModule()
          checkM = await getSoftHSMRustModule()
        } else {
          throw new Error('Unknown engine mode')
        }
        const engineLabel = mode === 'rust' ? 'rust' : 'cpp'
        rawModuleRef.current = M
        const proxy = createLoggingProxy(M, addHsmLog, engineLabel)
        moduleRef.current = proxy
        // The WASM modules are singletons, so a prior init (e.g. the user
        // switching engine mode without reloading) leaves C_Initialize already
        // called — re-initializing would throw CKR_CRYPTOKI_ALREADY_INITIALIZED.
        // Finalize first; it's a best-effort no-op when nothing was initialized.
        // On the raw module, not the proxy — this guard isn't part of any
        // lesson's taught content and shouldn't ever show up as a confusing
        // "CKR_CRYPTOKI_NOT_INITIALIZED" pair before a learner's first step.
        hsm_finalize(M, hSessionRef.current)
        hsm_initialize(proxy)
        if (checkM) {
          const cp = createLoggingProxy(checkM, addHsmLog, 'rust')
          crossCheckModuleRef.current = cp
          hsm_finalize(checkM, hSessionRef.current)
          hsm_initialize(cp)
        }
        setPhase('initialized')

        // Step 2: init token
        const slot0 = hsm_getFirstSlot(proxy)
        const newSlot = hsm_initToken(proxy, slot0, '12345678', 'SoftHSM3')
        slotRef.current = newSlot
        setTokenCreated(true)

        // Step 3: open session and login
        const hSession = hsm_openUserSession(proxy, newSlot, '12345678', 'user1234')
        hSessionRef.current = hSession
        setPhase('session_open')
        return true
      } catch (err) {
        lastInitErrorRef.current = err instanceof Error ? err.message : String(err)
        moduleRef.current = null
        rawModuleRef.current = null
        crossCheckModuleRef.current = null
        return false
      }
    },
    [engineMode, addHsmLog]
  )

  const autoInit = useCallback(
    (engine?: EngineMode): Promise<boolean> => {
      if (autoInitInFlightRef.current) return autoInitInFlightRef.current
      const run = autoInitImpl(engine).finally(() => {
        autoInitInFlightRef.current = null
      })
      autoInitInFlightRef.current = run
      return run
    },
    [autoInitImpl]
  )

  // E2E test hook: exposes autoInit on window so Playwright can advance the
  // HSM phase to 'session_open' without driving the UI. Used by
  // e2e/acvp-validator.spec.ts (the runTests() guard at HsmAcvpTesting.tsx
  // returns early unless phase === 'session_open').
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // @ts-expect-error e2e hook augmenting global window
      window.__e2e_hsm_autoinit = autoInit
    }
  }, [autoInit])

  const value = useMemo<HsmContextValue>(
    () => ({
      moduleRef,
      rawModuleRef,
      crossCheckModuleRef,
      hSessionRef,
      slotRef,
      lastInitErrorRef,
      engineMode,
      setEngineMode,
      phase,
      setPhase,
      tokenCreated,
      setTokenCreated,
      isReady,
      hsmKeys,
      hsmKeysRef,
      addHsmKey,
      removeHsmKey,
      clearHsmKeys,
      latestKey,
      keysForFamily,
      hsmLog,
      hsmLogRef,
      addHsmLog,
      clearHsmLog,
      addHsmStepLog,
      autoInit,
    }),
    [
      engineMode,
      phase,
      tokenCreated,
      isReady,
      hsmKeys,
      addHsmKey,
      removeHsmKey,
      clearHsmKeys,
      latestKey,
      keysForFamily,
      hsmLog,
      addHsmLog,
      clearHsmLog,
      addHsmStepLog,
      autoInit,
    ]
  )

  return <HsmContext.Provider value={value}>{children}</HsmContext.Provider>
}
