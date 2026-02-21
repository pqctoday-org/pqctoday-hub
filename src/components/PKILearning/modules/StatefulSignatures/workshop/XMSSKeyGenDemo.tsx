import React, { useState, useMemo } from 'react'
import { Info, ChevronDown, ChevronUp } from 'lucide-react'
import {
  XMSS_PARAMETER_SETS,
  LMS_PARAMETER_SETS,
  WORKSHOP_DISPLAY_PARAMS,
  formatSignatureCount,
  formatBytes,
  type XMSSParameterSet,
} from '../data/statefulSigsConstants'

interface XMSSKeyGenDemoProps {
  initialParamId?: string
}

export const XMSSKeyGenDemo: React.FC<XMSSKeyGenDemoProps> = ({
  initialParamId = WORKSHOP_DISPLAY_PARAMS.xmss[0],
}) => {
  const [selectedParamId, setSelectedParamId] = useState<string>(initialParamId)
  const [showAllParams, setShowAllParams] = useState(false)
  const [showComparison, setShowComparison] = useState(true)

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

  return (
    <div className="space-y-6">
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
              {param.name.replace('XMSS-', '').replace('XMSS^MT-', 'MT:')}
              {param.variant === 'multi-tree' && (
                <span className="ml-1 text-[9px] opacity-60">(MT)</span>
              )}
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
    </div>
  )
}
