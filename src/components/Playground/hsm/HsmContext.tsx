// SPDX-License-Identifier: GPL-3.0-only
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import type { Pkcs11LogEntry } from '../../../wasm/softhsm'

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

export type HsmKeyRole = 'public' | 'private' | 'secret'

export interface HsmKey {
  handle: number
  family: HsmFamily
  role: HsmKeyRole
  /** Human-readable label, e.g. "ML-DSA-65 Private Key" */
  label: string
  /** Variant/size identifier, e.g. "65", "P-256", "2048", "sha2-128s" */
  variant?: string
  /** Wall-clock time when generated (for display) */
  generatedAt: string
}

export interface HsmContextValue {
  // ── WASM handles ──────────────────────────────────────────────────────────
  moduleRef: React.MutableRefObject<SoftHSMModule | null>
  hSessionRef: React.MutableRefObject<number>
  slotRef: React.MutableRefObject<number>

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
  const hSessionRef = useRef<number>(0)
  const slotRef = useRef<number>(0)

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

  const value = useMemo<HsmContextValue>(
    () => ({
      moduleRef,
      hSessionRef,
      slotRef,
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
    }),
    [
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
    ]
  )

  return <HsmContext.Provider value={value}>{children}</HsmContext.Provider>
}
