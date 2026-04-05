// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo, useCallback } from 'react'
import { Info, ChevronDown, ChevronUp, Key, PenLine, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Pkcs11LogPanel } from '@/components/shared/Pkcs11LogPanel'
import { HsmKeyInspector } from '@/components/shared/HsmKeyInspector'
import {
  XMSS_PARAMETER_SETS,
  LMS_PARAMETER_SETS,
  WORKSHOP_DISPLAY_PARAMS,
  formatSignatureCount,
  formatBytes,
  type XMSSParameterSet,
} from '../data/statefulSigsConstants'
import {
  CKM_XMSS_KEY_PAIR_GEN,
  CKK_XMSS,
  CKM_XMSS,
  CKP_XMSS_SHA2_10_256,
  CKP_XMSS_SHA2_16_256,
  CKP_XMSS_SHA2_20_256,
} from '@/wasm/softhsm/constants'
import { hsm_generateStatefulKeyPair, hsm_statefulSignBytes } from '@/wasm/softhsm/pqc'
import { useHSM } from '@/hooks/useHSM'
import { LiveHSMToggle } from '@/components/shared/LiveHSMToggle'

const LIVE_OPERATIONS = ['C_GenerateKeyPair', 'C_SignInit', 'C_Sign']

const toHex = (bytes: Uint8Array): string =>
  Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

interface SignatureBreakdown {
  xmssPayload: string
  authPath: string
  totalSize: number
}

interface XMSSKeyGenDemoProps {
  initialParamId?: string
}

export const XMSSKeyGenDemo: React.FC<XMSSKeyGenDemoProps> = ({
  initialParamId = WORKSHOP_DISPLAY_PARAMS.xmss[0],
}) => {
  const hsm = useHSM('rust')
  const [selectedParamId, setSelectedParamId] = useState<string>(initialParamId)
  const [showAllParams, setShowAllParams] = useState(false)
  const [showComparison, setShowComparison] = useState(true)

  // Interactive State
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeKeyHandle, setActiveKeyHandle] = useState<number | null>(null)
  const [opError, setOpError] = useState<string | null>(null)

  // Signing State
  const [messageToSign, setMessageToSign] = useState<string>('Hello PQC World')
  const [signatureHex, setSignatureHex] = useState<string | null>(null)
  const [signatureBreakdown, setSignatureBreakdown] = useState<SignatureBreakdown | null>(null)

  const displayParams = useMemo(() => {
    if (showAllParams) return XMSS_PARAMETER_SETS
    return XMSS_PARAMETER_SETS.filter((p) =>
      (WORKSHOP_DISPLAY_PARAMS.xmss as readonly string[]).includes(p.id)
    )
  }, [showAllParams])

  const selected: XMSSParameterSet =
    XMSS_PARAMETER_SETS.find((p) => p.id === selectedParamId) || XMSS_PARAMETER_SETS[0]

  // Find comparable LMS parameter set (same tree height, W=4 as default comparison)
  const comparableLMS = useMemo(() => {
    const sameHeight = LMS_PARAMETER_SETS.filter((p) => p.treeHeight === selected.treeHeight)
    return sameHeight.find((p) => p.winternitzParam === 4) || sameHeight[0] || null
  }, [selected.treeHeight])

  const treeDepth = Math.min(selected.treeHeight, 5)
  const totalLeaves = Math.pow(2, treeDepth)

  const handleGenerateKey = useCallback(async () => {
    if (!hsm.isReady || !hsm.hSessionRef.current || !hsm.moduleRef.current) return
    setIsGenerating(true)
    setOpError(null)
    try {
      await new Promise((r) => setTimeout(r, 100))

      const { privHandle } = hsm_generateStatefulKeyPair(
        hsm.moduleRef.current,
        hsm.hSessionRef.current,
        CKM_XMSS_KEY_PAIR_GEN,
        CKK_XMSS,
        selected.treeHeight === 10
          ? CKP_XMSS_SHA2_10_256
          : selected.treeHeight === 16
            ? CKP_XMSS_SHA2_16_256
            : selected.treeHeight === 20
              ? CKP_XMSS_SHA2_20_256
              : CKP_XMSS_SHA2_10_256
      )

      setActiveKeyHandle(privHandle)
      hsm.addKey({
        handle: privHandle,
        family: 'slh-dsa',
        role: 'private',
        label: `XMSS Key (${selected.name})`,
        generatedAt: new Date().toLocaleTimeString('en-US', { hour12: false }),
      })
    } catch (e: unknown) {
      setOpError(e instanceof Error ? e.message : String(e))
    } finally {
      setIsGenerating(false)
    }
  }, [hsm, selected])

  const handleSign = useCallback(() => {
    if (!hsm.isReady || !activeKeyHandle || !hsm.moduleRef.current || !hsm.hSessionRef.current)
      return
    setOpError(null)
    try {
      const msgBytes = new TextEncoder().encode(messageToSign)

      const sig = hsm_statefulSignBytes(
        hsm.moduleRef.current,
        hsm.hSessionRef.current,
        CKM_XMSS,
        activeKeyHandle,
        msgBytes
      )

      if (sig.length > 0) {
        const hex = toHex(sig)
        setSignatureHex(hex)

        setSignatureBreakdown({
          totalSize: sig.length,
          xmssPayload: hex.substring(0, 100) + '...',
          authPath: hex.substring(100, 200) + '...',
        })
      }
    } catch (e: unknown) {
      setOpError(e instanceof Error ? e.message : String(e))
    }
  }, [hsm, activeKeyHandle, messageToSign])

  return (
    <div className="space-y-6">
      <LiveHSMToggle hsm={hsm} operations={LIVE_OPERATIONS} />
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">XMSS Key Generation</h3>
        <p className="text-sm text-muted-foreground">
          Select an XMSS parameter set to explore tree structure and compare with LMS at equivalent
          security levels. XMSS adds bitmask-based tree hashing for stronger multi-target attack
          resistance.
        </p>
      </div>

      {/* Parameter selector */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-foreground">Parameter Set</span>
          <button
            onClick={() => setShowAllParams(!showAllParams)}
            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
          >
            {showAllParams ? (
              <>
                Show recommended <ChevronUp size={12} />
              </>
            ) : (
              <>
                Show all params <ChevronDown size={12} />
              </>
            )}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {displayParams.map((param) => (
            <button
              key={param.id}
              onClick={() => setSelectedParamId(param.id)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                selectedParamId === param.id
                  ? 'bg-secondary/20 text-secondary border border-secondary/50'
                  : 'bg-muted/50 text-muted-foreground border border-border hover:border-secondary/30'
              }`}
            >
              {param.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Tree visualization */}
        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <h4 className="text-sm font-bold text-foreground mb-3">
            {selected.variant === 'multi-tree' ? 'Multi-Tree' : 'Single Tree'} Structure
            {selected.variant === 'multi-tree' && (
              <span className="ml-2 text-[10px] font-normal text-secondary">
                (showing one sub-tree)
              </span>
            )}
          </h4>

          <div className="space-y-2 overflow-x-auto">
            {/* Root */}
            <div className="flex justify-center">
              <div className="px-3 py-1.5 rounded bg-secondary/20 text-secondary text-[10px] font-bold border border-secondary/30">
                {selected.variant === 'multi-tree' ? 'MT Root' : 'Root (PK)'}
              </div>
            </div>

            {/* Multi-tree indicator */}
            {selected.variant === 'multi-tree' && (
              <>
                <div className="text-center text-[9px] text-muted-foreground">
                  &darr; signs sub-tree roots &darr;
                </div>
                <div className="flex justify-center gap-2">
                  <div className="px-2 py-1 rounded bg-secondary/10 text-secondary text-[9px] font-bold border border-secondary/20">
                    Sub-tree 0
                  </div>
                  <div className="px-2 py-1 rounded bg-muted text-muted-foreground text-[9px] border border-border">
                    Sub-tree 1
                  </div>
                  <div className="text-muted-foreground text-[9px] flex items-center">...</div>
                </div>
              </>
            )}

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

          {selected.treeHeight > 5 && (
            <div className="mt-3 flex items-start gap-2 bg-secondary/5 rounded p-2 border border-secondary/10">
              <Info size={12} className="text-secondary shrink-0 mt-0.5" />
              <p className="text-[10px] text-muted-foreground">
                Full tree has {selected.treeHeight} levels with{' '}
                {formatSignatureCount(selected.maxSignatures)} leaf nodes.
                {selected.variant === 'multi-tree' &&
                  ' Multi-tree chains multiple sub-trees for expanded capacity.'}
              </p>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-border">
            <Button
              onClick={handleGenerateKey}
              disabled={!hsm.isReady || isGenerating}
              className="w-full font-bold bg-secondary hover:bg-secondary/90 text-secondary-foreground"
            >
              <Key className="mr-2 h-4 w-4" />
              {isGenerating
                ? 'Generating Merkle Tree...'
                : `Generate ${selected.variant === 'multi-tree' ? 'MT' : 'XMSS'} Key`}
            </Button>
          </div>
        </div>

        {/* Right: Parameter details */}
        <div className="space-y-3">
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <h4 className="text-sm font-bold text-foreground mb-3">Key Parameters</h4>
            <div className="space-y-2">
              {[
                { label: 'Parameter Set', value: selected.name },
                { label: 'Hash Function', value: selected.hashFunction },
                { label: 'Tree Height', value: String(selected.treeHeight) },
                {
                  label: 'Variant',
                  value: selected.variant === 'multi-tree' ? 'Multi-tree' : 'Single tree',
                },
                { label: 'Security Level', value: selected.securityLevel },
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
                { label: 'Signature Size', value: formatBytes(selected.signatureSize) },
                {
                  label: 'Max Signatures',
                  value: formatSignatureCount(selected.maxSignatures),
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
                <button
                  onClick={() => setShowComparison(!showComparison)}
                  className="text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  {showComparison ? 'Hide' : 'Show'}
                </button>
              </div>
              {showComparison && (
                <div className="space-y-2">
                  {[
                    {
                      label: 'Signature Size',
                      xmss: formatBytes(selected.signatureSize),
                      lms: formatBytes(comparableLMS.signatureSize),
                      xmssWins: selected.signatureSize < comparableLMS.signatureSize,
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
                      xmss: formatSignatureCount(selected.maxSignatures),
                      lms: formatSignatureCount(comparableLMS.maxSignatures),
                      xmssWins: selected.maxSignatures >= comparableLMS.maxSignatures,
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
        <div className="p-6 border border-secondary/30 bg-secondary/5 rounded-lg space-y-6 mt-6">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <PenLine className="h-5 w-5" /> Interactive Signature Dashboard
          </h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="xmss-sign-input"
                  className="text-xs font-bold text-muted-foreground"
                >
                  Input Data (String)
                </label>
                <input
                  id="xmss-sign-input"
                  type="text"
                  value={messageToSign}
                  onChange={(e) => setMessageToSign(e.target.value)}
                  className="w-full bg-background border border-input rounded px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-2">
                <span className="text-xs font-bold text-muted-foreground">
                  Pre-Signature Breakdown (Hex)
                </span>
                <pre className="text-[10px] font-mono bg-black/40 text-muted-foreground p-3 rounded border border-border/50 break-all whitespace-pre-wrap">
                  {toHex(new TextEncoder().encode(messageToSign))}
                </pre>
              </div>
              <Button
                onClick={handleSign}
                className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground"
              >
                <PenLine className="mr-2 h-4 w-4" /> Sign with CKM_XMSS
              </Button>
            </div>

            {signatureHex && signatureBreakdown && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-success">
                    Signature Payload ({signatureHex.length / 2} bytes)
                  </span>
                  <pre className="text-[10px] font-mono bg-black/40 text-muted-foreground p-3 rounded border border-success/30 break-all whitespace-pre-wrap h-32 overflow-y-auto">
                    {signatureHex}
                  </pre>
                </div>
                <div className="space-y-2">
                  <span className="text-xs font-bold text-muted-foreground">Decoded Format</span>
                  <div className="bg-background border border-border rounded p-3 text-[10px] space-y-1 font-mono">
                    <div className="text-muted-foreground mt-2 border-t border-border pt-1">
                      XMSS WOTS+ Payload Signature
                    </div>
                    <div className="break-all opacity-70 mb-2">
                      {signatureBreakdown.xmssPayload}
                    </div>
                    <div className="text-muted-foreground border-t border-border pt-1">
                      Authentication Path (Nodes)
                    </div>
                    <div className="break-all opacity-70">{signatureBreakdown.authPath}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {opError && (
        <div className="flex items-start gap-2 p-3 rounded-md border border-destructive/40 bg-destructive/5 text-destructive text-sm">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span className="font-mono break-all">{opError}</span>
        </div>
      )}

      {hsm.isReady && (
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
