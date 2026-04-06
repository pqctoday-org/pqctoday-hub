// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useCallback, useMemo, useRef } from 'react'
import { Plus, TreePine, Loader2, Trash2, Info } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { buildMerkleTree, type MerkleNode, type CertLeaf } from '../utils/merkleTree'
import { SAMPLE_CERTS, truncateHash, formatBytes } from '../data/mtcConstants'
import { KatValidationPanel } from '@/components/shared/KatValidationPanel'
import type { KatTestSpec } from '@/utils/katRunner'

const MERKLE_KAT_SPECS: KatTestSpec[] = [
  {
    id: 'merkle-leaf-hash',
    useCase: 'Merkle leaf node hash (SHA-256)',
    standard: 'FIPS 180-4 ACVP',
    referenceUrl: 'https://csrc.nist.gov/pubs/fips/180-4/upd1/final',
    kind: { type: 'sha256-hash', testIndex: 0 },
  },
  {
    id: 'merkle-internal-hash',
    useCase: 'Merkle internal node hash (SHA-256)',
    standard: 'FIPS 180-4 ACVP',
    referenceUrl: 'https://csrc.nist.gov/pubs/fips/180-4/upd1/final',
    kind: { type: 'sha256-hash', testIndex: 1 },
  },
  {
    id: 'merkle-root-hash',
    useCase: 'Merkle root computation (SHA-256)',
    standard: 'FIPS 180-4 ACVP',
    referenceUrl: 'https://csrc.nist.gov/pubs/fips/180-4/upd1/final',
    kind: { type: 'sha256-hash', testIndex: 2 },
  },
  {
    id: 'merkle-tree-sign',
    useCase: 'Tree root certificate signing (SLH-DSA)',
    standard: 'FIPS 205',
    referenceUrl: 'https://csrc.nist.gov/pubs/fips/205/final',
    kind: { type: 'slhdsa-functional', variant: 'SHA2-128s' },
    message: 'Merkle tree root certificate hash for RFC PLANTS batch signing',
  },
]

const SPEED_OPTIONS = [
  { label: 'Slow', ms: 800 },
  { label: 'Normal', ms: 400 },
  { label: 'Fast', ms: 150 },
  { label: 'Instant', ms: 0 },
]

export const MerkleTreeBuilder: React.FC = () => {
  const [certs, setCerts] = useState<CertLeaf[]>(SAMPLE_CERTS.slice(0, 4))
  const [levels, setLevels] = useState<MerkleNode[][] | null>(null)
  const [isBuilding, setIsBuilding] = useState(false)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)

  // Animation state
  const [animationLevel, setAnimationLevel] = useState<number | null>(null)
  const [speedIdx, setSpeedIdx] = useState(1) // default: Normal
  const abortRef = useRef(false)

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
    setAnimationLevel(null)
  }, [newSubject, newAlgo, certs.length])

  const handleRemoveCert = useCallback((id: number) => {
    setCerts((prev) => prev.filter((c) => c.id !== id))
    setLevels(null)
    setAnimationLevel(null)
  }, [])

  const handleLoadSample = useCallback(() => {
    setCerts([...SAMPLE_CERTS])
    setLevels(null)
    setAnimationLevel(null)
  }, [])

  const handleBuildTree = useCallback(async () => {
    if (certs.length < 2) return
    abortRef.current = true // cancel any running animation
    setIsBuilding(true)
    setAnimationLevel(null)
    try {
      const result = await buildMerkleTree(certs)
      setLevels(result.levels)

      const speed = SPEED_OPTIONS[speedIdx].ms
      if (speed > 0) {
        // Animated: reveal levels bottom-up
        abortRef.current = false
        for (let lvl = 0; lvl < result.levels.length; lvl++) {
          if (abortRef.current) break
          setAnimationLevel(lvl)
          await new Promise((resolve) => setTimeout(resolve, speed))
        }
        if (!abortRef.current) {
          setAnimationLevel(null) // show all
        }
      }
    } finally {
      setIsBuilding(false)
    }
  }, [certs, speedIdx])

  const treeHeight = levels ? levels.length - 1 : 0
  const isAnimating = animationLevel !== null

  // Live stats (#3) — computed from existing levels state
  const stats = useMemo(() => {
    if (!levels) return null
    const depth = levels.length - 1
    const proofBytes = depth * 32
    const chainSigBytes = 2420 * 3 // 3× ML-DSA-44 signatures
    const reductionPercent = Math.round(((chainSigBytes - proofBytes) / chainSigBytes) * 100)
    return { depth, leafCount: levels[0].length, proofBytes, chainSigBytes, reductionPercent }
  }, [levels])

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
          <Button onClick={handleLoadSample} variant="link" className="text-xs h-auto p-0">
            Load 8 sample certs
          </Button>
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
              <Button
                onClick={() => handleRemoveCert(cert.id)}
                variant="ghost"
                className="h-auto p-0 text-muted-foreground hover:text-destructive shrink-0 ml-1 opacity-0 group-hover:opacity-100"
                aria-label={`Remove ${cert.subject}`}
              >
                <Trash2 size={12} />
              </Button>
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
            <Input
              id="mtc-subject-cn"
              type="text"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              placeholder="e.g. app.example.com"
              className="w-full px-2 py-1.5 text-xs h-auto"
              onKeyDown={(e) => e.key === 'Enter' && handleAddCert()}
            />
          </div>
          <div className="min-w-[120px]">
            <FilterDropdown
              label="Algorithm"
              items={algos.map((a) => ({ id: a.value, label: a.value }))}
              selectedId={newAlgo}
              onSelect={setNewAlgo}
              noContainer
              className="w-full"
            />
          </div>
          <Button
            onClick={handleAddCert}
            disabled={!newSubject.trim()}
            variant="outline"
            className="flex items-center gap-1 px-3 py-1.5 h-auto text-xs bg-primary/10 text-primary border-primary/30 hover:bg-primary/20"
          >
            <Plus size={12} /> Add
          </Button>
        </div>
      </div>

      {/* Build controls */}
      <div className="flex flex-wrap items-center gap-4">
        <Button
          onClick={handleBuildTree}
          disabled={certs.length < 2 || isBuilding}
          className="flex items-center gap-2 bg-primary text-black font-bold hover:bg-primary/90 text-sm"
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
        </Button>
        {certs.length < 2 && (
          <span className="text-xs text-muted-foreground">Add at least 2 certificates</span>
        )}

        {/* Animation speed selector */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">Build speed:</span>
          <div className="flex gap-1">
            {SPEED_OPTIONS.map((opt, idx) => (
              <Button
                key={opt.label}
                onClick={() => setSpeedIdx(idx)}
                variant="ghost"
                className={`px-2 py-1 h-auto rounded text-[10px] font-medium transition-colors ${
                  speedIdx === idx
                    ? 'bg-primary/20 text-primary border border-primary/50'
                    : 'bg-muted/50 text-muted-foreground border border-border hover:border-primary/30'
                }`}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>
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
              // During animation, only show levels up to animationLevel
              const isVisible = !isAnimating || levelIdx <= animationLevel!
              return (
                <div
                  key={levelIdx}
                  className={`transition-all duration-300 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                >
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

          {/* E1 — Domain separation explanation */}
          <div className="mt-3 bg-primary/5 rounded-lg p-3 border border-primary/20 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <Info size={12} className="text-primary shrink-0" />
              Why two different hash prefixes?
            </div>
            <p className="text-[10px] text-muted-foreground">
              <strong className="text-foreground">Leaf nodes</strong> are hashed as{' '}
              <span className="font-mono">SHA-256(0x00 ‖ data)</span> and{' '}
              <strong className="text-foreground">internal nodes</strong> as{' '}
              <span className="font-mono">SHA-256(0x01 ‖ left ‖ right)</span>.
            </p>
            <p className="text-[10px] text-muted-foreground">
              Without these <strong className="text-foreground">domain-separation</strong> prefixes,
              an attacker could present an internal node hash as if it were a valid leaf hash (a
              &ldquo;second-preimage&rdquo; attack). The 0x00/0x01 byte makes the two hash spaces
              disjoint, ensuring no internal node can ever equal a leaf hash — a requirement from{' '}
              <span className="font-mono">RFC 9162 §2.1</span>.
            </p>
          </div>
        </div>
      )}

      {/* Live proof size stats (#3) */}
      {stats && !isAnimating && (
        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <div className="flex items-start gap-2 mb-3">
            <Info size={14} className="text-primary mt-0.5 shrink-0" />
            <h4 className="text-sm font-bold text-foreground">Tree Statistics</h4>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            <div className="bg-background rounded-lg p-3 border border-border text-center">
              <div className="text-lg font-bold text-foreground">{stats.depth}</div>
              <div className="text-[10px] text-muted-foreground">Tree Height</div>
            </div>
            <div className="bg-background rounded-lg p-3 border border-border text-center">
              <div className="text-lg font-bold text-foreground">{stats.leafCount}</div>
              <div className="text-[10px] text-muted-foreground">Leaves</div>
            </div>
            <div className="bg-background rounded-lg p-3 border border-success/30 text-center">
              <div className="text-lg font-bold text-success">{formatBytes(stats.proofBytes)}</div>
              <div className="text-[10px] text-muted-foreground">Inclusion Proof</div>
            </div>
            <div className="bg-background rounded-lg p-3 border border-destructive/30 text-center">
              <div className="text-lg font-bold text-destructive">
                {formatBytes(stats.chainSigBytes)}
              </div>
              <div className="text-[10px] text-muted-foreground">3&times; ML-DSA-44 Sigs</div>
            </div>
          </div>

          {/* Comparison bar */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground w-20 shrink-0">MTC Proof</span>
              <div className="flex-1 bg-muted rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-full bg-success/60 rounded-full transition-all duration-500"
                  style={{ width: `${(stats.proofBytes / stats.chainSigBytes) * 100}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-muted-foreground w-12 text-right shrink-0">
                {formatBytes(stats.proofBytes)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground w-20 shrink-0">X.509 Sigs</span>
              <div className="flex-1 bg-muted rounded-full h-2.5 overflow-hidden">
                <div className="h-full bg-destructive/60 rounded-full" style={{ width: '100%' }} />
              </div>
              <span className="text-[10px] font-mono text-muted-foreground w-12 text-right shrink-0">
                {formatBytes(stats.chainSigBytes)}
              </span>
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground mt-2">
            This inclusion proof replaces 3 PQ signatures in the TLS handshake &mdash;{' '}
            <strong className="text-success">{stats.reductionPercent}% smaller</strong> than a
            traditional certificate chain.
          </p>
        </div>
      )}

      <KatValidationPanel
        specs={MERKLE_KAT_SPECS}
        label="Merkle Tree Certificates Known Answer Tests"
        authorityNote="FIPS 180-4 · FIPS 205"
      />
    </div>
  )
}
