// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState, useCallback } from 'react'
import {
  AlertTriangle,
  PenLine,
  RotateCcw,
  Info,
  ShieldAlert,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react'
import { formatSignatureCount, formatBytes } from '../data/statefulSigsConstants'
import { hssSignatureBytes, lmsPublicKeyBytes, lmsSignatureBytes } from '../data/signatureSizes'
import { CKM_HSS_KEY_PAIR_GEN, CKM_HSS, CKK_HSS } from '@/wasm/softhsm/constants'
import { hsm_extractKeyValue } from '@/wasm/softhsm'
import { useHSM, type UseHSMResult } from '@/hooks/useHSM'
import { LiveHSMToggle } from '@/components/shared/LiveHSMToggle'
import { Button } from '@/components/ui/button'
import { StateReviewGuide } from './StateReviewGuide'
import type { RollbackProbe } from './stateRollbackProbe'

const LIVE_OPERATIONS = ['C_GenerateKeyPair', 'C_SignInit', 'C_Sign']

/** "leaf 2" for a one-leaf range, "leaves 2 to 4" otherwise: the leaves a restored counter would reuse. */
function reusedLeavesText(toIndex: number, fromIndex: number): string {
  const last = Math.max(toIndex, fromIndex - 1)
  return last === toIndex ? `leaf ${toIndex}` : `leaves ${toIndex} to ${last}`
}

type LMSHash = 'SHA-256' | 'SHAKE-256'
type LMSm = 32 | 24
type LMSHeight = 5 | 10 | 15 | 20 | 25
type LMSW = 1 | 2 | 4 | 8

const LMS_HEIGHTS: LMSHeight[] = [5, 10, 15, 20, 25]
const LMS_W_VALUES: LMSW[] = [1, 2, 4, 8]

// SP 800-208 §4 — p values (LMOTS chain count) per (n, W)
const P_N32: Record<LMSW, number> = { 1: 265, 2: 133, 4: 67, 8: 34 }
const P_N24: Record<LMSW, number> = { 1: 200, 2: 101, 4: 51, 8: 26 }

function computeLMSConfig(hash: LMSHash, m: LMSm, h: LMSHeight, w: LMSW) {
  const n = m
  const p = (m === 32 ? P_N32 : P_N24)[w]
  // One level's LMS signature, RFC 8554 Section 5.4: q(4) + LMOTS_typecode(4) + C(n) + y[](p*n) +
  // LMS_typecode(4) + path[](h*n). The HSS signature's 4-byte level count is added once, below.
  const sigSize = lmsSignatureBytes(n, p, n, h)
  const maxSigs = Math.pow(2, h)
  // IANA CKP_LMS_* base: SHA-256/M32=0x05, SHA-256/M24=0x0a, SHAKE/M32=0x0f, SHAKE/M24=0x14
  const lmsBase = hash === 'SHA-256' ? (m === 32 ? 0x05 : 0x0a) : m === 32 ? 0x0f : 0x14
  const lmsParam = lmsBase + LMS_HEIGHTS.indexOf(h)
  // IANA CKP_LMOTS_* base: SHA-256/N32=0x01, SHA-256/N24=0x05, SHAKE/N32=0x09, SHAKE/N24=0x0d
  const lmotsBase = hash === 'SHA-256' ? (m === 32 ? 0x01 : 0x05) : m === 32 ? 0x09 : 0x0d
  const lmotsParam = lmotsBase + LMS_W_VALUES.indexOf(w)
  const security =
    m === 32
      ? 'n = 32: collision bound 2^128 (SP 800-208 §9.2)'
      : 'n = 24: collision bound 2^96 (SP 800-208 §9.2)'
  const hashLabel = hash === 'SHA-256' ? 'SHA256' : 'SHAKE256'
  const pkcs11Name = `LMS_${hashLabel}_M${m}_H${h} / LMOTS_W${w}`
  const keygenNote =
    h <= 5 ? '< 1 s' : h <= 10 ? '~1–5 s' : h <= 15 ? '~30 s' : h <= 20 ? '~10 min' : '~5 hr'
  return { n, p, sigSize, maxSigs, lmsParam, lmotsParam, security, pkcs11Name, keygenNote }
}

function renderColoredHex(hex: string, sections: { bytes: number; hexBg: string }[]) {
  const spans: React.ReactNode[] = []
  let offset = 0
  sections.forEach((s, i) => {
    const charLen = s.bytes * 2
    spans.push(
      <span key={i} className={s.hexBg}>
        {hex.slice(offset, offset + charLen)}
      </span>
    )
    offset += charLen
  })
  if (offset < hex.length) spans.push(<span key="rest">{hex.slice(offset)}</span>)
  return spans
}

interface SignatureLogEntry {
  index: number
  message: string
  timestamp: number
  sigSize: number
  computeTimeMs: number
  sigHex: string
  levels: number // HSS level count at signing time
  levelSigSizes: number[] // per-level LMS sig size at signing time
  n: number // hash output length (bytes)
  remainingAfter: number // signatures remaining after this one
  preHashAlg: string | null // 'SHA-256' when pre-hash enabled, null for pure
}

interface StateManagementVisualizerProps {
  hsm?: UseHSMResult
}

type HSSLevels = 1 | 2 | 3

export const StateManagementVisualizer: React.FC<StateManagementVisualizerProps> = ({
  hsm: hsmProp,
}) => {
  const _ownHsm = useHSM('rust')
  const hsm = hsmProp ?? _ownHsm
  const [lmsHash, setLmsHash] = useState<LMSHash>('SHA-256')
  const [lmsM, setLmsM] = useState<LMSm>(32)
  const [lmsHeight, setLmsHeight] = useState<LMSHeight>(5)
  const [lmsW, setLmsW] = useState<LMSW>(8)
  const [hssLevels, setHssLevels] = useState<HSSLevels>(1)
  const [level2Height, setLevel2Height] = useState<LMSHeight>(5)
  const [level3Height, setLevel3Height] = useState<LMSHeight>(5)
  const [messageToSign, setMessageToSign] = useState<string>('Hello, world!')
  const [preHash, setPreHash] = useState(false)
  const [keygenPhase, setKeygenPhase] = useState<'idle' | 'building' | 'done'>('idle')
  const [activeKeyHandle, setActiveKeyHandle] = useState<number | null>(null)
  const [counter, setCounter] = useState(0)
  const [signatureLog, setSignatureLog] = useState<SignatureLogEntry[]>([])
  const [isExhausted, setIsExhausted] = useState(false)
  const [opError, setOpError] = useState<string | null>(null)
  const [showStateLossExplainer, setShowStateLossExplainer] = useState(false)
  const [showAlgoInfo, setShowAlgoInfo] = useState(false)
  // What the HSM answered when "Simulate State Loss" asked it to take the key back to an
  // earlier signature: the counter at that moment, the signature asked for, and each reply.
  const [rollback, setRollback] = useState<{
    fromIndex: number
    toIndex: number
    probe: RollbackProbe
  } | null>(null)
  const [inspectedEntry, setInspectedEntry] = useState<SignatureLogEntry | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const handleCopySig = useCallback((entry: SignatureLogEntry) => {
    void navigator.clipboard.writeText(entry.sigHex).then(() => {
      const key = `${entry.index}-${entry.timestamp}`
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(null), 2000)
    })
  }, [])

  // Compute per-level configs
  const cfg1 = computeLMSConfig(lmsHash, lmsM, lmsHeight, lmsW)
  const cfg2 = computeLMSConfig(lmsHash, lmsM, level2Height, lmsW)
  const cfg3 = computeLMSConfig(lmsHash, lmsM, level3Height, lmsW)
  const cfg = cfg1 // alias for single-level compatibility
  // RFC 8554 §4.1: LM-OTS public-key generation takes p·(2^W − 1) + 1 hashes; signing and
  // verifying take about half that on average. Same ratio for both, so one figure serves.
  const pByW = lmsM === 32 ? P_N32 : P_N24
  const otsHashes = (w: LMSW) => pByW[w] * (Math.pow(2, w) - 1) + 1

  // Build per-level arrays for HSS keygen
  const levelCfgs = [cfg1, ...(hssLevels >= 2 ? [cfg2] : []), ...(hssLevels >= 3 ? [cfg3] : [])]
  const lmsParamsAll = levelCfgs.map((c) => c.lmsParam)
  const lmotsParamsAll = levelCfgs.map((c) => c.lmotsParam)

  // Multi-level totals
  const totalHeightSum = levelCfgs.reduce((s, _c, i) => {
    const h = i === 0 ? lmsHeight : i === 1 ? level2Height : level3Height
    return s + h
  }, 0)
  const maxSigs = Math.pow(2, totalHeightSum)
  // Estimated keygen duration for CSS animation pacing (rough, based on total tree size)
  const keygenDurationMs = (() => {
    if (totalHeightSum <= 5) return 500
    if (totalHeightSum <= 10) return 5000
    if (totalHeightSum <= 15) return 30000
    if (totalHeightSum <= 20) return 180000
    return 600000
  })()
  // HSS sig size: 4 (Nspk) + (L-1) × (lmsSig_i + lmsPubKey_i) + lmsSig_{L-1}
  // lmsPubKey = u32str(type) || u32str(otstype) || I || T[1] = 4+4+16+n (RFC 8554 §5.3)
  const sigSize = hssSignatureBytes(
    levelCfgs.map((c) => c.sigSize),
    cfg1.n
  )

  const heightLabels = [
    lmsHeight,
    ...(hssLevels >= 2 ? [level2Height] : []),
    ...(hssLevels >= 3 ? [level3Height] : []),
  ]
  const pkcs11Name =
    hssLevels === 1
      ? cfg1.pkcs11Name
      : `HSS-L${hssLevels}[H${heightLabels.join('/H')}] ${cfg1.pkcs11Name.split('/')[1].trim()}`
  const security = cfg1.security
  const keygenNote = cfg1.keygenNote

  // The rollback attempt counts as refused only if every call was refused and the engine's own counter did not move.
  const rollbackRefused =
    rollback !== null &&
    rollback.probe.attempts.every((a) => a.refused) &&
    !rollback.probe.counterMoved

  const progressPercent = Math.min(100, (counter / maxSigs) * 100)
  const remainingSigs = maxSigs - counter

  const generateBackendKey = useCallback(async () => {
    if (!hsm || !hsm.isReady || !hsm.hSessionRef?.current || !hsm.moduleRef?.current) return null
    setKeygenPhase('building')
    try {
      // Yield so React paints the progress bar at 0% before the CSS animation
      // begins — the compositor thread continues the animation while WASM blocks JS.
      await new Promise((r) => setTimeout(r, 100))
      // From the module that defines it, not the pqc re-export: loading pqc with import() makes the
      // bundler copy its members into a namespace object, and these members may not exist yet.
      const { hsm_generateStatefulKeyPair } = await import('@/wasm/softhsm/stateful')
      const M = hsm.moduleRef.current
      const hSession = hsm.hSessionRef.current
      const { privHandle, pubHandle } = hsm_generateStatefulKeyPair(
        M,
        hSession,
        CKM_HSS_KEY_PAIR_GEN,
        CKK_HSS,
        lmsParamsAll[0],
        lmotsParamsAll[0],
        lmsParamsAll,
        lmotsParamsAll
      )
      const pubBytes = hsm_extractKeyValue(M!, hSession, pubHandle)
      setKeygenPhase('done')
      hsm.registerKey(M!, hSession, {
        handle: privHandle,
        family: 'hss',
        role: 'private',
        label: `HSS Key (${pkcs11Name})`,
        generatedAt: new Date().toLocaleTimeString('en-US', { hour12: false }),
      })
      hsm.registerKey(M!, hSession, {
        handle: pubHandle,
        family: 'hss',
        role: 'public',
        label: `HSS Pubkey (${pkcs11Name})`,
        generatedAt: new Date().toLocaleTimeString('en-US', { hour12: false }),
        rawBytes: pubBytes,
      })
      return privHandle
    } catch (e: unknown) {
      setOpError(e instanceof Error ? e.message : String(e))
      setKeygenPhase('idle')
      return null
    }
  }, [hsm, lmsParamsAll, lmotsParamsAll, pkcs11Name])

  const signBackend = useCallback(
    async (handle: number, msgBytes: Uint8Array) => {
      if (!hsm || !hsm.isReady || !hsm.moduleRef?.current) return false
      const { hsm_statefulSignBytes } = await import('@/wasm/softhsm/stateful')
      const { hsm_getKeysRemaining } = await import('@/wasm/softhsm/stateful')
      try {
        const t0 = performance.now()
        const sigBytes = hsm_statefulSignBytes(
          hsm.moduleRef.current,
          hsm.hSessionRef.current,
          CKM_HSS,
          handle,
          msgBytes
        )
        const computeTimeMs = performance.now() - t0
        const remainingBytes = hsm_getKeysRemaining(
          hsm.moduleRef.current,
          hsm.hSessionRef.current,
          handle
        )
        return { success: true, remaining: remainingBytes ?? 0, sigBytes, computeTimeMs }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        if (msg.includes('0x00000203') || msg.includes('CKR_KEY_EXHAUSTED')) {
          return { success: false, remaining: 0, sigBytes: new Uint8Array(0), computeTimeMs: 0 }
        }
        throw e
      }
    },
    [hsm]
  )

  const handleSign = useCallback(async () => {
    if (isExhausted) return
    setOpError(null)

    let currentHandle = activeKeyHandle
    if (!currentHandle) {
      currentHandle = await generateBackendKey()
      setActiveKeyHandle(currentHandle)
    }
    if (!currentHandle) return

    try {
      let msgBytes = new TextEncoder().encode(messageToSign)
      if (preHash) {
        const hashBuf = await globalThis.crypto.subtle.digest('SHA-256', msgBytes)
        msgBytes = new Uint8Array(hashBuf)
      }

      const result = await signBackend(currentHandle, msgBytes)

      if (!result || !result.success) {
        setIsExhausted(true)
        return
      }

      const backendRemaining = result.remaining
      const newCounter = maxSigs - backendRemaining

      const msgLabel = messageToSign.length > 32 ? messageToSign.slice(0, 32) + '…' : messageToSign
      const sigHex = Array.from(result.sigBytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
      const newEntry: SignatureLogEntry = {
        index: counter,
        message: msgLabel,
        timestamp: Date.now(),
        sigSize: result.sigBytes.length,
        computeTimeMs: result.computeTimeMs,
        sigHex,
        levels: hssLevels,
        levelSigSizes: levelCfgs.map((c) => c.sigSize),
        n: cfg1.n,
        remainingAfter: result.remaining,
        preHashAlg: preHash ? 'SHA-256' : null,
      }

      setCounter(newCounter)
      setSignatureLog((prev) => [newEntry, ...prev].slice(0, 20))

      if (backendRemaining === 0 || newCounter >= maxSigs) {
        setIsExhausted(true)
      }
    } catch (e: unknown) {
      setOpError(e instanceof Error ? e.message : String(e))
    }
  }, [
    counter,
    isExhausted,
    maxSigs,
    activeKeyHandle,
    generateBackendKey,
    signBackend,
    messageToSign,
    preHash,
  ])

  const handleBatchSign = useCallback(
    async (count: number) => {
      if (isExhausted) return
      setOpError(null)

      let currentHandle = activeKeyHandle
      if (!currentHandle) {
        currentHandle = await generateBackendKey()
        setActiveKeyHandle(currentHandle)
      }
      if (!currentHandle) return

      const actualCount = Math.min(count, remainingSigs)
      let lastRemaining = remainingSigs
      const batchMsgBytes = new TextEncoder().encode('batch')
      const batchEntries: SignatureLogEntry[] = []

      try {
        for (let i = 0; i < actualCount; i++) {
          const result = await signBackend(currentHandle, batchMsgBytes)
          if (!result || !result.success) {
            setIsExhausted(true)
            break
          }
          lastRemaining = result.remaining
          const sigHex = Array.from(result.sigBytes)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('')
          batchEntries.push({
            index: counter + i,
            message: `Batch_${String(counter + i + 1).padStart(4, '0')}.bin`,
            timestamp: Date.now() + i,
            sigSize: result.sigBytes.length,
            computeTimeMs: result.computeTimeMs,
            sigHex,
            levels: hssLevels,
            levelSigSizes: levelCfgs.map((c) => c.sigSize),
            n: cfg1.n,
            remainingAfter: result.remaining,
            preHashAlg: null,
          })
        }
      } catch (e: unknown) {
        setOpError(e instanceof Error ? e.message : String(e))
      }

      const newCounter = maxSigs - lastRemaining
      const newEntries = batchEntries

      setCounter(newCounter)
      setSignatureLog((prev) => [...newEntries.reverse(), ...prev].slice(0, 20))

      if (lastRemaining === 0 || batchEntries.length < actualCount || newCounter >= maxSigs) {
        setIsExhausted(true)
      }
    },
    [counter, isExhausted, maxSigs, remainingSigs, activeKeyHandle, generateBackendKey, signBackend]
  )

  // State loss is a real attempt on the live key, not a counter edit: the HSM is asked to
  // take the key back to an earlier signature (write the counter, read the state out, copy
  // the key) and the replies are shown. The counter is then read from the engine, so it can
  // never disagree with the signature log.
  const handleSimulateStateLoss = useCallback(async () => {
    if (counter === 0 || !activeKeyHandle || !hsm?.moduleRef?.current) return
    setOpError(null)
    try {
      const { hsm_getKeysRemaining } = await import('@/wasm/softhsm/stateful')
      const { probeStateRollback } = await import('./stateRollbackProbe')
      const M = hsm.moduleRef.current
      const hSession = hsm.hSessionRef.current
      const toIndex = Math.max(0, counter - Math.ceil(counter / 3))
      const probe = probeStateRollback(M, hSession, activeKeyHandle, maxSigs - toIndex, () =>
        hsm_getKeysRemaining(M, hSession, activeKeyHandle)
      )
      setRollback({ fromIndex: counter, toIndex, probe })
      if (probe.remainingAfter !== null) {
        setCounter(maxSigs - probe.remainingAfter)
        setIsExhausted(probe.remainingAfter === 0)
      }
    } catch (e: unknown) {
      setOpError(e instanceof Error ? e.message : String(e))
    }
  }, [counter, activeKeyHandle, hsm, maxSigs])

  const handleReset = useCallback(() => {
    setCounter(0)
    setSignatureLog([])
    setIsExhausted(false)
    setOpError(null)
    setRollback(null)
    setActiveKeyHandle(null)
    setKeygenPhase('idle')
  }, [])

  const handleHashChange = useCallback(
    (h: LMSHash) => {
      setLmsHash(h)
      handleReset()
    },
    [handleReset]
  )

  const handleMChange = useCallback(
    (m: LMSm) => {
      setLmsM(m)
      handleReset()
    },
    [handleReset]
  )

  const handleHeightChange = useCallback(
    (h: LMSHeight) => {
      setLmsHeight(h)
      handleReset()
    },
    [handleReset]
  )

  const handleWChange = useCallback(
    (w: LMSW) => {
      setLmsW(w)
      handleReset()
    },
    [handleReset]
  )

  const handleLevelsChange = useCallback(
    (l: HSSLevels) => {
      setHssLevels(l)
      handleReset()
    },
    [handleReset]
  )

  const handleLevel2HeightChange = useCallback(
    (h: LMSHeight) => {
      setLevel2Height(h)
      handleReset()
    },
    [handleReset]
  )

  const handleLevel3HeightChange = useCallback(
    (h: LMSHeight) => {
      setLevel3Height(h)
      handleReset()
    },
    [handleReset]
  )

  return (
    <div className="space-y-6">
      {!hsmProp && <LiveHSMToggle hsm={hsm} operations={LIVE_OPERATIONS} />}
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">State Management Simulator</h3>
        <p className="text-sm text-muted-foreground">
          Select an SP 800-208 parameter set, then sign messages to watch the one-time key counter
          advance. See what happens at exhaustion, and how the HSM answers an attempt to roll the
          state back.
        </p>
      </div>

      {/* SP 800-208 cascading parameter selector */}
      <div className="space-y-3 bg-muted/30 rounded-lg p-4 border border-border">
        {/* Hash family */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-14 shrink-0">Hash</span>
          <div className="flex gap-2">
            {(['SHA-256', 'SHAKE-256'] as LMSHash[]).map((h) => (
              <Button
                variant="ghost"
                key={h}
                onClick={() => handleHashChange(h)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  lmsHash === h
                    ? 'bg-primary/20 text-primary border border-primary/50'
                    : 'bg-muted/50 text-muted-foreground border border-border hover:border-primary/30'
                }`}
              >
                {h}
              </Button>
            ))}
          </div>
        </div>

        {/* m / n selector */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-14 shrink-0">m / n</span>
          <div className="flex gap-2">
            {([32, 24] as LMSm[]).map((m) => (
              <Button
                variant="ghost"
                key={m}
                onClick={() => handleMChange(m)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  lmsM === m
                    ? 'bg-primary/20 text-primary border border-primary/50'
                    : 'bg-muted/50 text-muted-foreground border border-border hover:border-primary/30'
                }`}
              >
                M{m} — {m} B
              </Button>
            ))}
          </div>
        </div>

        {/* Tree height */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-14 shrink-0">Height</span>
          <div className="flex gap-2 flex-wrap">
            {LMS_HEIGHTS.map((h) => {
              const isProdOnly = h > 15
              return (
                <div key={h} className="relative group">
                  <Button
                    variant="ghost"
                    onClick={() => handleHeightChange(h)}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                      isProdOnly
                        ? lmsHeight === h
                          ? 'bg-muted/30 text-muted-foreground border border-border/50'
                          : 'bg-muted/20 text-muted-foreground/40 border border-border/30'
                        : lmsHeight === h
                          ? 'bg-primary/20 text-primary border border-primary/50'
                          : 'bg-muted/50 text-muted-foreground border border-border hover:border-primary/30'
                    }`}
                  >
                    H{h}
                    {isProdOnly && (
                      <span className="ml-1 text-[9px] text-muted-foreground/50">prod</span>
                    )}
                  </Button>
                  {isProdOnly && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-44 p-2 rounded-lg border border-border bg-background shadow-lg text-[10px] text-muted-foreground leading-relaxed text-center pointer-events-none invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity z-50">
                      H{h}: 2^{h} signatures — keygen takes minutes. Production deployments only.
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Winternitz */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-14 shrink-0">W</span>
          <div className="flex gap-2">
            {LMS_W_VALUES.map((w) => (
              <Button
                variant="ghost"
                key={w}
                onClick={() => handleWChange(w)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  lmsW === w
                    ? 'bg-primary/20 text-primary border border-primary/50'
                    : 'bg-muted/50 text-muted-foreground border border-border hover:border-primary/30'
                }`}
              >
                W{w}
              </Button>
            ))}
          </div>
        </div>

        {/* HSS Levels */}
        <div className="flex items-start gap-3">
          <span className="text-xs text-muted-foreground w-14 shrink-0 mt-1.5">Levels</span>
          <div className="space-y-2">
            <div className="flex gap-2">
              {([1, 2, 3] as HSSLevels[]).map((l) => (
                <Button
                  variant="ghost"
                  key={l}
                  onClick={() => handleLevelsChange(l)}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    hssLevels === l
                      ? 'bg-primary/20 text-primary border border-primary/50'
                      : 'bg-muted/50 text-muted-foreground border border-border hover:border-primary/30'
                  }`}
                >
                  {l === 1 ? 'L1 — LMS' : `L${l} — HSS`}
                </Button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground">
              NSA CNSA 2.0 approves only single-tree LMS and XMSS for National Security Systems; the
              multi-tree HSS is not allowed (FAQ v2.2, p. 11). L2 and L3 are shown for education.
            </p>
            {hssLevels >= 2 && (
              <div className="flex items-center gap-2 pl-1">
                <span className="text-[10px] text-muted-foreground w-14 shrink-0">Level 2 H</span>
                <div className="flex gap-1.5">
                  {LMS_HEIGHTS.map((h) => {
                    const isProdOnly = h > 15
                    return (
                      <div key={h} className="relative group">
                        <Button
                          variant="ghost"
                          onClick={() => handleLevel2HeightChange(h)}
                          className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                            isProdOnly
                              ? level2Height === h
                                ? 'bg-muted/30 text-muted-foreground border border-border/50'
                                : 'bg-muted/20 text-muted-foreground/40 border border-border/30'
                              : level2Height === h
                                ? 'bg-primary/20 text-primary border border-primary/50'
                                : 'bg-muted/50 text-muted-foreground border border-border hover:border-primary/30'
                          }`}
                        >
                          H{h}
                          {isProdOnly && (
                            <span className="ml-1 text-[9px] text-muted-foreground/50">prod</span>
                          )}
                        </Button>
                        {isProdOnly && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-44 p-2 rounded-lg border border-border bg-background shadow-lg text-[10px] text-muted-foreground leading-relaxed text-center pointer-events-none invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity z-50">
                            H{h}: 2^{h} signatures — keygen takes minutes. Production deployments
                            only.
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            {hssLevels >= 3 && (
              <div className="flex items-center gap-2 pl-1">
                <span className="text-[10px] text-muted-foreground w-14 shrink-0">Level 3 H</span>
                <div className="flex gap-1.5">
                  {LMS_HEIGHTS.map((h) => {
                    const isProdOnly = h > 15
                    return (
                      <div key={h} className="relative group">
                        <Button
                          variant="ghost"
                          onClick={() => handleLevel3HeightChange(h)}
                          className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                            isProdOnly
                              ? level3Height === h
                                ? 'bg-muted/30 text-muted-foreground border border-border/50'
                                : 'bg-muted/20 text-muted-foreground/40 border border-border/30'
                              : level3Height === h
                                ? 'bg-primary/20 text-primary border border-primary/50'
                                : 'bg-muted/50 text-muted-foreground border border-border hover:border-primary/30'
                          }`}
                        >
                          H{h}
                          {isProdOnly && (
                            <span className="ml-1 text-[9px] text-muted-foreground/50">prod</span>
                          )}
                        </Button>
                        {isProdOnly && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-44 p-2 rounded-lg border border-border bg-background shadow-lg text-[10px] text-muted-foreground leading-relaxed text-center pointer-events-none invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity z-50">
                            H{h}: 2^{h} signatures — keygen takes minutes. Production deployments
                            only.
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            {hssLevels > 1 && (
              <p className="text-[10px] text-muted-foreground pl-1">
                Total capacity: 2^({heightLabels.join('+')}) ={' '}
                {heightLabels.reduce((s, h) => s + h, 0)} bits →{' '}
                <span className="font-bold text-foreground">
                  {maxSigs.toLocaleString()} signatures
                </span>
                . Each level signs the next level&apos;s public key; only the bottom tree uses OTS
                leaves directly.
              </p>
            )}
          </div>
        </div>

        {/* W explanation */}
        <div className="ml-[4.25rem] space-y-1 text-[10px] text-muted-foreground leading-relaxed">
          <p>
            <span className="font-bold text-foreground">W (Winternitz parameter)</span> controls the
            time–bandwidth trade-off in LMOTS — the one-time signature that protects each leaf node.
            Each OTS signature is built from <span className="font-mono text-primary">{cfg.p}</span>{' '}
            independent hash chains; W determines how many bits each chain encodes.
          </p>
          <p>
            Each chain encodes <span className="font-mono">W</span> bits of the message hash and is{' '}
            <span className="font-mono">2^W − 1</span> hash steps long (RFC 8554 §4.1). The{' '}
            <span className="font-bold">signer</span> applies up to 2^W − 1 steps to produce the
            signature; the <span className="font-bold">verifier</span> completes the remaining
            steps. Larger W → fewer chains needed → smaller signature bytes → but each chain
            requires more hash steps → slower to sign and verify.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-1 pt-1 font-mono">
            {([1, 2, 4, 8] as const).map((w) => {
              const p = (
                lmsM === 32 ? { 1: 265, 2: 133, 4: 67, 8: 34 } : { 1: 200, 2: 101, 4: 51, 8: 26 }
              )[w]
              const active = w === lmsW
              return (
                <div
                  key={w}
                  className={`rounded p-1.5 border text-center ${active ? 'border-primary/50 bg-primary/10 text-primary' : 'border-border bg-background text-muted-foreground'}`}
                >
                  <div className="font-bold">W{w}</div>
                  <div>{p} chains</div>
                  <div>
                    {w === 1
                      ? '1 step/chain'
                      : w === 2
                        ? '≤3 steps'
                        : w === 4
                          ? '≤15 steps'
                          : '≤255 steps'}
                  </div>
                </div>
              )
            })}
          </div>
          <p className="text-[9px]">
            SP 800-208 approves W = 1, 2, 4 and 8. Larger W gives smaller signatures at a higher
            hash cost: RFC 8554 §4.1 puts one-time public-key generation at p × (2^W − 1) + 1
            hashes, with signing and verifying about half that on average. For M{lmsM} that is{' '}
            {otsHashes(1).toLocaleString()} hashes at W=1 and {otsHashes(8).toLocaleString()} at
            W=8, about {Math.round(otsHashes(8) / otsHashes(1))}× as many. W has little effect on
            security (RFC 8554 §4.1) — only size and speed change.
          </p>
        </div>

        {/* Computed summary bar */}
        <div className="mt-1 pt-3 border-t border-border flex flex-wrap gap-3 text-[10px] font-mono">
          <span className="text-primary font-bold">{pkcs11Name}</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-foreground">{formatSignatureCount(maxSigs)} signatures max</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-foreground">{formatBytes(sigSize)}/sig</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-foreground">{security}</span>
        </div>
      </div>

      {/* Collapsible algorithm details */}
      <div className="border border-border rounded-lg overflow-hidden">
        <Button
          variant="ghost"
          onClick={() => setShowAlgoInfo(!showAlgoInfo)}
          className="h-auto whitespace-normal w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-foreground bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Info size={14} className="text-primary" />
            Algorithm details — SP 800-208 LMS/HSS
          </span>
          {showAlgoInfo ? (
            <ChevronUp size={14} className="text-muted-foreground" />
          ) : (
            <ChevronDown size={14} className="text-muted-foreground" />
          )}
        </Button>
        {showAlgoInfo && (
          <div className="px-4 py-4 grid grid-cols-1 md:grid-cols-2 gap-3 bg-muted/10">
            {[
              {
                label: 'Hash Function',
                value: lmsHash,
                body:
                  lmsHash === 'SHA-256'
                    ? 'SHA-256: RFC 8554 §9 requires the hash function H to have second-preimage resistance. Standard choice; NIST FIPS 180-4 compliant.'
                    : 'SHAKE-256: SHAKE256/256 is the first 256 bits of the SHAKE256 extendable-output function (XOF) (RFC 9858 §2.2); RFC 9858 §8 describes its security as essentially the same as the SHA-256-based signatures, because the strength of HSS/LMS signatures rests on the difficulty of finding preimages or second preimages.',
              },
              {
                label: 'm / n — Output Length',
                value: `M${lmsM} (${lmsM} bytes = ${lmsM * 8} bits)`,
                body:
                  lmsM === 32
                    ? 'M32: 32-byte hash output. SP 800-208 §9.2: a generic collision in a 256-bit hash may be found as the number of sampled inputs approaches 2^128.'
                    : 'M24: 24-byte output (SHA-256/192 or SHAKE256/192), approved by SP 800-208. §9.2: a generic collision may be found as the number of sampled inputs approaches 2^96, which weakens a verifier\u2019s assurance that the signer cannot change a message after signing; the formal security of the scheme is not affected. NSA CNSA 2.0 prefers LMS with SHA-256/192 (CNSA 2.0 FAQ v2.2); M24 signatures are also smaller.',
              },
              {
                label: 'H — Tree Height',
                value: `H${lmsHeight} → 2^${lmsHeight} = ${formatSignatureCount(maxSigs)} sigs`,
                body: `Each leaf is one LMOTS one-time key. Keygen time ≈ O(2^H) — estimated: ${keygenNote}. H≥20 is impractical for demo purposes.`,
              },
              {
                label: 'W — Winternitz Parameter',
                value: `W${lmsW} → ${cfg.p} chains/sig · ≤${Math.pow(2, lmsW) - 1} hashes/chain`,
                body:
                  lmsW === 1
                    ? 'W1: 265 chains (N32), 1 hash step per chain iteration. Fastest signing — each chain completes in a single hash — but the largest signature (~8.5 KB of chain values per RFC 8554). Choose W1 only when sign latency is the bottleneck and bandwidth is plentiful.'
                    : lmsW === 2
                      ? 'W2: 133 chains (N32), ≤3 hash steps per chain. Halves the chain count vs W1 at only 3× more work per chain. Useful middle ground when moderate size savings are needed without the full cost of W4.'
                      : lmsW === 4
                        ? 'W4: 67 chains (N32), ≤15 hash steps per chain. Cuts the LM-OTS signature to 2,180 B (N32) at a middle-of-the-range hash cost — between W1 (largest, cheapest) and W8 (smallest, costliest).'
                        : 'W8: 34 chains (N32), ≤255 hash steps per chain. Smallest LM-OTS output (1,124 B per RFC 8554) at about 33× the chain hashing of W1 (34 × 255 + 1 against 265 × 1 + 1 hashes, RFC 8554 §4.1). Best for bandwidth-constrained channels (IoT, firmware update protocols) where signing throughput is not critical.',
              },
              {
                label: 'Selected Parameter Set',
                value: pkcs11Name,
                body: `Sig size: ${formatBytes(sigSize)} · Max sigs: ${formatSignatureCount(maxSigs)} · Security: ${security}`,
              },
            ].map((tile) => (
              <div key={tile.label} className="bg-background rounded p-3 border border-border">
                <div className="text-[10px] text-muted-foreground mb-1">{tile.label}</div>
                <div className="text-xs font-bold text-foreground mb-1">{tile.value}</div>
                <div className="text-[10px] text-foreground/70 leading-relaxed">{tile.body}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Error banner */}
      {opError && (
        <div className="flex items-start gap-2 p-3 rounded-md border border-destructive/40 bg-destructive/5 text-destructive text-sm">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span className="font-mono break-all">{opError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: State dashboard */}
        <div className="space-y-4">
          {/* Keygen progress bar — CSS animation runs on compositor thread,
              continues while WASM blocks the JS main thread */}
          {keygenPhase !== 'idle' && (
            <div className="bg-muted/50 rounded-lg p-4 border border-border space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span
                  className={`font-bold ${keygenPhase === 'done' ? 'text-success' : 'text-primary'}`}
                >
                  {keygenPhase === 'done' ? 'Key Ready' : 'Building Merkle Tree…'}
                </span>
                <span className="font-mono text-muted-foreground">
                  {keygenPhase === 'done'
                    ? '100%'
                    : `~${keygenDurationMs >= 60000 ? Math.round(keygenDurationMs / 60000) + ' min' : Math.round(keygenDurationMs / 1000) + ' s'}`}
                </span>
              </div>
              <div className="w-full bg-background rounded-full h-3 border border-border overflow-hidden">
                <div
                  className={`h-full rounded-full ${keygenPhase === 'done' ? 'bg-success' : 'bg-primary'}`}
                  style={{
                    width: keygenPhase === 'done' ? '100%' : undefined,
                    animation:
                      keygenPhase === 'building'
                        ? `keygen-fill ${keygenDurationMs}ms linear forwards`
                        : undefined,
                    transition: keygenPhase === 'done' ? 'width 400ms ease-out' : undefined,
                  }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground">
                {keygenPhase === 'done'
                  ? `✓ ${formatSignatureCount(maxSigs)} one-time signatures available`
                  : `Computing 2^${totalHeightSum} = ${formatSignatureCount(maxSigs)} leaf keys + Merkle authentication paths`}
              </p>
            </div>
          )}

          {/* Counter and progress */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-foreground">Signature Counter</h4>
              <span className="text-2xl font-bold font-mono text-primary">
                {counter} / {formatSignatureCount(maxSigs)}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-background rounded-full h-4 border border-border mb-2">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isExhausted
                    ? 'bg-destructive'
                    : progressPercent > 80
                      ? 'bg-warning'
                      : 'bg-primary/60'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Used: {counter}</span>
              <span>
                Remaining: {remainingSigs > 0 ? formatSignatureCount(remainingSigs) : 'NONE'}
              </span>
            </div>

            {/* Warning thresholds */}
            {progressPercent > 80 && !isExhausted && (
              <div className="mt-3 flex items-center gap-2 bg-warning/10 rounded p-2 border border-warning/30">
                <AlertTriangle size={14} className="text-warning shrink-0" />
                <p className="text-[10px] text-warning">
                  Warning: {Math.round(progressPercent)}% of signing capacity used. Plan key
                  rotation.
                </p>
              </div>
            )}
          </div>

          {/* Exhaustion warning */}
          {isExhausted && (
            <div className="bg-destructive/10 rounded-lg p-4 border border-destructive/30 animate-pulse">
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert size={18} className="text-destructive" />
                <span className="text-sm font-bold text-destructive">KEY EXHAUSTED</span>
              </div>
              <p className="text-xs text-foreground/80">
                All {formatSignatureCount(maxSigs)} one-time signature keys have been used. This key
                MUST be retired. Any further signing would require generating a new key pair. In a
                real system, continued use would reuse OTS keys and{' '}
                <strong>completely compromise the scheme</strong>.
              </p>
            </div>
          )}

          {/* State loss attempt: what the HSM answered */}
          {rollback && (
            <div
              className={`rounded-lg p-4 border space-y-3 ${
                rollbackRefused
                  ? 'bg-status-info/10 border-status-info/30'
                  : 'bg-destructive/10 border-destructive/30'
              }`}
              role="status"
              data-testid="rollback-result"
            >
              <div className="flex items-center gap-2">
                {rollbackRefused ? (
                  <ShieldAlert size={18} className="text-status-info shrink-0" />
                ) : (
                  <AlertTriangle size={18} className="text-destructive shrink-0" />
                )}
                <span
                  className={`text-sm font-bold ${
                    rollbackRefused ? 'text-status-info' : 'text-destructive'
                  }`}
                >
                  {rollbackRefused
                    ? `ROLLBACK REFUSED — the HSM kept the counter at ${rollback.fromIndex}`
                    : 'THE ENGINE LET PART OF THE ROLLBACK THROUGH'}
                </span>
              </div>
              <p className="text-xs text-foreground/80">
                You tried to take the key's counter back from {rollback.fromIndex} to{' '}
                {rollback.toIndex}, the way a restored snapshot or a cloned key would.{' '}
                {rollbackRefused ? (
                  <>
                    The HSM refused every way in, so <strong>no leaf was reused</strong>: signing
                    continues at leaf {rollback.fromIndex}, and the counter and the log agree.
                  </>
                ) : (
                  <>
                    The replies are below; the counter now reads {counter} because it is read from
                    the engine.
                  </>
                )}
              </p>
              <ul className="space-y-2" aria-label="Rollback attempts and the HSM's replies">
                {rollback.probe.attempts.map((a) => (
                  <li key={a.id} className="text-[10px] leading-relaxed">
                    <span className="block text-foreground">{a.action}</span>
                    <span className="block font-mono text-muted-foreground break-words">
                      {a.call} &rarr;{' '}
                      <span
                        className={`font-bold ${a.refused ? 'text-status-info' : 'text-destructive'}`}
                      >
                        {a.returned}
                      </span>
                    </span>
                    <span className="block text-muted-foreground">{a.meaning}</span>
                  </li>
                ))}
              </ul>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                This is how this software emulator answers; it does not show that any certified
                module does the same. SP 800-208 &sect;8.1 asks it of a module that generates keys
                and signs: no export of private keying material, and the leaf index stored in
                non-volatile memory before a signature leaves. A signer that keeps its state in an
                ordinary file or VM image has no such protection: restoring a snapshot taken when
                the counter read {rollback.toIndex} would make{' '}
                {reusedLeavesText(rollback.toIndex, rollback.fromIndex)} available again, and SP
                800-208 &sect;1.2 says that two signatures on different messages from one one-time
                key make it computationally feasible to forge signatures on arbitrary messages.
              </p>
            </div>
          )}

          {/* Message input + pre-hash */}
          <div className="space-y-2">
            <label htmlFor="hss-sign-input" className="text-xs font-bold text-muted-foreground">
              Message to Sign
            </label>
            <input
              id="hss-sign-input"
              type="text"
              value={messageToSign}
              onChange={(e) => setMessageToSign(e.target.value)}
              disabled={isExhausted}
              className="w-full bg-background border border-input rounded px-3 py-2 text-sm disabled:opacity-50"
            />
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={preHash}
                onChange={(e) => setPreHash(e.target.checked)}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-xs text-muted-foreground">
                Pre-hash with SHA-256 (hash-then-sign — reduces input to 32 bytes)
              </span>
            </label>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="gradient"
              onClick={handleSign}
              disabled={isExhausted}
              className="flex items-center gap-2 px-4 py-2 font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              <PenLine size={14} />
              Sign Message
            </Button>
            {maxSigs > 32 && (
              <Button
                variant="ghost"
                onClick={() => handleBatchSign(10)}
                disabled={isExhausted}
                className="flex items-center gap-2 px-4 py-2 bg-secondary/20 text-secondary font-medium rounded-lg hover:bg-secondary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm border border-secondary/30"
              >
                Batch Sign (10)
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={handleSimulateStateLoss}
              disabled={counter === 0}
              className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-status-error font-medium rounded-lg hover:bg-destructive/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm border border-destructive/30"
            >
              <AlertTriangle size={14} />
              Simulate State Loss
            </Button>
            <Button
              variant="ghost"
              onClick={handleReset}
              className="flex items-center gap-2 px-3 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors text-sm border border-border"
            >
              <RotateCcw size={14} />
              Reset
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Simulate State Loss asks the HSM to take this key back to an earlier signature, as a
            backup restore or a cloned key would, and shows how it answers.
          </p>
        </div>

        {/* Right: Log and explainer */}
        <div className="space-y-4">
          {/* Signature log */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <h4 className="text-sm font-bold text-foreground mb-3">Signature Log</h4>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {signatureLog.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">
                  No signatures yet. Click &quot;Sign Message&quot; to begin.
                </p>
              ) : (
                signatureLog.map((entry) => {
                  const isInspecting =
                    inspectedEntry?.index === entry.index &&
                    inspectedEntry?.timestamp === entry.timestamp
                  return (
                    <div key={`${entry.index}-${entry.timestamp}`}>
                      <div
                        role="button"
                        tabIndex={0}
                        className={`flex items-center gap-2 text-[10px] font-mono px-2 py-1.5 rounded cursor-pointer transition-colors ${
                          isInspecting
                            ? 'bg-primary/10 border border-primary/30 text-foreground'
                            : 'bg-background/50 text-muted-foreground hover:bg-muted/60'
                        }`}
                        onClick={() => setInspectedEntry(isInspecting ? null : entry)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ')
                            setInspectedEntry(isInspecting ? null : entry)
                        }}
                      >
                        <CheckCircle size={10} className="text-success shrink-0" />
                        <span className="font-bold w-12 shrink-0 text-primary">
                          #{String(entry.index).padStart(4, '0')}
                        </span>
                        <span className="truncate flex-1">{entry.message}</span>
                        <span className="text-muted-foreground shrink-0">{entry.sigSize} B</span>
                        <span className="text-muted-foreground shrink-0">
                          {entry.computeTimeMs.toFixed(1)} ms
                        </span>
                        <span
                          className={`shrink-0 font-bold ${entry.remainingAfter === 0 ? 'text-destructive' : entry.remainingAfter < 4 ? 'text-warning' : 'text-muted-foreground'}`}
                        >
                          {entry.remainingAfter.toLocaleString()} left
                        </span>
                        <span
                          className={`shrink-0 ${isInspecting ? 'text-primary' : 'text-muted-foreground'}`}
                        >
                          {isInspecting ? '▲' : '▼'}
                        </span>
                      </div>
                      {isInspecting &&
                        (() => {
                          const lmsPubKeySize = lmsPublicKeyBytes(entry.n)
                          // Rotating palettes so every section gets a distinct color even at L>2
                          const sigPalette = [
                            {
                              color: 'bg-primary/20 text-primary border-primary/30',
                              hexBg: 'bg-primary/20',
                            },
                            {
                              color: 'bg-success/20 text-success border-success/30',
                              hexBg: 'bg-success/20',
                            },
                            {
                              color: 'bg-accent/20 text-accent border-accent/30',
                              hexBg: 'bg-accent/20',
                            },
                          ]
                          const pkPalette = [
                            {
                              color: 'bg-warning/20 text-warning border-warning/30',
                              hexBg: 'bg-warning/20',
                            },
                            {
                              color: 'bg-muted text-muted-foreground border-border',
                              hexBg: 'bg-muted/40',
                            },
                          ]
                          const sections: {
                            label: string
                            bytes: number
                            color: string
                            hexBg: string
                          }[] = [
                            {
                              label: `Nspk=${entry.levels - 1}`,
                              bytes: 4,
                              color: 'bg-secondary/20 text-secondary border-secondary/30',
                              hexBg: 'bg-secondary/20',
                            },
                            ...Array.from({ length: entry.levels - 1 }, (_, i) => [
                              {
                                label: `L${i} sig`,
                                bytes: entry.levelSigSizes[i],
                                ...sigPalette[i % sigPalette.length],
                              },
                              {
                                label: `PK${i + 1}`,
                                bytes: lmsPubKeySize,
                                ...pkPalette[i % pkPalette.length],
                              },
                            ]).flat(),
                            {
                              label: `L${entry.levels - 1} sig`,
                              bytes: entry.levelSigSizes[entry.levels - 1],
                              ...sigPalette[(entry.levels - 1) % sigPalette.length],
                            },
                          ]
                          return (
                            <div className="mt-1 mb-1 p-3 bg-background border border-primary/20 rounded text-[9px] font-mono space-y-2">
                              <div className="flex gap-3 flex-wrap">
                                <span>
                                  <span className="text-muted-foreground">Size:</span>{' '}
                                  <span className="text-foreground font-bold">
                                    {entry.sigSize} B ({(entry.sigSize / 1024).toFixed(1)} KB)
                                  </span>
                                </span>
                                <span>
                                  <span className="text-muted-foreground">Compute:</span>{' '}
                                  <span className="text-foreground font-bold">
                                    {entry.computeTimeMs.toFixed(2)} ms
                                  </span>
                                </span>
                                <span>
                                  <span className="text-muted-foreground">OTS leaf:</span>{' '}
                                  <span className="text-foreground font-bold">#{entry.index}</span>
                                </span>
                                <span>
                                  <span className="text-muted-foreground">After:</span>{' '}
                                  <span
                                    className={`font-bold ${entry.remainingAfter === 0 ? 'text-destructive' : 'text-foreground'}`}
                                  >
                                    {entry.remainingAfter.toLocaleString()} remaining
                                  </span>
                                </span>
                                <span>
                                  <span className="text-muted-foreground">Pre-hash:</span>{' '}
                                  <span className="text-foreground font-bold">
                                    {entry.preHashAlg ?? 'Pure (none)'}
                                  </span>
                                </span>
                              </div>
                              <div>
                                <div className="text-muted-foreground mb-1">
                                  {entry.levels > 1 ? `HSS-L${entry.levels}` : 'LMS'} signature
                                  layout
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {sections.map((s, i) => (
                                    <div
                                      key={i}
                                      className={`px-1.5 py-0.5 rounded border text-center ${s.color}`}
                                    >
                                      <div className="font-bold">{s.label}</div>
                                      <div className="text-[8px] opacity-70">{s.bytes} B</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-muted-foreground">
                                    Hex — {entry.sigHex.length / 2} bytes
                                  </span>
                                  <Button
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleCopySig(entry)
                                    }}
                                    className="flex items-center gap-1 px-2 py-0.5 rounded border border-border bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors text-[8px]"
                                  >
                                    {copiedKey === `${entry.index}-${entry.timestamp}` ? (
                                      <>
                                        <Check size={9} className="text-success" /> Copied
                                      </>
                                    ) : (
                                      <>
                                        <Copy size={9} /> Copy hex
                                      </>
                                    )}
                                  </Button>
                                </div>
                                <pre className="break-all whitespace-pre-wrap text-foreground/80 leading-relaxed max-h-32 overflow-y-auto bg-muted/30 p-2 rounded border border-border/50">
                                  {renderColoredHex(entry.sigHex, sections)}
                                </pre>
                              </div>
                            </div>
                          )
                        })()}
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Key parameters summary */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <h4 className="text-sm font-bold text-foreground mb-3">Active Key Info</h4>
            <div className="space-y-2">
              {[
                { label: 'Scheme', value: pkcs11Name },
                { label: 'Tree Height', value: `H=${lmsHeight}` },
                { label: 'Max Signatures', value: formatSignatureCount(maxSigs) },
                {
                  label: 'State Storage',
                  value: '4 bytes (monotonic leaf index counter)',
                },
              ].map((row) => (
                <div key={row.label} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className="font-bold text-foreground">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* State loss explainer toggle */}
          <StateReviewGuide />
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <Button
              variant="ghost"
              onClick={() => setShowStateLossExplainer(!showStateLossExplainer)}
              className="flex items-center gap-2 text-sm font-bold text-foreground w-full"
            >
              <Info size={14} className="text-primary" />
              What happens if state is lost?
              <span className="ml-auto text-xs text-primary">
                {showStateLossExplainer ? 'Hide' : 'Show'}
              </span>
            </Button>
            {showStateLossExplainer && (
              <div className="mt-3 space-y-3 text-xs text-foreground/80">
                <p>
                  In stateful hash-based signatures, the private key state includes a{' '}
                  <strong>monotonic counter</strong> tracking the next unused OTS leaf. If this
                  counter is lost (via VM snapshot restore, backup restoration, or crash without
                  flush), the signer may unknowingly reuse a one-time key.
                </p>
                <p className="text-muted-foreground">
                  The HSM engine in this simulator does not let you cause any of the scenarios
                  below: Simulate State Loss shows it refusing to rewind the key. They describe a
                  signer that keeps its state where it can be restored or copied.
                </p>
                <div className="space-y-2">
                  <div className="bg-destructive/5 rounded p-2 border border-destructive/20">
                    <span className="font-bold text-destructive">
                      Scenario 1: VM Snapshot Restore
                    </span>
                    <p className="text-muted-foreground mt-1">
                      VM is snapshotted at counter=100. Signing continues to counter=150. VM is
                      restored to snapshot. Counter resets to 100. Leaves 100&ndash;149 will be
                      reused. An attacker with both signatures from any reused leaf can forge.
                    </p>
                  </div>
                  <div className="bg-destructive/5 rounded p-2 border border-destructive/20">
                    <span className="font-bold text-destructive">
                      Scenario 2: Crash Before Flush
                    </span>
                    <p className="text-muted-foreground mt-1">
                      System signs at counter=50 but crashes before persisting counter=51 to disk.
                      On restart, counter reads 50. Leaf 50 will be reused on next signature.
                    </p>
                  </div>
                  <div className="bg-destructive/5 rounded p-2 border border-destructive/20">
                    <span className="font-bold text-destructive">Scenario 3: Key Cloning</span>
                    <p className="text-muted-foreground mt-1">
                      Private key (including counter) is copied to a second server for redundancy.
                      Both servers sign independently, reusing all leaves. Every signature from the
                      clone is potentially forgeable.
                    </p>
                  </div>
                </div>
                <p className="text-muted-foreground">
                  <strong>Mitigation:</strong> SP 800-208 §8.1 requires a durable leaf-index update
                  before signature output or acceptance of another signing request. Section 9.1
                  discusses hardware monotonic counters as a possible aid; do not assume every
                  validated HSM uses them. Inspect the actual implementation.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
