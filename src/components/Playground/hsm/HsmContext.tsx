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
  hsm_getKeyAttributes,
  hsm_getSessionInfo,
  hsm_getAllSlots,
} from '../../../wasm/softhsm'
import { keyIdentity } from '../keystore/keyIdentity'

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
  /**
   * Which crypto token slot this key belongs to (e.g., Slot 1 = Client,
   * Slot 2 = Server). Required — derived at registration time via
   * `C_GetSessionInfo`, never left to a caller to guess or omit. Part of
   * `keyIdentity()`, and the unit every remove/clear operation scopes to.
   */
  slotId: number
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
   *
   * Required — derived at registration time via `registerKey`, never left
   * unset. The durable half of `keyIdentity()`.
   */
  uniqueId: string
  /**
   * Which WASM instance owns this key. Defaults to 'main' (panel softhsm). VPN sim uses
   * 'worker-init' / 'worker-resp' for keys that live inside a strongSwan worker's local
   * softhsmv3 — those handles are invalid in the panel WASM and require worker RPC to inspect.
   */
  wasmContext?: 'main' | 'worker-init' | 'worker-resp'
}

/**
 * A key identity, for `removeHsmKey` — either a precomputed `keyIdentity()`
 * string, or any object carrying the three identity fields (a full `HsmKey`
 * satisfies this).
 */
export type KeyIdentityInput = string | Pick<HsmKey, 'wasmContext' | 'slotId' | 'uniqueId'>

/**
 * The unit `clearHsmKeys` operates on. Scope is required — no bare "clear
 * everything" — because a shared registry has more than one logical owner
 * (e.g. the VPN sim's client and server panes) and an unscoped clear from
 * one pane silently wiped the other's keys too (the cross-slot-clear bug
 * this type exists to make impossible). `'all'` is a rare, explicit
 * escape hatch for genuinely-global resets (e.g. the ACVP suite wiping the
 * whole inventory at the start of a fresh run) — never a default.
 */
export type ClearKeysScope =
  | { slotId: number }
  | { sessionHandle: number }
  | { wasmContext: HsmKey['wasmContext'] }
  | 'all'

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
   * Internal registry write — the caller must already know the key's full
   * identity (`uniqueId`, `slotId`). Used by `registerKey` and by
   * discovery (`discoverHsmObjects.ts`), which derives identity itself
   * while enumerating live objects. Every other caller should use
   * `registerKey` instead, so identity is never skipped.
   */
  addHsmKey: (key: HsmKey) => HsmKey
  /**
   * Register a key right after generation/import. Derives `uniqueId`
   * (CKA_UNIQUE_ID, read on `M`/`hSession` — the same module/session the
   * key was just created on) and `slotId` (`C_GetSessionInfo(hSession)
   * .slotID`), stamps them on, then writes the row via `addHsmKey`. This
   * is the ONLY way panel code should register a key — never call
   * `addHsmKey` directly with a hand-built identity.
   */
  registerKey: (
    M: SoftHSMModule,
    hSession: number,
    partial: Omit<HsmKey, 'uniqueId' | 'slotId'>
  ) => HsmKey
  /**
   * Remove a single key by identity (e.g. after explicit C_DestroyObject).
   * Takes a `keyIdentity()` string or any object carrying the identity
   * fields (a full `HsmKey` works) — never a bare handle, which is
   * session-scoped and can collide across slots.
   */
  removeHsmKey: (identity: KeyIdentityInput) => void
  /**
   * Remove every key matching `scope` — slot, session, or wasm context.
   * Scope is required; `'all'` is the explicit, rare "really clear
   * everything" case (see `ClearKeysScope`).
   */
  clearHsmKeys: (scope: ClearKeysScope) => void
  /**
   * Teardown hook — call when a session closes (VPN Reset, a mode/KEM-size
   * change that reopens sessions, the Developer tab's dev-slot unmount)
   * so keys registered on it don't linger as orphans. Equivalent to
   * `clearHsmKeys({ sessionHandle })`, named for the teardown call site's
   * own clarity.
   */
  forgetSession: (hSession: number) => void
  /**
   * Teardown hook — call when a slot is re-formatted (`C_InitToken` on an
   * already-initialized slot) so keys from the PREVIOUS token on that slot
   * don't linger as orphans pointing at objects that no longer exist.
   * Equivalent to `clearHsmKeys({ slotId })`.
   */
  forgetSlot: (slotId: number) => void
  /**
   * Drop every registered key whose `slotId` no longer appears in
   * `C_GetSlotList` on `M` — e.g. a slot removed/re-enumerated by an
   * engine restart. Cheap (one C_GetSlotList call); safe to call on every
   * key table mount. Silently does nothing if the slot list can't be read
   * (leaves the registry alone rather than guess).
   */
  pruneDeadSlots: (M: SoftHSMModule) => void
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
  /**
   * Declare which workshop surface is active (`operate:kem`, `build:acvp`,
   * `learn`, …) with a human label ("Operate · KEM"). Every call logged from
   * then on is stamped `origin`, and the first call after a change gets a
   * step-header row carrying the label — so the ONE shared Inspect log
   * groups by user action without every panel threading its own header.
   * Called by the playground shell on tab/rail changes; panels never call it.
   */
  setLogOrigin: (origin: string, label: string) => void

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

  const registerKey = useCallback(
    (M: SoftHSMModule, hSession: number, partial: Omit<HsmKey, 'uniqueId' | 'slotId'>): HsmKey => {
      let uniqueId = ''
      try {
        uniqueId = hsm_getKeyAttributes(M, hSession, partial.handle).ckUniqueId ?? ''
      } catch (err) {
        console.error('registerKey: could not read CKA_UNIQUE_ID for handle', partial.handle, err)
      }
      let slotId = -1
      try {
        slotId = hsm_getSessionInfo(M, hSession).slotID
      } catch (err) {
        console.error('registerKey: could not read slotID for session', hSession, err)
      }
      return addHsmKey({ ...partial, uniqueId, slotId })
    },
    [addHsmKey]
  )

  const removeHsmKey = useCallback((identity: KeyIdentityInput) => {
    const id = typeof identity === 'string' ? identity : keyIdentity(identity)
    hsmKeysRef.current = hsmKeysRef.current.filter((k) => keyIdentity(k) !== id)
    setHsmKeys(hsmKeysRef.current)
  }, [])

  const clearHsmKeys = useCallback((scope: ClearKeysScope) => {
    if (scope === 'all') {
      hsmKeysRef.current = []
      setHsmKeys([])
      return
    }
    hsmKeysRef.current = hsmKeysRef.current.filter((k) => {
      if ('slotId' in scope) return k.slotId !== scope.slotId
      if ('sessionHandle' in scope) return k.sessionHandle !== scope.sessionHandle
      return (k.wasmContext ?? 'main') !== scope.wasmContext
    })
    setHsmKeys(hsmKeysRef.current)
  }, [])

  const forgetSession = useCallback(
    (hSession: number) => clearHsmKeys({ sessionHandle: hSession }),
    [clearHsmKeys]
  )

  const forgetSlot = useCallback((slotId: number) => clearHsmKeys({ slotId }), [clearHsmKeys])

  const pruneDeadSlots = useCallback((M: SoftHSMModule) => {
    let liveSlots: Set<number>
    try {
      liveSlots = new Set(hsm_getAllSlots(M))
    } catch (err) {
      console.error('pruneDeadSlots: could not read C_GetSlotList — leaving registry as-is', err)
      return
    }
    const deadSlotIds = new Set(
      hsmKeysRef.current.map((k) => k.slotId).filter((slotId) => !liveSlots.has(slotId))
    )
    if (deadSlotIds.size === 0) return
    hsmKeysRef.current = hsmKeysRef.current.filter((k) => !deadSlotIds.has(k.slotId))
    setHsmKeys(hsmKeysRef.current)
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

  // Active-surface origin stamp (see `setLogOrigin` in the interface).
  // `pendingHeader` is the label of an origin change no call has been logged
  // under yet — emitted lazily as a step-header row right before the first
  // real call, so merely visiting a tab never clutters the log.
  const logOriginRef = useRef<{ origin: string; label: string; pendingHeader: boolean }>({
    origin: 'setup',
    label: 'Setup',
    pendingHeader: false,
  })

  const addHsmLog = useCallback((e: Pkcs11LogEntry) => {
    const o = logOriginRef.current
    let head = hsmLogRef.current
    if (!e.isStepHeader && o.pendingHeader) {
      o.pendingHeader = false
      head = [
        {
          id: Math.random(),
          timestamp: e.timestamp,
          fn: o.label,
          args: '',
          rvHex: '',
          rvName: '',
          ms: 0,
          ok: true,
          isStepHeader: true,
          origin: o.origin,
        },
        ...head,
      ]
    }
    const stamped: Pkcs11LogEntry = e.origin ? e : { ...e, origin: o.origin }
    const next = [stamped, ...head]
    // 1000, not 500: a full run through both Learn-tab tracks in one
    // sitting (17 lessons) plus workbench-tab use in the same session
    // can approach the old cap, silently dropping early lessons' rows.
    const capped = next.length > 1000 ? next.slice(0, 1000) : next
    hsmLogRef.current = capped
    setHsmLog(capped)
  }, [])

  const setLogOrigin = useCallback((origin: string, label: string) => {
    const o = logOriginRef.current
    if (o.origin === origin) return
    logOriginRef.current = { origin, label, pendingHeader: true }
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
        // A re-format of an already-used slot invalidates whatever was
        // registered against it; unconditional and cheap when there's
        // nothing to forget.
        forgetSlot(newSlot)
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
    [engineMode, addHsmLog, forgetSlot]
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
      registerKey,
      removeHsmKey,
      clearHsmKeys,
      forgetSession,
      forgetSlot,
      pruneDeadSlots,
      latestKey,
      keysForFamily,
      hsmLog,
      hsmLogRef,
      addHsmLog,
      clearHsmLog,
      addHsmStepLog,
      setLogOrigin,
      autoInit,
    }),
    [
      engineMode,
      phase,
      tokenCreated,
      isReady,
      hsmKeys,
      addHsmKey,
      registerKey,
      removeHsmKey,
      clearHsmKeys,
      forgetSession,
      forgetSlot,
      pruneDeadSlots,
      latestKey,
      keysForFamily,
      hsmLog,
      addHsmLog,
      clearHsmLog,
      addHsmStepLog,
      setLogOrigin,
      autoInit,
    ]
  )

  return <HsmContext.Provider value={value}>{children}</HsmContext.Provider>
}
