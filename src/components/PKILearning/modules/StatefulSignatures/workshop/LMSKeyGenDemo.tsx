import React, { useState, useMemo, useCallback } from 'react'
import { Info, ChevronDown, ChevronUp, Key, PenLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  LMS_PARAMETER_SETS,
  WORKSHOP_DISPLAY_PARAMS,
  formatSignatureCount,
  formatBytes,
  type LMSParameterSet,
} from '../data/statefulSigsConstants'
import {
  CKM_HSS_KEY_PAIR_GEN,
  CKK_HSS,
  CKM_HSS,
  CKP_LMS_SHA256_M32_H5,
  CKP_LMS_SHA256_M32_H10,
  CKP_LMS_SHA256_M32_H15,
  CKP_LMS_SHA256_M32_H20,
  CKP_LMS_SHA256_M32_H25,
} from '@/wasm/softhsm/constants'
import { hsm_generateStatefulKeyPair, hsm_statefulSignBytes } from '@/wasm/softhsm/pqc'
import type { UseHSMResult } from '@/hooks/useHSM'

interface SignatureBreakdown {
  levels: number
  lmsPayload: string
  authPath: string
}

interface LMSKeyGenDemoProps {
  initialParamId?: string
  hsm: UseHSMResult
}

export const LMSKeyGenDemo: React.FC<LMSKeyGenDemoProps> = ({
  initialParamId = WORKSHOP_DISPLAY_PARAMS.lms[0],
  hsm, // Destructure hsm from props
}) => {
  const [selectedParamId, setSelectedParamId] = useState<string>(initialParamId)
  const [showAllParams, setShowAllParams] = useState(false)

  // Interactive State
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeKeyHandle, setActiveKeyHandle] = useState<number | null>(null)

  // Signing State
  const [messageToSign, setMessageToSign] = useState<string>('Hello PQC World')
  const [signatureHex, setSignatureHex] = useState<string | null>(null)
  const [signatureBreakdown, setSignatureBreakdown] = useState<SignatureBreakdown | null>(null)

  const displayParams = useMemo(() => {
    if (showAllParams) return LMS_PARAMETER_SETS
    return LMS_PARAMETER_SETS.filter((p) =>
      (WORKSHOP_DISPLAY_PARAMS.lms as readonly string[]).includes(p.id)
    )
  }, [showAllParams])

  const selected: LMSParameterSet =
    LMS_PARAMETER_SETS.find((p) => p.id === selectedParamId) || LMS_PARAMETER_SETS[0]

  const treeDepth = Math.min(selected.treeHeight, 5)
  const totalLeaves = Math.pow(2, treeDepth)

  const handleGenerateKey = useCallback(async () => {
    if (!hsm.isReady || !hsm.hSessionRef.current || !hsm.moduleRef.current) return
    setIsGenerating(true)
    try {
      // Defer execution slightly to allow UI to show "Generating..."
      await new Promise((r) => setTimeout(r, 100))

      // Map tree height to IANA LMS type ID (RFC 8554 + SP 800-208)
      const heightToIANA: Record<number, number> = {
        5: CKP_LMS_SHA256_M32_H5,
        10: CKP_LMS_SHA256_M32_H10,
        15: CKP_LMS_SHA256_M32_H15,
        20: CKP_LMS_SHA256_M32_H20,
        25: CKP_LMS_SHA256_M32_H25,
      }
      const paramCode = heightToIANA[selected.treeHeight] ?? CKP_LMS_SHA256_M32_H5

      const { privHandle } = hsm_generateStatefulKeyPair(
        hsm.moduleRef.current,
        hsm.hSessionRef.current,
        CKM_HSS_KEY_PAIR_GEN,
        CKK_HSS,
        paramCode
      )

      setActiveKeyHandle(privHandle)
      hsm.addKey({
        handle: privHandle,
        family: 'slh-dsa',
        role: 'private',
        label: `HSS Key (${selected.name})`,
        generatedAt: new Date().toLocaleTimeString('en-US', { hour12: false }),
      })
    } catch (e: unknown) {
      console.error(e)
    } finally {
      setIsGenerating(false)
    }
  }, [hsm, selected])

  const handleSign = useCallback(() => {
    if (!hsm.isReady || !activeKeyHandle || !hsm.moduleRef.current || !hsm.hSessionRef.current)
      return
    try {
      const msgBytes = new TextEncoder().encode(messageToSign)

      const sig = hsm_statefulSignBytes(
        hsm.moduleRef.current,
        hsm.hSessionRef.current,
        CKM_HSS,
        activeKeyHandle,
        msgBytes
      )

      if (sig.length > 0) {
        const hex = Buffer.from(sig).toString('hex')
        setSignatureHex(hex)

        // Mocked breakdown parsing for structural exploration
        setSignatureBreakdown({
          totalSize: sig.length,
          levels: selected.variant === 'multi-tree' ? 2 : 1,
          lmsPayload: hex.substring(0, 100) + '...',
          authPath: hex.substring(100, 200) + '...',
        })
      }
    } catch (e: unknown) {
      console.error(e)
    }
  }, [hsm, activeKeyHandle, messageToSign, selected])

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">LMS Key Generation</h3>
        <p className="text-sm text-muted-foreground">
          Select an LMS parameter set to visualize the Merkle tree structure, key sizes, and signing
          capacity. The tree height determines how many one-time signatures are available.
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
              onClick={() => {
                setSelectedParamId(param.id)
                setActiveKeyHandle(null)
                setSignatureHex(null)
              }}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                selectedParamId === param.id
                  ? 'bg-primary/20 text-primary border border-primary/50'
                  : 'bg-muted/50 text-muted-foreground border border-border hover:border-primary/30'
              }`}
            >
              {param.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Merkle tree visualization */}
        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <h4 className="text-sm font-bold text-foreground mb-3">
            {selected.variant === 'multi-tree'
              ? 'HSS Multi-Tree Structure (L=2)'
              : 'LMS Single-Tree Structure (L=1)'}
          </h4>

          <div className="space-y-6 overflow-x-auto">
            {/* Top Tree (always rendered) */}
            <div className="space-y-2">
              {selected.variant === 'multi-tree' && (
                <div className="text-center font-bold text-[10px] text-primary mb-2 border-b border-primary/20 pb-1">
                  Top Tree (Layer 1) - Root is the Public Key
                </div>
              )}

              <div className="flex justify-center">
                <div className="px-3 py-1.5 rounded bg-primary/20 text-primary text-[10px] font-bold border border-primary/30">
                  {selected.variant === 'multi-tree' ? 'HSS Root (PK)' : 'Root (PK)'}
                </div>
              </div>

              {Array.from({ length: treeDepth - 1 }, (_, level) => {
                const nodes = Math.pow(2, level + 1)
                const max = Math.min(nodes, 8)
                return (
                  <div key={level} className="flex justify-center gap-1 flex-wrap mt-2">
                    {Array.from({ length: max }, (__, i) => (
                      <div
                        key={i}
                        className="px-1.5 py-1 rounded bg-muted text-muted-foreground text-[9px] font-medium border border-border"
                      >
                        L{level + 1}:{i}
                      </div>
                    ))}
                    {nodes > max && (
                      <div className="px-1.5 py-1 text-muted-foreground text-[9px]">
                        ...+{nodes - max}
                      </div>
                    )}
                  </div>
                )
              })}

              <div className="flex justify-center gap-1 flex-wrap mt-2">
                {Array.from({ length: Math.min(totalLeaves, 8) }, (_, i) => (
                  <div
                    key={i}
                    className={`px-1.5 py-1 rounded text-[9px] font-bold border ${i === 0 ? 'bg-success/10 text-success border-success/30' : 'bg-muted/50 text-muted-foreground border-border'}`}
                  >
                    {selected.variant === 'multi-tree' ? 'OTS (Signs Root 0)' : 'OTS-0'}
                  </div>
                ))}
                {totalLeaves > 8 && (
                  <div className="px-1.5 py-1 text-muted-foreground text-[9px]">
                    ...+{totalLeaves - 8}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Tree Mapping (only for multi-tree) */}
            {selected.variant === 'multi-tree' && (
              <>
                <div className="flex justify-center mb-[-0.5rem] mt-4">
                  <div className="text-[9px] text-muted-foreground bg-background px-2 py-0.5 rounded border border-border z-10">
                    Each Top OTS signs a new Sub-Tree Root
                  </div>
                </div>

                {/* Visualizing the "Mini Trees" distribution */}
                <div className="flex justify-center gap-2 items-center flex-wrap pt-2 px-4 mb-4">
                  {Array.from({ length: Math.min(totalLeaves, 4) }, (_, i) => (
                    <div
                      key={i}
                      className={`flex flex-col items-center p-2 rounded border border-dashed ${i === 0 ? 'bg-success/5 border-success/40' : 'bg-muted/30 border-border opacity-50'}`}
                    >
                      <div
                        className={`text-[8px] font-bold ${i === 0 ? 'text-success' : 'text-muted-foreground'} mb-1`}
                      >
                        {i === 0 ? 'Active' : 'Pending...'}
                      </div>
                      <div
                        className={`w-8 h-8 rounded shrink-0 flex items-center justify-center text-[10px] ${i === 0 ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}`}
                      >
                        T{i}
                      </div>
                      <div className="text-[8px] text-muted-foreground mt-1">
                        Leaves: {(selected.maxSignatures / totalLeaves).toLocaleString()}
                      </div>
                    </div>
                  ))}
                  {totalLeaves > 4 && (
                    <div className="text-[10px] text-muted-foreground px-2">
                      ... {totalLeaves - 4} more sub-trees
                    </div>
                  )}
                </div>

                <div className="space-y-2 pt-2 bg-success/5 rounded-lg border border-success/20 p-2 relative">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-success/10 text-success text-[9px] font-bold px-2 py-0.5 rounded border border-success/30">
                    Zooming into Sub-Tree T0
                  </div>

                  <div className="flex justify-center mt-3">
                    <div className="px-3 py-1.5 rounded bg-success/20 text-success text-[10px] font-bold border border-success/30">
                      Sub-Tree Root 0
                    </div>
                  </div>

                  {Array.from({ length: treeDepth - 1 }, (_, level) => {
                    const nodes = Math.pow(2, level + 1)
                    const max = Math.min(nodes, 8)
                    return (
                      <div key={level} className="flex justify-center gap-1 flex-wrap mt-2">
                        {Array.from({ length: max }, (__, i) => (
                          <div
                            key={i}
                            className="px-1.5 py-1 rounded bg-success/10 text-success/80 text-[9px] font-medium border border-success/20"
                          >
                            L{level + 1}:{i}
                          </div>
                        ))}
                        {nodes > max && (
                          <div className="px-1.5 py-1 text-success/60 text-[9px]">
                            ...+{nodes - max}
                          </div>
                        )}
                      </div>
                    )
                  })}

                  <div className="flex justify-center gap-1 flex-wrap mt-2">
                    {Array.from({ length: Math.min(totalLeaves, 8) }, (_, i) => (
                      <div
                        key={i}
                        className={`px-1.5 py-1 rounded text-[9px] font-bold border ${i === 0 ? 'bg-primary/10 text-primary border-primary/30' : 'bg-success/5 text-success/60 border-success/20'}`}
                      >
                        Actual OTS-{i}
                      </div>
                    ))}
                    {totalLeaves > 8 && (
                      <div className="px-1.5 py-1 text-success/60 text-[9px]">
                        ...+{totalLeaves - 8}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-border">
            <Button
              onClick={handleGenerateKey}
              disabled={!hsm.isReady || isGenerating}
              className="w-full font-bold"
            >
              <Key className="mr-2 h-4 w-4" />
              {isGenerating
                ? 'Generating Merkle Tree...'
                : `Generate ${selected.variant === 'multi-tree' ? 'HSS' : 'LMS'} Key`}
            </Button>
          </div>
        </div>

        {/* Right: Parameter details and Tradeoffs */}
        <div className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              Key Parameters & Impact
              <Info size={14} className="text-primary" />
            </h4>
            <div className="space-y-3">
              {[
                {
                  label: 'Scheme / Variant',
                  value:
                    selected.variant === 'multi-tree' ? 'Multi-tree (HSS)' : 'Single tree (LMS)',
                },
                {
                  label: 'Tree Height (H)',
                  value: String(selected.treeHeight),
                  helper:
                    selected.treeHeight > 10
                      ? 'Excessive generation time. (Simulation capped at H=10).'
                      : `Yields ${formatSignatureCount(selected.maxSignatures)} signatures. Key generation handles 2^${selected.treeHeight} leaves.`,
                },
                {
                  label: 'Winternitz (W)',
                  value: String(selected.winternitzParam),
                  helper:
                    selected.winternitzParam === 8
                      ? 'W=8: Tiny signatures, extremely slow signing/verification.'
                      : selected.winternitzParam === 1
                        ? 'W=1: Massive signatures, highly optimized speed.'
                        : `W=${selected.winternitzParam}: Balanced signature size vs compute speed tradeoff.`,
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="border-b border-border/50 pb-2 last:border-0 last:pb-0"
                >
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="font-bold text-foreground">{row.value}</span>
                  </div>
                  {row.helper && (
                    <div className="text-[10px] text-primary/80 bg-primary/5 p-1 rounded">
                      {row.helper}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              Performance Matrix
            </h4>
            <div className="flex justify-between text-xs items-center mb-2">
              <span className="text-muted-foreground">Signature Size</span>
              <span className="font-bold text-foreground block">
                {formatBytes(selected.signatureSize)}
              </span>
            </div>
            <div className="flex justify-between text-xs items-center">
              <span className="text-muted-foreground">Max Signatures</span>
              <span className="font-bold text-foreground block">
                {formatSignatureCount(selected.maxSignatures)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {activeKeyHandle && (
        <div className="p-6 border border-primary/30 bg-primary/5 rounded-lg space-y-6 mt-6">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <PenLine className="h-5 w-5" /> Interactive Signature Dashboard
          </h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="lms-sign-input" className="text-xs font-bold text-muted-foreground">
                  Input Data (String)
                </label>
                <input
                  id="lms-sign-input"
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
                  {Buffer.from(messageToSign).toString('hex')}
                </pre>
              </div>
              <Button onClick={handleSign} className="w-full">
                <PenLine className="mr-2 h-4 w-4" /> Sign with CKM_HSS
              </Button>
            </div>

            {signatureHex && (
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
                    <div className="text-primary font-bold">
                      » Nspk (Levels): {signatureBreakdown.levels}
                    </div>
                    <div className="text-muted-foreground mt-2 border-t border-border pt-1">
                      LMOTS Payload Signature
                    </div>
                    <div className="break-all opacity-70 mb-2">{signatureBreakdown.lmsPayload}</div>
                    <div className="text-muted-foreground border-t border-border pt-1">
                      HSS Authentication Path (Nodes)
                    </div>
                    <div className="break-all opacity-70">{signatureBreakdown.authPath}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
