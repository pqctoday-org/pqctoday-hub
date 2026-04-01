// SPDX-License-Identifier: GPL-3.0-only
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import type { Pkcs11LogEntry } from '../../../wasm/softhsm'
import {
  getSoftHSMCppModule,
  getSoftHSMRustModule,
  createLoggingProxy,
  hsm_initialize,
  hsm_getFirstSlot,
  hsm_initToken,
  hsm_openUserSession,
} from '../../../wasm/softhsm'

// ── Types ──────────────────────────────────────────────────────────────────

export type HsmPhase = 'idle' | 'initialized' | 'session_open'
export type HsmFamily =
  | 'ml-kem'
  | 'ml-dsa'
  | 'slh-dsa'
  | 'rsa'
  | 'ecdsa'
  | 'eddsa'
  | 'ecdh'
  | 'kdf'
  | 'aes'
  | 'hmac'
  | 'sha'

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
}

export interface HsmContextValue {
  // ── WASM handles ──────────────────────────────────────────────────────────
  /** Primary execution engine */
  moduleRef: React.MutableRefObject<SoftHSMModule | null>
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
  addHsmLog: (e: Pkcs11LogEntry) => void
  clearHsmLog: () => void

  // ── Inspect mode ──────────────────────────────────────────────────────────
  /** When true the PKCS#11 log panel decodes parameter structures inline */
  inspectMode: boolean
  toggleInspect: () => void

  // ── Auto-init (deep-link / programmatic) ─────────────────────────────────
  /**
   * Silently run the full 3-step HSM init (load WASM → init token → open
   * session) without requiring button clicks. Used by deep-link URL handling
   * so recipients can land directly on an operation tab.
   * @param engine - Override engine mode for this init (optional; defaults to current engineMode)
   * @returns true on success, false if any step fails
   */
  autoInit: (engine?: EngineMode) => Promise<boolean>
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
  const crossCheckModuleRef = useRef<SoftHSMModule | null>(null)
  const hSessionRef = useRef<number>(0)
  const slotRef = useRef<number>(0)

  const [engineMode, setEngineMode] = useState<EngineMode>('cpp')
  const [phase, setPhase] = useState<HsmPhase>('idle')
  const [tokenCreated, setTokenCreated] = useState(false)
  const [hsmKeys, setHsmKeys] = useState<HsmKey[]>([])
  const [hsmLog, setHsmLog] = useState<Pkcs11LogEntry[]>([])
  const [inspectMode, setInspectMode] = useState(false)

  const isReady = phase === 'session_open'

  const addHsmKey = useCallback((key: HsmKey): HsmKey => {
    setHsmKeys((prev) => [key, ...prev])
    return key
  }, [])

  const removeHsmKey = useCallback((handle: number) => {
    setHsmKeys((prev) => prev.filter((k) => k.handle !== handle))
  }, [])

  const clearHsmKeys = useCallback(() => {
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
    setHsmLog((prev) => {
      const next = [e, ...prev]
      return next.length > 500 ? next.slice(0, 500) : next
    })
  }, [])

  const clearHsmLog = useCallback(() => {
    setHsmLog([])
  }, [])

  const toggleInspect = useCallback(() => setInspectMode((m) => !m), [])

  const autoInit = useCallback(
    async (engine?: EngineMode): Promise<boolean> => {
      const mode = engine ?? engineMode
      if (engine) setEngineMode(mode)
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
        const proxy = createLoggingProxy(M, addHsmLog, engineLabel)
        moduleRef.current = proxy
        hsm_initialize(proxy)
        if (checkM) {
          const cp = createLoggingProxy(checkM, addHsmLog, 'rust')
          crossCheckModuleRef.current = cp
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
      } catch {
        moduleRef.current = null
        crossCheckModuleRef.current = null
        return false
      }
    },
    [engineMode, addHsmLog]
  )

  const value = useMemo<HsmContextValue>(
    () => ({
      moduleRef,
      crossCheckModuleRef,
      hSessionRef,
      slotRef,
      engineMode,
      setEngineMode,
      phase,
      setPhase,
      tokenCreated,
      setTokenCreated,
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
      inspectMode,
      toggleInspect,
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
      inspectMode,
      toggleInspect,
      autoInit,
    ]
  )

  return <HsmContext.Provider value={value}>{children}</HsmContext.Provider>
}
