import React, { useState, useCallback, useMemo } from 'react'
import { Search, TreePine, Loader2, Copy, Check } from 'lucide-react'
import {
  buildMerkleTree,
  getInclusionProof,
  type MerkleNode,
  type InclusionProof,
} from '../utils/merkleTree'
import { SAMPLE_CERTS, truncateHash, formatBytes } from '../data/mtcConstants'

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

  const handleCopyProof = useCallback(async () => {
    if (!proof) return
    const text = JSON.stringify(proof, null, 2)
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [proof])

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">Inclusion Proof Generator</h3>
        <p className="text-sm text-muted-foreground">
          Build a tree with 8 sample certificates, then click any leaf to generate its inclusion
          proof. The authentication path (sibling hashes needed for verification) highlights in the
          tree.
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
              authentication path will highlight in the tree.
            </p>
          </div>

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
                        return (
                          <button
                            key={`${levelIdx}-${node.index}`}
                            onClick={() => isLeaf && handleSelectLeaf(node.index)}
                            className={`px-2 py-1.5 rounded text-[10px] font-mono border transition-all ${
                              isSelected
                                ? 'bg-primary/30 text-primary border-primary ring-2 ring-primary'
                                : isOnPath
                                  ? 'bg-success/20 text-success border-success/50 shadow-md'
                                  : isRoot
                                    ? 'bg-accent/20 text-accent border-accent/50'
                                    : isLeaf
                                      ? 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/20 cursor-pointer'
                                      : 'bg-muted text-foreground border-border'
                            }`}
                            disabled={!isLeaf}
                          >
                            <div className="text-[9px] text-muted-foreground mb-0.5">
                              {node.label}
                            </div>
                            <div>{truncateHash(node.hash, 6)}</div>
                            {isLeaf && node.index < certs.length && (
                              <div className="text-[8px] mt-0.5 text-muted-foreground">
                                {certs[node.index].subject}
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
                      className="flex items-center gap-2 bg-background rounded p-2 border border-border"
                    >
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
              <div className="grid grid-cols-2 gap-3">
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
