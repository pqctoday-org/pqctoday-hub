// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo, useCallback } from 'react'
import {
  Info,
  ChevronDown,
  ChevronUp,
  Key,
  PenLine,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Copy,
  Check,
  ShieldAlert,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Pkcs11LogPanel } from '@/components/shared/Pkcs11LogPanel'
import { HsmKeyInspector } from '@/components/shared/HsmKeyInspector'
import { LiveHSMToggle } from '@/components/shared/LiveHSMToggle'
import { useHSM, type UseHSMResult } from '@/hooks/useHSM'
import {
  XMSS_PARAMETER_SETS,
  LMS_PARAMETER_SETS,
  formatSignatureCount,
  formatBytes,
} from '../data/statefulSigsConstants'
import {
  CKM_XMSS_KEY_PAIR_GEN,
  CKK_XMSS,
  CKM_XMSS,
  CKP_XMSS_SHA2_10_256,
  CKP_XMSS_SHA2_16_256,
  CKP_XMSS_SHA2_20_256,
  CKP_XMSS_SHAKE_10_256,
  CKP_XMSS_SHAKE_16_256,
  CKP_XMSS_SHAKE_20_256,
} from '@/wasm/softhsm/constants'
import {
  hsm_generateStatefulKeyPair,
  hsm_statefulSignBytes,
  hsm_getKeysRemaining,
} from '@/wasm/softhsm/pqc'
import { hsm_extractKeyValue } from '@/wasm/softhsm'

type XMSSHash = 'SHA-256' | 'SHAKE-256'
type XMSSHeight = 10 | 16 | 20

const XMSS_HEIGHTS: XMSSHeight[] = [10, 16, 20]

// SP 800-208 §5 — n=32 fixed; w=16 fixed (67 WOTS+ chains); sig = 4 + 32*(1+67+h)
const XMSS_SIG_SIZE: Record<XMSSHeight, number> = { 10: 2500, 16: 2692, 20: 2820 }

// Estimated keygen time (ms) — used to pace the CSS animation during WASM blocking
const XMSS_KEYGEN_MS: Record<XMSSHeight, number> = { 10: 5000, 16: 20000, 20: 600000 }

// Map (hash, height) → CKP constant
const XMSS_CKP: Record<XMSSHash, Record<XMSSHeight, number>> = {
  'SHA-256': { 10: CKP_XMSS_SHA2_10_256, 16: CKP_XMSS_SHA2_16_256, 20: CKP_XMSS_SHA2_20_256 },
  'SHAKE-256': { 10: CKP_XMSS_SHAKE_10_256, 16: CKP_XMSS_SHAKE_16_256, 20: CKP_XMSS_SHAKE_20_256 },
}

// Map (hash, height) → XMSS_PARAMETER_SETS id (for tree visualization & LMS comparison)
const XMSS_PARAM_ID: Record<XMSSHash, Record<XMSSHeight, string>> = {
  'SHA-256': { 10: 'xmss-sha2-10', 16: 'xmss-sha2-16', 20: 'xmss-sha2-20' },
  'SHAKE-256': { 10: 'xmss-shake-10', 16: 'xmss-shake-16', 20: 'xmss-shake-20' },
}

const LIVE_OPERATIONS = ['C_GenerateKeyPair', 'C_SignInit', 'C_Sign']

const toHex = (bytes: Uint8Array): string =>
  Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

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

interface XMSSLogEntry {
  index: number
  message: string
  timestamp: number
  sigSize: number
  computeTimeMs: number
  sigHex: string
  remainingAfter: number
  height: XMSSHeight
}

interface XMSSKeyGenDemoProps {
  /** When provided, reuse this HSM session (embedded mode). Own controls are suppressed. */
  hsm?: UseHSMResult
}

export const XMSSKeyGenDemo: React.FC<XMSSKeyGenDemoProps> = ({ hsm: hsmProp }) => {
  const ownHsm = useHSM('rust')
  const hsm = hsmProp ?? ownHsm
  const isEmbedded = !!hsmProp
  const [xmssHash, setXmssHash] = useState<XMSSHash>('SHA-256')
  const [xmssHeight, setXmssHeight] = useState<XMSSHeight>(10)
  const [showAlgoInfo, setShowAlgoInfo] = useState(false)
  const [showComparison, setShowComparison] = useState(true)

  // Interactive State
  const [isGenerating, setIsGenerating] = useState(false)
  const [keygenPhase, setKeygenPhase] = useState<'idle' | 'building' | 'done'>('idle')
  const [activeKeyHandle, setActiveKeyHandle] = useState<number | null>(null)
  const [opError, setOpError] = useState<string | null>(null)

  // Signing State
  const [messageToSign, setMessageToSign] = useState<string>('Hello, world!')
  const [preHash, setPreHash] = useState(false)
  const [signatureLog, setSignatureLog] = useState<XMSSLogEntry[]>([])
  const [sigCounter, setSigCounter] = useState(0)
  const [isExhausted, setIsExhausted] = useState(false)
  const [inspectedEntry, setInspectedEntry] = useState<XMSSLogEntry | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const keygenDurationMs = XMSS_KEYGEN_MS[xmssHeight]

  const paramId = XMSS_PARAM_ID[xmssHash][xmssHeight]
  const selected = XMSS_PARAMETER_SETS.find((p) => p.id === paramId) || XMSS_PARAMETER_SETS[0]
  const ckpParam = XMSS_CKP[xmssHash][xmssHeight]
  const sigSize = XMSS_SIG_SIZE[xmssHeight]
  const maxSigs = Math.pow(2, xmssHeight)
  const isH20 = xmssHeight === 20

  // Find comparable LMS parameter set (same tree height, W=4 as default comparison)
  const comparableLMS = useMemo(() => {
    const sameHeight = LMS_PARAMETER_SETS.filter((p) => p.treeHeight === xmssHeight)
    return sameHeight.find((p) => p.winternitzParam === 4) || sameHeight[0] || null
  }, [xmssHeight])

  const treeDepth = Math.min(xmssHeight, 5)
  const totalLeaves = Math.pow(2, treeDepth)

  const resetSigning = useCallback(() => {
    setActiveKeyHandle(null)
    setSignatureLog([])
    setSigCounter(0)
    setIsExhausted(false)
    setInspectedEntry(null)
    setOpError(null)
    setKeygenPhase('idle')
  }, [])

  const handleHashChange = useCallback(
    (h: XMSSHash) => {
      setXmssHash(h)
      resetSigning()
    },
    [resetSigning]
  )

  const handleHeightChange = useCallback(
    (h: XMSSHeight) => {
      setXmssHeight(h)
      resetSigning()
    },
    [resetSigning]
  )

  const handleCopySig = useCallback((entry: XMSSLogEntry) => {
    void navigator.clipboard.writeText(entry.sigHex).then(() => {
      const key = `${entry.index}-${entry.timestamp}`
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(null), 2000)
    })
  }, [])

  const handleGenerateKey = useCallback(async () => {
    if (!hsm.isReady || !hsm.hSessionRef.current || !hsm.moduleRef.current) return
    setIsGenerating(true)
    setKeygenPhase('building')
    setOpError(null)
    try {
      // Yield to browser so React can paint the progress bar at 0% before the
      // CSS animation starts (the animation runs on the compositor thread and
      // will continue even while the synchronous WASM call blocks JS).
      await new Promise((r) => setTimeout(r, 100))

      const { privHandle, pubHandle } = hsm_generateStatefulKeyPair(
        hsm.moduleRef.current,
        hsm.hSessionRef.current,
        CKM_XMSS_KEY_PAIR_GEN,
        CKK_XMSS,
        ckpParam
      )
      const pubBytes = hsm_extractKeyValue(
        hsm.moduleRef.current!,
        hsm.hSessionRef.current,
        pubHandle
      )

      setActiveKeyHandle(privHandle)
      setKeygenPhase('done')
      hsm.addKey({
        handle: privHandle,
        family: 'xmss',
        role: 'private',
        label: `XMSS Key (${selected.name})`,
        generatedAt: new Date().toLocaleTimeString('en-US', { hour12: false }),
      })
      hsm.addKey({
        handle: pubHandle,
        family: 'xmss',
        role: 'public',
        label: `XMSS Pubkey (${selected.name})`,
        generatedAt: new Date().toLocaleTimeString('en-US', { hour12: false }),
        rawBytes: pubBytes,
        paramSet: ckpParam,
      })
    } catch (e: unknown) {
      setOpError(e instanceof Error ? e.message : String(e))
      setKeygenPhase('idle')
    } finally {
      setIsGenerating(false)
    }
  }, [hsm, ckpParam, selected.name])

  const handleSign = useCallback(async () => {
    if (
      !hsm.isReady ||
      !activeKeyHandle ||
      !hsm.moduleRef.current ||
      !hsm.hSessionRef.current ||
      isExhausted
    )
      return
    setOpError(null)
    try {
      let msgBytes = new TextEncoder().encode(messageToSign)
      if (preHash) {
        const hashBuf = await globalThis.crypto.subtle.digest('SHA-256', msgBytes)
        msgBytes = new Uint8Array(hashBuf)
      }

      const t0 = performance.now()
      const sig = hsm_statefulSignBytes(
        hsm.moduleRef.current,
        hsm.hSessionRef.current,
        CKM_XMSS,
        activeKeyHandle,
        msgBytes
      )
      const computeTimeMs = performance.now() - t0

      const remainingAfter =
        hsm_getKeysRemaining(hsm.moduleRef.current, hsm.hSessionRef.current, activeKeyHandle) ?? 0

      const msgLabel = messageToSign.length > 32 ? messageToSign.slice(0, 32) + '…' : messageToSign
      const newEntry: XMSSLogEntry = {
        index: sigCounter,
        message: msgLabel,
        timestamp: Date.now(),
        sigSize: sig.length,
        computeTimeMs,
        sigHex: toHex(sig),
        remainingAfter,
        height: xmssHeight,
      }

      const newCounter = sigCounter + 1
      setSigCounter(newCounter)
      setSignatureLog((prev) => [newEntry, ...prev].slice(0, 20))
      if (remainingAfter === 0 || newCounter >= maxSigs) setIsExhausted(true)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('0x00000203') || msg.includes('CKR_KEY_EXHAUSTED')) {
        setIsExhausted(true)
      } else {
        setOpError(msg)
      }
    }
  }, [hsm, activeKeyHandle, messageToSign, preHash, sigCounter, isExhausted, xmssHeight, maxSigs])

  return (
    <div className="space-y-6">
      {!isEmbedded && <LiveHSMToggle hsm={hsm} operations={LIVE_OPERATIONS} />}

      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">XMSS Key Generation</h3>
        <p className="text-sm text-muted-foreground">
          Select an SP 800-208 XMSS parameter set to explore tree structure and compare with LMS at
          equivalent security levels. XMSS adds bitmask-based tree hashing for stronger multi-target
          attack resistance.
        </p>
      </div>

      {/* SP 800-208 cascading parameter selector */}
      <div className="space-y-3 bg-muted/30 rounded-lg p-4 border border-border">
        {/* Hash family */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-14 shrink-0">Hash</span>
          <div className="flex gap-2">
            {(['SHA-256', 'SHAKE-256'] as XMSSHash[]).map((h) => (
              <Button
                variant="ghost"
                key={h}
                onClick={() => handleHashChange(h)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  xmssHash === h
                    ? 'bg-secondary/20 text-secondary border border-secondary/50'
                    : 'bg-muted/50 text-muted-foreground border border-border hover:border-secondary/30'
                }`}
              >
                {h}
              </Button>
            ))}
          </div>
        </div>

        {/* Tree height */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-14 shrink-0">Height</span>
          <div className="flex gap-2">
            {XMSS_HEIGHTS.map((h) => {
              const isProductionOnly = h > 15
              return (
                <div key={h} className="relative group">
                  <Button
                    variant="ghost"
                    onClick={() => handleHeightChange(h)}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                      isProductionOnly
                        ? xmssHeight === h
                          ? 'bg-muted/30 text-muted-foreground/60 border border-border/50 cursor-not-allowed'
                          : 'bg-muted/20 text-muted-foreground/40 border border-border/30 cursor-not-allowed'
                        : xmssHeight === h
                          ? 'bg-secondary/20 text-secondary border border-secondary/50'
                          : 'bg-muted/50 text-muted-foreground border border-border hover:border-secondary/30'
                    }`}
                  >
                    H{h}
                    {isProductionOnly && (
                      <span className="ml-1 text-[9px] text-muted-foreground/50">prod</span>
                    )}
                  </Button>
                  {isProductionOnly && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-44 p-2 rounded-lg border border-border bg-background shadow-lg text-[10px] text-muted-foreground leading-relaxed text-center pointer-events-none invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity z-50">
                      H{h}: 2^{h} signatures — keygen takes minutes. Production deployments only.
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Computed summary bar */}
        <div className="mt-1 pt-3 border-t border-border flex flex-wrap gap-3 text-[10px] font-mono">
          <span className="text-secondary font-bold">{selected.name}</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-foreground">{formatSignatureCount(maxSigs)} signatures max</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-foreground">{formatBytes(sigSize)}/sig</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-foreground">128-bit (NIST Level 1)</span>
        </div>
      </div>

      {/* Collapsible algorithm details */}
      <div className="border border-border rounded-lg overflow-hidden">
        <Button
          variant="ghost"
          onClick={() => setShowAlgoInfo(!showAlgoInfo)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-foreground bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Info size={14} className="text-secondary" />
            Algorithm details — SP 800-208 XMSS
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
                value: xmssHash,
                body:
                  xmssHash === 'SHA-256'
                    ? 'SHA-256 relies on collision resistance. Standard choice; NIST FIPS 180-4 compliant.'
                    : 'SHAKE-256 uses XOF bitmasks — removes the collision-resistance assumption. Same parameter names and sizes; stronger multi-target security than SHA-256.',
              },
              {
                label: 'n = 32 bytes (fixed)',
                value: 'n=32 → 256-bit output',
                body: 'SP 800-208 §5 approves only 256-bit (n=32) XMSS sets. RFC 8391 also defines n=64 (512-bit) variants (e.g. XMSS-SHA2_10_512), but these are NOT included in NIST SP 800-208 and are not implemented here. No m selector needed.',
              },
              {
                label: 'H — Tree Height',
                value: `H${xmssHeight} → 2^${xmssHeight} = ${formatSignatureCount(maxSigs)} sigs`,
                body: `Each WOTS+ leaf key is used exactly once. H10=1,024 · H16=65,536 · H20=1,048,576 signatures. H20 keygen is disabled here — too slow for demo purposes (~10 min).`,
              },
              {
                label: 'WOTS+ (w=16, fixed)',
                value: '67 chains · ≤15 hash steps/chain',
                body: 'XMSS fixes w=16 per RFC 8391 — the same as LMOTS W=4. Each WOTS+ chain can encode log₂(16)=4 bits of the message hash and requires at most 15 hash iterations to evaluate. 67 chains × n=32 bytes = 2,144 bytes of chain values per WOTS+ leaf. W is not user-selectable in XMSS: it is part of the parameter set name and cannot be changed without generating a new key.',
              },
              {
                label: 'Selected Parameter Set',
                value: selected.name,
                body: `Sig size: ${formatBytes(sigSize)} · Max sigs: ${formatSignatureCount(maxSigs)} · Security: 128-bit (NIST Level 1)`,
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Tree visualization */}
        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <h4 className="text-sm font-bold text-foreground mb-3">Single Tree Structure</h4>

          <div className="space-y-2 overflow-x-auto">
            {/* Root */}
            <div className="flex justify-center">
              <div className="px-3 py-1.5 rounded bg-secondary/20 text-secondary text-[10px] font-bold border border-secondary/30">
                Root (PK)
              </div>
            </div>

            {/* Intermediate levels */}
            {Array.from({ length: treeDepth - 1 }, (_, level) => {
              const nodesAtLevel = Math.pow(2, level + 1)
              const maxDisplay = Math.min(nodesAtLevel, 8)
              const truncated = nodesAtLevel > maxDisplay
              return (
                <div key={level} className="flex justify-center gap-1 flex-wrap">
                  {Array.from({ length: maxDisplay }, (__, i) => (
                    <div
                      key={i}
                      className="px-1.5 py-1 rounded bg-muted text-muted-foreground text-[9px] font-medium border border-border"
                    >
                      L{level + 1}:{i}
                    </div>
                  ))}
                  {truncated && (
                    <div className="px-1.5 py-1 text-muted-foreground text-[9px]">
                      ...+{nodesAtLevel - maxDisplay}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Leaves */}
            <div className="flex justify-center gap-1 flex-wrap">
              {Array.from({ length: Math.min(totalLeaves, 8) }, (_, i) => (
                <div
                  key={i}
                  className={`px-1.5 py-1 rounded text-[9px] font-bold border ${
                    i === 0
                      ? 'bg-success/10 text-success border-success/30'
                      : 'bg-muted/50 text-muted-foreground border-border'
                  }`}
                >
                  WOTS+-{i}
                </div>
              ))}
              {totalLeaves > 8 && (
                <div className="px-1.5 py-1 text-muted-foreground text-[9px]">
                  ...+{totalLeaves - 8}
                </div>
              )}
            </div>
          </div>

          {xmssHeight > 5 && (
            <div className="mt-3 flex items-start gap-2 bg-secondary/5 rounded p-2 border border-secondary/10">
              <Info size={12} className="text-secondary shrink-0 mt-0.5" />
              <p className="text-[10px] text-muted-foreground">
                Full tree has {xmssHeight} levels with {formatSignatureCount(maxSigs)} leaf nodes.
              </p>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-border space-y-3">
            {isH20 ? (
              <div className="flex items-start gap-2 p-3 rounded-md border border-warning/40 bg-warning/5">
                <AlertTriangle size={14} className="text-warning shrink-0 mt-0.5" />
                <p className="text-xs text-warning">
                  H20 keygen takes ~10 minutes — not practical for this simulator. Select H10 or H16
                  to generate a key.
                </p>
              </div>
            ) : (
              <Button
                variant="ghost"
                onClick={handleGenerateKey}
                disabled={!hsm.isReady || isGenerating}
                className="w-full font-bold bg-secondary hover:bg-secondary/90 text-secondary-foreground"
              >
                <Key className="mr-2 h-4 w-4" />
                {isGenerating
                  ? 'Generating Merkle Tree...'
                  : `Generate XMSS Key (${selected.name})`}
              </Button>
            )}

            {/* Keygen progress bar — CSS animation runs on compositor thread,
                continues while WASM blocks the JS main thread */}
            {keygenPhase !== 'idle' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className={keygenPhase === 'done' ? 'text-success' : 'text-secondary'}>
                    {keygenPhase === 'done'
                      ? `✓ ${formatSignatureCount(maxSigs)} one-time signatures ready`
                      : `Building tree — 2^${xmssHeight} = ${formatSignatureCount(maxSigs)} leaves`}
                  </span>
                  <span className="font-mono text-muted-foreground">
                    {keygenPhase === 'done'
                      ? '100%'
                      : `~${keygenDurationMs >= 60000 ? Math.round(keygenDurationMs / 60000) + ' min' : Math.round(keygenDurationMs / 1000) + ' s'}`}
                  </span>
                </div>
                <div className="w-full bg-background rounded-full h-2.5 border border-border overflow-hidden">
                  <div
                    className={`h-full rounded-full ${keygenPhase === 'done' ? 'bg-success' : 'bg-secondary'}`}
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
              </div>
            )}
          </div>
        </div>

        {/* Right: Parameter details */}
        <div className="space-y-3">
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <h4 className="text-sm font-bold text-foreground mb-3">Key Parameters</h4>
            <div className="space-y-2">
              {[
                { label: 'Parameter Set', value: selected.name },
                { label: 'Hash Function', value: xmssHash },
                { label: 'Tree Height', value: String(xmssHeight) },
                { label: 'n (output length)', value: '32 bytes (fixed by SP 800-208)' },
                { label: 'w (Winternitz param)', value: '16 (fixed by RFC 8391)' },
                { label: 'Security Level', value: '128-bit (NIST Level 1)' },
              ].map((row) => (
                <div key={row.label} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className="font-bold text-foreground">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <h4 className="text-sm font-bold text-foreground mb-3">Sizes &amp; Capacity</h4>
            <div className="space-y-2">
              {[
                { label: 'Public Key', value: formatBytes(selected.publicKeySize) },
                { label: 'Private Key', value: formatBytes(selected.privateKeySize) },
                { label: 'Signature Size', value: formatBytes(sigSize) },
                {
                  label: 'Max Signatures',
                  value: formatSignatureCount(maxSigs),
                },
              ].map((row) => (
                <div key={row.label} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className="font-bold text-foreground">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* LMS comparison */}
          {comparableLMS && (
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-foreground">
                  vs LMS (H{comparableLMS.treeHeight}/W{comparableLMS.winternitzParam})
                </h4>
                <Button
                  variant="ghost"
                  onClick={() => setShowComparison(!showComparison)}
                  className="text-xs text-secondary hover:text-secondary/80 transition-colors"
                >
                  {showComparison ? 'Hide' : 'Show'}
                </Button>
              </div>
              {showComparison && (
                <div className="space-y-2">
                  {[
                    {
                      label: 'Signature Size',
                      xmss: formatBytes(sigSize),
                      lms: formatBytes(comparableLMS.signatureSize),
                      xmssWins: sigSize < comparableLMS.signatureSize,
                    },
                    {
                      label: 'Public Key',
                      xmss: formatBytes(selected.publicKeySize),
                      lms: formatBytes(comparableLMS.publicKeySize),
                      xmssWins: selected.publicKeySize <= comparableLMS.publicKeySize,
                    },
                    {
                      label: 'Private Key',
                      xmss: formatBytes(selected.privateKeySize),
                      lms: formatBytes(comparableLMS.privateKeySize),
                      xmssWins: selected.privateKeySize < comparableLMS.privateKeySize,
                    },
                    {
                      label: 'Max Signatures',
                      xmss: formatSignatureCount(maxSigs),
                      lms: formatSignatureCount(comparableLMS.maxSignatures),
                      xmssWins: maxSigs >= comparableLMS.maxSignatures,
                    },
                  ].map((row) => (
                    <div key={row.label} className="text-xs">
                      <div className="text-muted-foreground mb-0.5">{row.label}</div>
                      <div className="flex gap-2">
                        <span
                          className={`flex-1 px-2 py-1 rounded border text-center ${
                            row.xmssWins
                              ? 'bg-success/5 border-success/20 text-success'
                              : 'bg-muted border-border text-muted-foreground'
                          }`}
                        >
                          XMSS: {row.xmss}
                        </span>
                        <span
                          className={`flex-1 px-2 py-1 rounded border text-center ${
                            !row.xmssWins
                              ? 'bg-success/5 border-success/20 text-success'
                              : 'bg-muted border-border text-muted-foreground'
                          }`}
                        >
                          LMS: {row.lms}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {activeKeyHandle && (
        <div className="space-y-4 mt-6">
          {/* Counter + progress */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-foreground">Signature Counter</h4>
              <span className="text-2xl font-bold font-mono text-secondary">
                {sigCounter} / {formatSignatureCount(maxSigs)}
              </span>
            </div>
            <div className="w-full bg-background rounded-full h-3 border border-border mb-2">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isExhausted
                    ? 'bg-destructive'
                    : sigCounter / maxSigs > 0.8
                      ? 'bg-warning'
                      : 'bg-secondary/60'
                }`}
                style={{ width: `${Math.min(100, (sigCounter / maxSigs) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Used: {sigCounter}</span>
              <span>
                Remaining: {isExhausted ? 'NONE' : formatSignatureCount(maxSigs - sigCounter)}
              </span>
            </div>
          </div>

          {isExhausted && (
            <div className="bg-destructive/10 rounded-lg p-4 border border-destructive/30 animate-pulse">
              <div className="flex items-center gap-2 mb-1">
                <ShieldAlert size={18} className="text-destructive" />
                <span className="text-sm font-bold text-destructive">KEY EXHAUSTED</span>
              </div>
              <p className="text-xs text-foreground/80">
                All {formatSignatureCount(maxSigs)} WOTS+ leaf keys have been used. Generate a new
                key to continue signing.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left: sign controls */}
            <div className="bg-muted/50 rounded-lg p-4 border border-border space-y-3">
              <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                <PenLine size={14} /> Sign Message
              </h4>
              <div className="space-y-1">
                <label
                  htmlFor="xmss-sign-input"
                  className="text-xs text-muted-foreground font-bold"
                >
                  Message
                </label>
                <input
                  id="xmss-sign-input"
                  type="text"
                  value={messageToSign}
                  onChange={(e) => setMessageToSign(e.target.value)}
                  disabled={isExhausted}
                  className="w-full bg-background border border-input rounded px-3 py-2 text-sm disabled:opacity-50"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={preHash}
                  onChange={(e) => setPreHash(e.target.checked)}
                  className="w-4 h-4 accent-secondary"
                />
                <span className="text-xs text-muted-foreground">
                  Pre-hash with SHA-256 (hash-then-sign)
                </span>
              </label>
              <Button
                variant="ghost"
                onClick={handleSign}
                disabled={isExhausted}
                className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground"
              >
                <PenLine className="mr-2 h-4 w-4" /> Sign with CKM_XMSS
              </Button>
            </div>

            {/* Right: signature log */}
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <h4 className="text-sm font-bold text-foreground mb-3">Signature Log</h4>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {signatureLog.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    No signatures yet. Click &quot;Sign with CKM_XMSS&quot; to begin.
                  </p>
                ) : (
                  signatureLog.map((entry) => {
                    const entryKey = `${entry.index}-${entry.timestamp}`
                    const isInspecting =
                      inspectedEntry?.index === entry.index &&
                      inspectedEntry?.timestamp === entry.timestamp
                    // XMSS sig layout: idx(4) + r(32) + WOTS+σ(67×32=2144) + auth(H×32)
                    const authBytes = entry.height * 32
                    const sections = [
                      {
                        label: 'idx',
                        bytes: 4,
                        color: 'bg-secondary/20 text-secondary border-secondary/30',
                        hexBg: 'bg-secondary/20',
                      },
                      {
                        label: 'r',
                        bytes: 32,
                        color: 'bg-muted text-muted-foreground border-border',
                        hexBg: 'bg-muted/40',
                      },
                      {
                        label: 'WOTS+σ',
                        bytes: 2144,
                        color: 'bg-primary/20 text-primary border-primary/30',
                        hexBg: 'bg-primary/20',
                      },
                      {
                        label: `auth (H${entry.height})`,
                        bytes: authBytes,
                        color: 'bg-success/20 text-success border-success/30',
                        hexBg: 'bg-success/20',
                      },
                    ]
                    return (
                      <div key={entryKey}>
                        <div
                          role="button"
                          tabIndex={0}
                          className={`flex items-center gap-2 text-[10px] font-mono px-2 py-1.5 rounded cursor-pointer transition-colors ${
                            isInspecting
                              ? 'bg-secondary/10 border border-secondary/30 text-foreground'
                              : 'bg-background/50 text-muted-foreground hover:bg-muted/60'
                          }`}
                          onClick={() => setInspectedEntry(isInspecting ? null : entry)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ')
                              setInspectedEntry(isInspecting ? null : entry)
                          }}
                        >
                          <CheckCircle size={10} className="text-success shrink-0" />
                          <span className="font-bold w-12 shrink-0 text-secondary">
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
                            className={`shrink-0 ${isInspecting ? 'text-secondary' : 'text-muted-foreground'}`}
                          >
                            {isInspecting ? '▲' : '▼'}
                          </span>
                        </div>
                        {isInspecting && (
                          <div className="mt-1 mb-1 p-3 bg-background border border-secondary/20 rounded text-[9px] font-mono space-y-2">
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
                                <span className="text-muted-foreground">Leaf:</span>{' '}
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
                            </div>
                            <div>
                              <div className="text-muted-foreground mb-1">
                                XMSS signature layout (RFC 8391 §4.1.12)
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
                                  {copiedKey === entryKey ? (
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
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {opError && (
        <div className="flex items-start gap-2 p-3 rounded-md border border-destructive/40 bg-destructive/5 text-destructive text-sm">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span className="font-mono break-all">{opError}</span>
        </div>
      )}

      {!isEmbedded && hsm.isReady && (
        <div className="space-y-4">
          <Pkcs11LogPanel
            log={hsm.log}
            onClear={hsm.clearLog}
            title="PKCS#11 Call Log"
            defaultOpen={true}
            filterFns={LIVE_OPERATIONS}
          />
          {hsm.keys.length > 0 && (
            <HsmKeyInspector
              keys={hsm.keys}
              moduleRef={hsm.moduleRef}
              hSessionRef={hsm.hSessionRef}
              onRemoveKey={hsm.removeKey}
            />
          )}
        </div>
      )}
    </div>
  )
}
