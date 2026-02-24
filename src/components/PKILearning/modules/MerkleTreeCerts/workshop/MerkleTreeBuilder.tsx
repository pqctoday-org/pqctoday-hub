import React, { useState, useCallback } from 'react'
import { Plus, TreePine, Loader2, Trash2 } from 'lucide-react'
import { buildMerkleTree, type MerkleNode, type CertLeaf } from '../utils/merkleTree'
import { SAMPLE_CERTS, truncateHash } from '../data/mtcConstants'

export const MerkleTreeBuilder: React.FC = () => {
  const [certs, setCerts] = useState<CertLeaf[]>(SAMPLE_CERTS.slice(0, 4))
  const [levels, setLevels] = useState<MerkleNode[][] | null>(null)
  const [isBuilding, setIsBuilding] = useState(false)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)

  // Form state for adding a cert
  const [newSubject, setNewSubject] = useState('')
  const [newAlgo, setNewAlgo] = useState('ML-DSA-44')

  const algos = [
    { value: 'ML-DSA-44', keySize: 1312 },
    { value: 'ML-DSA-65', keySize: 1952 },
    { value: 'ML-DSA-87', keySize: 2592 },
  ]

  const handleAddCert = useCallback(() => {
    if (!newSubject.trim()) return
    const algoInfo = algos.find((a) => a.value === newAlgo) ?? algos[0]
    const cert: CertLeaf = {
      id: certs.length + 1,
      subject: newSubject.trim(),
      issuer: 'MTC Authority',
      algorithm: newAlgo,
      publicKeySize: algoInfo.keySize,
      notBefore: '2026-01-01',
      notAfter: '2026-03-01',
    }
    setCerts((prev) => [...prev, cert])
    setNewSubject('')
    setLevels(null)
  }, [newSubject, newAlgo, certs.length])

  const handleRemoveCert = useCallback((id: number) => {
    setCerts((prev) => prev.filter((c) => c.id !== id))
    setLevels(null)
  }, [])

  const handleLoadSample = useCallback(() => {
    setCerts([...SAMPLE_CERTS])
    setLevels(null)
  }, [])

  const handleBuildTree = useCallback(async () => {
    if (certs.length < 2) return
    setIsBuilding(true)
    try {
      const result = await buildMerkleTree(certs)
      setLevels(result.levels)
    } finally {
      setIsBuilding(false)
    }
  }, [certs])

  const treeHeight = levels ? levels.length - 1 : 0

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">Interactive Merkle Tree Builder</h3>
        <p className="text-sm text-muted-foreground">
          Add certificate leaves, then build the tree to see SHA-256 hashes computed at each level.
          Hover over any node to see its full hash.
        </p>
      </div>

      {/* Certificate list */}
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold text-foreground">Certificate Leaves ({certs.length})</h4>
          <button
            onClick={handleLoadSample}
            className="text-xs text-primary hover:text-primary/80 transition-colors"
          >
            Load 8 sample certs
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
          {certs.map((cert) => (
            <div
              key={cert.id}
              className="bg-background rounded-lg p-2 border border-border flex items-center justify-between group"
            >
              <div className="min-w-0">
                <div className="text-xs font-medium text-foreground truncate">{cert.subject}</div>
                <div className="text-[10px] text-muted-foreground">{cert.algorithm}</div>
              </div>
              <button
                onClick={() => handleRemoveCert(cert.id)}
                className="text-muted-foreground hover:text-destructive transition-colors shrink-0 ml-1 opacity-0 group-hover:opacity-100"
                aria-label={`Remove ${cert.subject}`}
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>

        {/* Add cert form */}
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[160px]">
            <label
              htmlFor="mtc-subject-cn"
              className="text-[10px] text-muted-foreground block mb-1"
            >
              Subject CN
            </label>
            <input
              id="mtc-subject-cn"
              type="text"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              placeholder="e.g. app.example.com"
              className="w-full px-2 py-1.5 text-xs bg-background border border-border rounded text-foreground placeholder:text-muted-foreground"
              onKeyDown={(e) => e.key === 'Enter' && handleAddCert()}
            />
          </div>
          <div className="min-w-[120px]">
            <label
              htmlFor="mtc-algo-select"
              className="text-[10px] text-muted-foreground block mb-1"
            >
              Algorithm
            </label>
            <select
              id="mtc-algo-select"
              value={newAlgo}
              onChange={(e) => setNewAlgo(e.target.value)}
              className="w-full px-2 py-1.5 text-xs bg-background border border-border rounded text-foreground"
            >
              {algos.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.value}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleAddCert}
            disabled={!newSubject.trim()}
            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-primary/10 text-primary border border-primary/30 rounded hover:bg-primary/20 transition-colors disabled:opacity-50"
          >
            <Plus size={12} /> Add
          </button>
        </div>
      </div>

      {/* Build button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleBuildTree}
          disabled={certs.length < 2 || isBuilding}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm"
        >
          {isBuilding ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Building...
            </>
          ) : (
            <>
              <TreePine size={16} /> Build Merkle Tree
            </>
          )}
        </button>
        {certs.length < 2 && (
          <span className="text-xs text-muted-foreground">Add at least 2 certificates</span>
        )}
      </div>

      {/* Tree visualization */}
      {levels && (
        <div className="bg-muted/50 rounded-lg p-4 border border-border overflow-x-auto">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-foreground">
              Merkle Tree (height {treeHeight}, {levels[0].length} leaves)
            </h4>
            <span className="text-[10px] text-muted-foreground">
              Hover for full hash &bull; SHA-256
            </span>
          </div>

          <div className="space-y-3 min-w-fit">
            {/* Render from root (top) to leaves (bottom) */}
            {[...levels].reverse().map((level, reversedIdx) => {
              const levelIdx = levels.length - 1 - reversedIdx
              const isRoot = levelIdx === levels.length - 1
              const isLeaf = levelIdx === 0
              return (
                <div key={levelIdx}>
                  <div className="text-[10px] text-muted-foreground mb-1">
                    {isRoot ? 'Root' : isLeaf ? 'Leaves' : `Level ${levelIdx}`}
                  </div>
                  <div className="flex justify-center gap-1 flex-wrap">
                    {level.map((node) => {
                      const isHovered = hoveredNode === node.hash
                      return (
                        <div
                          key={`${levelIdx}-${node.index}`}
                          className={`relative px-2 py-1.5 rounded text-[10px] font-mono border transition-all cursor-default ${
                            isRoot
                              ? 'bg-accent/20 text-accent border-accent/50 font-bold'
                              : isLeaf
                                ? 'bg-primary/10 text-primary border-primary/30'
                                : 'bg-muted text-foreground border-border'
                          } ${isHovered ? 'ring-2 ring-primary shadow-lg' : ''}`}
                          onMouseEnter={() => setHoveredNode(node.hash)}
                          onMouseLeave={() => setHoveredNode(null)}
                        >
                          <div className="text-[9px] text-muted-foreground mb-0.5">
                            {node.label}
                          </div>
                          <div>{truncateHash(node.hash, 6)}</div>
                          {/* Tooltip showing full hash */}
                          {isHovered && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-background border border-border rounded shadow-lg text-[9px] text-foreground whitespace-nowrap z-10">
                              {node.hash}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Root hash callout */}
          <div className="mt-4 bg-accent/10 rounded-lg p-3 border border-accent/30">
            <div className="text-xs font-bold text-foreground mb-1">Signed Root Hash</div>
            <div className="text-[10px] font-mono text-accent break-all">
              {levels[levels.length - 1][0].hash}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              In the MTC model, only this root hash is signed by the CA &mdash; one PQ signature
              covers all {certs.length} certificates in the batch.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
