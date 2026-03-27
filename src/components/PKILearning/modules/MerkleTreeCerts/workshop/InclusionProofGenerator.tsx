// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useCallback, useMemo } from 'react'
import { Search, TreePine, Loader2, Copy, Check } from 'lucide-react'
import {
  buildMerkleTree,
  getInclusionProof,
  type MerkleNode,
  type InclusionProof,
} from '../utils/merkleTree'
import { SAMPLE_CERTS, truncateHash, formatBytes } from '../data/mtcConstants'

type PathNodeType = 'selected' | 'computed' | 'provided' | 'root'

interface PathAnnotation {
  type: PathNodeType
  order: number
  label: string
}

export const InclusionProofGenerator: React.FC = () => {
  const [levels, setLevels] = useState<MerkleNode[][] | null>(null)
  const [isBuilding, setIsBuilding] = useState(false)
  const [selectedLeaf, setSelectedLeaf] = useState<number | null>(null)
  const [proof, setProof] = useState<InclusionProof | null>(null)
  const [copied, setCopied] = useState(false)

  const certs = SAMPLE_CERTS.slice(0, 8)

  const handleBuildTree = useCallback(async () => {
    setIsBuilding(true)
    try {
      const result = await buildMerkleTree(certs)
      setLevels(result.levels)
      setSelectedLeaf(null)
      setProof(null)
    } finally {
      setIsBuilding(false)
    }
  }, [])

  const handleSelectLeaf = useCallback(
    (leafIndex: number) => {
      if (!levels) return
      setSelectedLeaf(leafIndex)
      const p = getInclusionProof(levels, leafIndex)
      setProof(p)
    },
    [levels]
  )

  // Compute the set of nodes that are part of the authentication path
  const authPathHashes = useMemo(() => {
    if (!proof || !levels) return new Set<string>()
    const hashes = new Set<string>()
    // Add the selected leaf
    hashes.add(levels[0][proof.leafIndex].hash)
    // Add sibling nodes in the proof
    let idx = proof.leafIndex
    for (let lvl = 0; lvl < proof.siblings.length; lvl++) {
      const siblingIdx = idx % 2 === 0 ? idx + 1 : idx - 1
      hashes.add(levels[lvl][siblingIdx].hash)
      // Add the parent (computed node)
      const parentIdx = Math.floor(idx / 2)
      if (lvl + 1 < levels.length) {
        hashes.add(levels[lvl + 1][parentIdx].hash)
      }
      idx = parentIdx
    }
    return hashes
  }, [proof, levels])

  // Path annotations: distinguish selected, computed, provided, and root nodes
  const pathAnnotations = useMemo(() => {
    if (!proof || !levels) return new Map<string, PathAnnotation>()
    const annotations = new Map<string, PathAnnotation>()

    // Selected leaf
    annotations.set(`0-${proof.leafIndex}`, {
      type: 'selected',
      order: 0,
      label: 'Start',
    })

    let idx = proof.leafIndex
    for (let lvl = 0; lvl < proof.siblings.length; lvl++) {
      const siblingIdx = idx % 2 === 0 ? idx + 1 : idx - 1
      const parentIdx = Math.floor(idx / 2)

      // Sibling is "provided" (part of the proof)
      annotations.set(`${lvl}-${siblingIdx}`, {
        type: 'provided',
        order: lvl + 1,
        label: 'Provided',
      })

      // Parent is "computed" (hash of current + sibling)
      const isRoot = lvl + 1 === levels.length - 1
      if (lvl + 1 < levels.length) {
        annotations.set(`${lvl + 1}-${parentIdx}`, {
          type: isRoot ? 'root' : 'computed',
          order: lvl + 1,
          label: isRoot ? 'Root' : `Step ${lvl + 1}`,
        })
      }

      idx = parentIdx
    }

    return annotations
  }, [proof, levels])

  const handleCopyProof = useCallback(async () => {
    if (!proof) return
    const text = JSON.stringify(proof, null, 2)
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [proof])

  const circledNumbers = ['\u2460', '\u2461', '\u2462', '\u2463', '\u2464', '\u2465']

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">Inclusion Proof Generator</h3>
        <p className="text-sm text-muted-foreground">
          Build a tree with 8 sample certificates, then click any leaf to generate its inclusion
          proof. The authentication path highlights in the tree with numbered verification steps.
        </p>
      </div>

      {/* Build tree */}
      {!levels ? (
        <button
          onClick={handleBuildTree}
          disabled={isBuilding}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm"
        >
          {isBuilding ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Building...
            </>
          ) : (
            <>
              <TreePine size={16} /> Build Tree with 8 Certificates
            </>
          )}
        </button>
      ) : (
        <>
          {/* Instruction */}
          <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
            <p className="text-xs text-foreground">
              <Search size={12} className="inline mr-1" />
              <strong>Click a leaf certificate</strong> below to generate its inclusion proof. The
              authentication path will highlight in the tree with numbered verification steps.
            </p>
          </div>

          {/* Legend */}
          {proof && (
            <div className="flex flex-wrap gap-3 text-[10px]">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-primary/30 border-2 border-primary inline-block" />
                Selected leaf
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-warning/20 border-2 border-dashed border-warning inline-block" />
                Provided sibling
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-success/20 border-2 border-success inline-block" />
                Computed parent
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-accent/20 border-2 border-double border-accent inline-block" />
                Verified root
              </span>
            </div>
          )}

          {/* Tree visualization with highlighting */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border overflow-x-auto">
            <div className="space-y-3 min-w-fit">
              {[...levels].reverse().map((level, reversedIdx) => {
                const levelIdx = levels.length - 1 - reversedIdx
                const isRoot = levelIdx === levels.length - 1
                const isLeaf = levelIdx === 0
                return (
                  <div key={levelIdx}>
                    <div className="text-[10px] text-muted-foreground mb-1">
                      {isRoot ? 'Root' : isLeaf ? 'Leaves (click to select)' : `Level ${levelIdx}`}
                    </div>
                    <div className="flex justify-center gap-1 flex-wrap">
                      {level.map((node) => {
                        const isOnPath = authPathHashes.has(node.hash)
                        const isSelected = isLeaf && selectedLeaf === node.index
                        const annotation = pathAnnotations.get(`${levelIdx}-${node.index}`)

                        // Determine border style based on annotation type
                        let borderClass = ''
                        if (annotation) {
                          switch (annotation.type) {
                            case 'selected':
                              borderClass =
                                'bg-primary/30 text-primary border-2 border-primary ring-2 ring-primary'
                              break
                            case 'provided':
                              borderClass =
                                'bg-warning/15 text-warning border-2 border-dashed border-warning shadow-md'
                              break
                            case 'computed':
                              borderClass =
                                'bg-success/20 text-success border-2 border-success shadow-md'
                              break
                            case 'root':
                              borderClass =
                                'bg-accent/20 text-accent border-[3px] border-double border-accent shadow-lg'
                              break
                          }
                        } else if (isSelected) {
                          borderClass =
                            'bg-primary/30 text-primary border-primary ring-2 ring-primary'
                        } else if (isOnPath) {
                          borderClass = 'bg-success/20 text-success border-success/50 shadow-md'
                        } else if (isRoot) {
                          borderClass = 'bg-accent/20 text-accent border-accent/50'
                        } else if (isLeaf) {
                          borderClass =
                            'bg-primary/10 text-primary border-primary/30 hover:bg-primary/20 cursor-pointer'
                        } else {
                          borderClass = 'bg-muted text-foreground border-border'
                        }

                        return (
                          <button
                            key={`${levelIdx}-${node.index}`}
                            onClick={() => isLeaf && handleSelectLeaf(node.index)}
                            className={`relative px-2 py-1.5 rounded text-[10px] font-mono border transition-all ${borderClass}`}
                            disabled={!isLeaf}
                          >
                            {/* Annotation badge */}
                            {annotation && (
                              <span
                                className={`absolute -top-2 -right-2 w-4 h-4 rounded-full text-[8px] font-bold flex items-center justify-center ${
                                  annotation.type === 'selected'
                                    ? 'bg-primary text-black'
                                    : annotation.type === 'provided'
                                      ? 'bg-warning text-black'
                                      : annotation.type === 'root'
                                        ? 'bg-accent text-black'
                                        : 'bg-success text-black'
                                }`}
                                title={annotation.label}
                              >
                                {annotation.order < circledNumbers.length
                                  ? circledNumbers[annotation.order]
                                  : annotation.order}
                              </span>
                            )}
                            <div className="text-[9px] text-muted-foreground mb-0.5">
                              {node.label}
                            </div>
                            <div>{truncateHash(node.hash, 6)}</div>
                            {isLeaf && node.index < certs.length && (
                              <div className="text-[8px] mt-0.5 text-muted-foreground">
                                {certs[node.index].subject}
                              </div>
                            )}
                            {/* Type label for annotated nodes */}
                            {annotation && annotation.type !== 'selected' && (
                              <div
                                className={`text-[8px] mt-0.5 font-bold ${
                                  annotation.type === 'provided'
                                    ? 'text-warning'
                                    : annotation.type === 'root'
                                      ? 'text-accent'
                                      : 'text-success'
                                }`}
                              >
                                {annotation.label}
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Proof details */}
          {proof && (
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-foreground">
                  Inclusion Proof for Cert {selectedLeaf! + 1} ({certs[selectedLeaf!]?.subject})
                </h4>
                <button
                  onClick={handleCopyProof}
                  className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? 'Copied' : 'Copy JSON'}
                </button>
              </div>

              {/* Leaf hash */}
              <div className="mb-3">
                <div className="text-[10px] text-muted-foreground mb-1">Leaf Hash</div>
                <div className="font-mono text-[10px] text-foreground bg-background rounded p-2 border border-border break-all">
                  {proof.leafHash}
                </div>
              </div>

              {/* Sibling hashes (auth path) */}
              <div className="mb-3">
                <div className="text-[10px] text-muted-foreground mb-1">
                  Authentication Path ({proof.siblings.length} siblings)
                </div>
                <div className="space-y-1">
                  {proof.siblings.map((s, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 bg-background rounded p-2 border border-warning/30"
                    >
                      <span className="text-[10px] font-bold text-warning w-4 shrink-0">
                        {circledNumbers[i + 1] ?? i + 1}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          s.position === 'left'
                            ? 'bg-primary/20 text-primary'
                            : 'bg-warning/20 text-warning'
                        }`}
                      >
                        {s.position === 'left' ? 'L' : 'R'}
                      </span>
                      <span className="font-mono text-[10px] text-foreground break-all">
                        {s.hash}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Root hash */}
              <div className="mb-3">
                <div className="text-[10px] text-muted-foreground mb-1">Expected Root</div>
                <div className="font-mono text-[10px] text-accent bg-background rounded p-2 border border-accent/30 break-all">
                  {proof.root}
                </div>
              </div>

              {/* Size comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-success/10 rounded-lg p-3 border border-success/20 text-center">
                  <div className="text-lg font-bold text-success">
                    {formatBytes(proof.proofSizeBytes)}
                  </div>
                  <div className="text-[10px] text-muted-foreground">Inclusion proof size</div>
                </div>
                <div className="bg-destructive/10 rounded-lg p-3 border border-destructive/20 text-center">
                  <div className="text-lg font-bold text-destructive">{formatBytes(2420 * 3)}</div>
                  <div className="text-[10px] text-muted-foreground">
                    3&times; ML-DSA-44 signatures
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
