import React, { useState, useMemo } from 'react'
import { Info, ChevronDown, ChevronUp } from 'lucide-react'
import {
  LMS_PARAMETER_SETS,
  WORKSHOP_DISPLAY_PARAMS,
  formatSignatureCount,
  formatBytes,
  type LMSParameterSet,
} from '../data/statefulSigsConstants'

interface LMSKeyGenDemoProps {
  initialParamId?: string
}

export const LMSKeyGenDemo: React.FC<LMSKeyGenDemoProps> = ({
  initialParamId = WORKSHOP_DISPLAY_PARAMS.lms[0],
}) => {
  const [selectedParamId, setSelectedParamId] = useState<string>(initialParamId)
  const [showAllParams, setShowAllParams] = useState(false)

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
              onClick={() => setSelectedParamId(param.id)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                selectedParamId === param.id
                  ? 'bg-primary/20 text-primary border border-primary/50'
                  : 'bg-muted/50 text-muted-foreground border border-border hover:border-primary/30'
              }`}
            >
              {param.variant === 'multi-tree'
                ? `HSS/W${param.winternitzParam}`
                : `H${param.treeHeight}/W${param.winternitzParam}`}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Merkle tree visualization */}
        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <h4 className="text-sm font-bold text-foreground mb-3">
            {selected.variant === 'multi-tree' ? 'HSS Multi-Tree' : 'Merkle Tree'} Structure
            {selected.variant === 'multi-tree' ? (
              <span className="ml-2 text-[10px] font-normal text-primary">
                (showing one sub-tree of depth {treeDepth})
              </span>
            ) : (
              <span className="ml-2 text-[10px] font-normal text-primary">
                (showing {treeDepth} of {selected.treeHeight} levels)
              </span>
            )}
          </h4>
          <div className="space-y-2 overflow-x-auto">
            {/* Root */}
            <div className="flex justify-center">
              <div className="px-3 py-1.5 rounded bg-primary/20 text-primary text-[10px] font-bold border border-primary/30">
                {selected.variant === 'multi-tree' ? 'HSS Root' : 'Root (PK)'}
              </div>
            </div>

            {/* Multi-tree indicator */}
            {selected.variant === 'multi-tree' && (
              <>
                <div className="text-center text-[9px] text-muted-foreground my-1">
                  &darr; signs sub-tree roots &darr;
                </div>
                <div className="flex justify-center gap-2 mb-2">
                  <div className="px-2 py-1 rounded bg-primary/10 text-primary text-[9px] font-bold border border-primary/20">
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
                  OTS-{i}
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
            <div className="mt-3 flex items-start gap-2 bg-primary/5 rounded p-2 border border-primary/10">
              <Info size={12} className="text-primary shrink-0 mt-0.5" />
              <p className="text-[10px] text-muted-foreground">
                Full tree has {selected.treeHeight} levels with{' '}
                {formatSignatureCount(selected.maxSignatures)} leaves.
                {selected.variant === 'multi-tree'
                  ? ' Multi-tree chains multiple sub-trees for expanded capacity.'
                  : ` Only the top ${treeDepth} levels are shown for readability.`}
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
                { label: 'Tree Height (H)', value: String(selected.treeHeight) },
                { label: 'Winternitz (W)', value: String(selected.winternitzParam) },
                {
                  label: 'Variant',
                  value:
                    selected.variant === 'multi-tree' ? 'Multi-tree (HSS)' : 'Single tree (LMS)',
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
                  value: `${formatSignatureCount(selected.maxSignatures)} (2^${selected.treeHeight})`,
                },
              ].map((row) => (
                <div key={row.label} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className="font-bold text-foreground">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Capacity bar */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <h4 className="text-sm font-bold text-foreground mb-2">Signing Capacity</h4>
            <div className="w-full bg-background rounded-full h-3 border border-border">
              <div
                className="h-full rounded-full bg-primary/60 transition-all duration-500"
                style={{ width: `${Math.min(100, (selected.treeHeight / 25) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>H=5 (32 sigs)</span>
              <span>H=25 (33M sigs)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
