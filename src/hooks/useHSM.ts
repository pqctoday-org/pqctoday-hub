// SPDX-License-Identifier: GPL-3.0-only
/**
 * useHSM — self-contained WASM PKCS#11 lifecycle hook for learning modules.
 *
 * Each component that calls useHSM manages its own:
 *   - WASM module ref (shared singleton under the hood)
 *   - PKCS#11 session (hSession)
 *   - Key registry (handles generated during the session)
 *   - PKCS#11 call log (full trace of every C_* call)
 *
 * Lifecycle:
 *   initialize() → getSoftHSMModule → createLoggingProxy →
 *     C_Initialize → C_GetSlotList → C_InitToken → C_OpenSession → C_Login
 *   finalize()   → C_CloseSession (never C_Finalize — singleton must stay alive)
 *
 * All PKCS#11 calls use the logging proxy so every call appears in `log`.
 */
import { useCallback, useRef, useState } from 'react'
import {
  getSoftHSMCppModule,
  getSoftHSMRustModule,
  createLoggingProxy,
  hsm_getFirstSlot,
  hsm_initToken,
  hsm_openUserSession,
} from '../wasm/softhsm'
import type { SoftHSMModule, Pkcs11LogEntry } from '../wasm/softhsm'
import type { HsmFamily, HsmKey, HsmKeyRole } from '../components/Playground/hsm/HsmContext'

export type { HsmFamily, HsmKey, HsmKeyRole }

export type HsmPhase = 'idle' | 'loading' | 'session_open' | 'error'

/** CKR_CRYPTOKI_ALREADY_INITIALIZED — treat as success in initialize() */
const CKR_CRYPTOKI_ALREADY_INITIALIZED = 0x00000191

const SO_PIN = '12345678'
const USER_PIN = 'user1234'
const TOKEN_LABEL = 'SoftHSM3'

export interface UseHSMResult {
  phase: HsmPhase
  /** true when phase === 'session_open' */
  isReady: boolean
  error: string | null

  /** Ref to the logging-proxied WASM module (pass to hsm_* helpers) */
  moduleRef: React.MutableRefObject<SoftHSMModule | null>
  /** PKCS#11 session handle */
  hSessionRef: React.MutableRefObject<number>
  /** Slot index holding the initialized token */
  slotRef: React.MutableRefObject<number>

  // ── PKCS#11 call log ───────────────────────────────────────────────────────
  /** All PKCS#11 calls since initialize() (newest first) */
  log: Pkcs11LogEntry[]
  addLog: (e: Pkcs11LogEntry) => void
  clearLog: () => void
  /** Inject a visual step-separator entry into the log (isStepHeader: true). Call AFTER the step's ops. */
  addStepLog: (label: string) => void

  // ── Key registry ──────────────────────────────────────────────────────────
  keys: HsmKey[]
  addKey: (key: HsmKey) => HsmKey
  removeKey: (handle: number) => void
  clearKeys: () => void
  /** Most recently generated key for the given family+role */
  latestKey: (family: HsmFamily, role: HsmKeyRole) => HsmKey | undefined

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  initialize: () => Promise<void>
  finalize: () => void
}

export function useHSM(moduleEngine: 'cpp' | 'rust' = 'cpp'): UseHSMResult {
  const moduleRef = useRef<SoftHSMModule | null>(null)
  const hSessionRef = useRef<number>(0)
  const slotRef = useRef<number>(0)

  const [phase, setPhase] = useState<HsmPhase>('idle')
  const [error, setError] = useState<string | null>(null)
  const [log, setLog] = useState<Pkcs11LogEntry[]>([])
  const [keys, setKeys] = useState<HsmKey[]>([])

  const addLog = useCallback((e: Pkcs11LogEntry) => {
    setLog((prev) => {
      const next = [e, ...prev]
      return next.length > 500 ? next.slice(0, 500) : next
    })
  }, [])

  const clearLog = useCallback(() => setLog([]), [])

  const addStepLog = useCallback(
    (label: string) => {
      addLog({
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
    [addLog]
  )

  const addKey = useCallback((key: HsmKey): HsmKey => {
    setKeys((prev) => [key, ...prev])
    return key
  }, [])

  const removeKey = useCallback((handle: number) => {
    setKeys((prev) => prev.filter((k) => k.handle !== handle))
  }, [])

  const clearKeys = useCallback(() => setKeys([]), [])

  const latestKey = useCallback(
    (family: HsmFamily, role: HsmKeyRole): HsmKey | undefined =>
      keys.find((k) => k.family === family && k.role === role),
    [keys]
  )

  const initialize = useCallback(async () => {
    if (phase === 'loading' || phase === 'session_open') return
    setPhase('loading')
    setError(null)
    clearLog()
    clearKeys()
    try {
      const rawModule = await (moduleEngine === 'rust'
        ? getSoftHSMRustModule()
        : getSoftHSMCppModule())
      const proxy = createLoggingProxy(rawModule, (e) => addLog(e))
      moduleRef.current = proxy as unknown as SoftHSMModule

      // C_Initialize — accept ALREADY_INITIALIZED (another module initialized it first)
      const initRv = proxy._C_Initialize(0)
      if (initRv !== 0 && initRv !== CKR_CRYPTOKI_ALREADY_INITIALIZED) {
        throw new Error(`C_Initialize failed: 0x${initRv.toString(16).padStart(8, '0')}`)
      }

      // C_GetSlotList → C_InitToken → C_GetSlotList (re-enumerate)
      const slot0 = hsm_getFirstSlot(proxy as unknown as SoftHSMModule)
      const newSlot = hsm_initToken(proxy as unknown as SoftHSMModule, slot0, SO_PIN, TOKEN_LABEL)
      slotRef.current = newSlot

      // C_OpenSession → C_Login(SO) → C_InitPIN → C_Login(USER)
      const hSession = hsm_openUserSession(
        proxy as unknown as SoftHSMModule,
        newSlot,
        SO_PIN,
        USER_PIN
      )
      hSessionRef.current = hSession
      setPhase('session_open')
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[useHSM] initialize failed:', msg)
      setError(msg)
      setPhase('error')
    }
  }, [phase, moduleEngine, clearLog, clearKeys, addLog])

  const finalize = useCallback(() => {
    if (moduleRef.current && hSessionRef.current) {
      try {
        moduleRef.current._C_CloseSession(hSessionRef.current)
      } catch {
        // Ignore close errors (session may already be closed)
      }
    }
    moduleRef.current = null
    hSessionRef.current = 0
    slotRef.current = 0
    setPhase('idle')
    setError(null)
  }, [])

  return {
    phase,
    isReady: phase === 'session_open',
    error,
    moduleRef,
    hSessionRef,
    slotRef,
    log,
    addLog,
    clearLog,
    addStepLog,
    keys,
    addKey,
    removeKey,
    clearKeys,
    latestKey,
    initialize,
    finalize,
  }
}
