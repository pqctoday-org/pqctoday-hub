// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence, MotionConfig } from 'framer-motion'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Grid3X3,
  Hash,
  Binary,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  searchDisplayedGrid,
  compareToyCodewords,
  encodeToyRepetition,
  type GridSearchResult,
} from './foundationalToySearch'

/* ------------------------------------------------------------------ */
/*  Shared helpers                                                     */
/* ------------------------------------------------------------------ */

interface FamilySectionProps {
  title: string
  subtitle: string
  borderColor: string
  icon: React.ElementType
  isExpanded: boolean
  onToggle: () => void
  isCompleted: boolean
  children: React.ReactNode
}

const FamilySection: React.FC<FamilySectionProps> = ({
  title,
  subtitle,
  borderColor,
  icon: Icon,
  isExpanded,
  onToggle,
  isCompleted,
  children,
}) => {
  const reduced = usePrefersReducedMotion()
  return (
    <div className={`glass-panel border-l-4 ${borderColor} overflow-hidden`}>
      <Button
        variant="ghost"
        onClick={onToggle}
        className="w-full h-auto flex items-center justify-between gap-3 p-5 text-left whitespace-normal hover:bg-muted/30 transition-colors"
        aria-expanded={isExpanded}
        aria-controls={`family-${title.replace(/\s+/g, '-').toLowerCase()}`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="w-10 h-10 shrink-0 rounded-full border-2 border-border flex items-center justify-center bg-background">
            <Icon size={18} className="text-foreground" />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              {title}
              {isCompleted && (
                <motion.span initial={{ scale: reduced ? 1 : 0 }} animate={{ scale: 1 }}>
                  <CheckCircle2 size={18} className="text-success" />
                </motion.span>
              )}
            </h3>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp size={20} className="text-muted-foreground" />
        ) : (
          <ChevronDown size={20} className="text-muted-foreground" />
        )}
      </Button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            id={`family-${title.replace(/\s+/g, '-').toLowerCase()}`}
            initial={{ height: reduced ? 'auto' : 0, opacity: reduced ? 1 : 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: reduced ? 'auto' : 0, opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface QuantumContrastCalloutProps {
  classicalProblem: string
  classicalResult: string
  pqcProblem: string
  pqcResult: string
}

const QuantumContrastCallout: React.FC<QuantumContrastCalloutProps> = ({
  classicalProblem,
  classicalResult,
  pqcProblem,
  pqcResult,
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
    <div className="glass-panel p-4 border-l-4 border-l-destructive">
      <div className="flex items-center gap-2 mb-2">
        <ShieldAlert size={16} className="text-destructive" />
        <span className="text-sm font-semibold text-destructive">
          Classical (Broken by Quantum)
        </span>
      </div>
      <p className="text-sm text-foreground font-medium">{classicalProblem}</p>
      <p className="text-xs text-muted-foreground mt-1">{classicalResult}</p>
    </div>
    <div className="glass-panel p-4 border-l-4 border-l-success">
      <div className="flex items-center gap-2 mb-2">
        <ShieldCheck size={16} className="text-success" />
        <span className="text-sm font-semibold text-success">PQC (Quantum-Resistant)</span>
      </div>
      <p className="text-sm text-foreground font-medium">{pqcProblem}</p>
      <p className="text-xs text-muted-foreground mt-1">{pqcResult}</p>
    </div>
  </div>
)

interface ComplexityBarProps {
  label: string
  exponent: number
  maxExponent: number
  status: 'broken' | 'safe' | 'weakened'
}

const ComplexityBar: React.FC<ComplexityBarProps> = ({ label, exponent, maxExponent, status }) => {
  const reduced = usePrefersReducedMotion()
  const pct = Math.min((exponent / maxExponent) * 100, 100)
  const barColor =
    status === 'broken' ? 'bg-destructive' : status === 'weakened' ? 'bg-warning' : 'bg-success'
  const textColor =
    status === 'broken'
      ? 'text-destructive'
      : status === 'weakened'
        ? 'text-warning'
        : 'text-success'

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={`font-mono font-semibold ${textColor}`}>
          {exponent === 0 ? 'Polynomial' : `2^${exponent}`}
        </span>
      </div>
      <div className="h-6 rounded-full bg-muted overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${barColor}`}
          initial={{ width: reduced ? `${pct}%` : 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: reduced ? 0 : 0.5 }}
        />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Lattice Visualization                                              */
/* ------------------------------------------------------------------ */

const DIMENSION_OPTIONS = [
  { label: '2D', value: 2 },
  { label: '10D', value: 10 },
  { label: '100D', value: 100 },
  { label: '256D', value: 256 },
]

const LatticeVisualization: React.FC<{ onInteract: () => void }> = ({ onInteract }) => {
  const [dimensions, setDimensions] = useState(2)
  const [noiseLevel, setNoiseLevel] = useState(0.3)
  const [noiseSeed, setNoiseSeed] = useState(0)
  const [searchResult, setSearchResult] = useState<GridSearchResult | null>(null)

  // Pseudo-random based on seed for reproducible noise
  const seededRandom = useCallback(
    (i: number) => {
      const x = Math.sin(noiseSeed * 9301 + i * 4973) * 49297
      return x - Math.floor(x)
    },
    [noiseSeed]
  )

  const gridSize = 8
  const cellSize = 100 / gridSize

  // Pick a random lattice point near center and add noise
  const targetPoint = useMemo(() => {
    const baseCellX = 3 + Math.floor(seededRandom(100) * 3)
    const baseCellY = 3 + Math.floor(seededRandom(200) * 3)
    const offsetX = (seededRandom(300) - 0.5) * 2 * noiseLevel * cellSize
    const offsetY = (seededRandom(400) - 0.5) * 2 * noiseLevel * cellSize
    return {
      x: baseCellX * cellSize + cellSize / 2 + offsetX,
      y: baseCellY * cellSize + cellSize / 2 + offsetY,
    }
  }, [noiseLevel, cellSize, seededRandom])

  const handleDimensionChange = (dim: number) => {
    setDimensions(dim)
    setSearchResult(null)
    onInteract()
  }

  const handleAddNoise = () => {
    setNoiseSeed((s) => s + 1)
    setSearchResult(null)
    onInteract()
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Imagine a grid of evenly-spaced dots &mdash; a <strong>lattice</strong>. Someone drops a
          point near the grid with random noise. Your task: find the{' '}
          <strong>closest displayed point</strong>. This toy searches only the 64 points in the 8×8
          grid. Selecting more dimensions embeds the same points and target with zero extra
          coordinates; it does not create a full higher-dimensional lattice or a PQC attack. Compare
          the executed candidate and coordinate counts, then change the noise or target.
        </p>

        {/* First-two-coordinate projection of the same finite point set. */}
        <div className="relative bg-muted/30 rounded-lg overflow-hidden aspect-square max-w-xs mx-auto border border-border">
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full"
            aria-label="Projection of the 64 candidate points"
          >
            {/* Lattice points */}
            {Array.from({ length: gridSize }, (_, row) =>
              Array.from({ length: gridSize }, (_, col) => (
                <circle
                  key={`${row}-${col}`}
                  cx={col * cellSize + cellSize / 2}
                  cy={row * cellSize + cellSize / 2}
                  r={1.2}
                  className={
                    searchResult?.nearestIndices.includes(row * gridSize + col)
                      ? 'fill-success'
                      : 'fill-muted-foreground/40'
                  }
                />
              ))
            )}
            {/* Target (noisy) point */}
            {/* Pulsed with CSS rather than a framer `r` tween: under
                  prefers-reduced-motion the tween emitted r="undefined" on the
                  first frame (console error on every load; round-9 walk). */}
            <circle
              cx={targetPoint.x}
              cy={targetPoint.y}
              r={2.5}
              className="fill-destructive motion-safe:animate-pulse"
            />
            {/* Label */}
            <text
              x={targetPoint.x + 4}
              y={targetPoint.y - 3}
              className="fill-destructive text-[3px]"
            >
              target
            </text>
          </svg>{' '}
          <p className="absolute bottom-1 left-2 right-2 text-[10px] text-muted-foreground">
            First two coordinates shown; {Math.max(0, dimensions - 2)} extra coordinates are zero.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 space-y-2">
            <span className="text-xs font-medium text-muted-foreground">Dimensions</span>
            <div className="flex gap-2 flex-wrap" role="group" aria-label="Dimension selector">
              {DIMENSION_OPTIONS.map((opt) => (
                <Button
                  variant="ghost"
                  key={opt.value}
                  onClick={() => handleDimensionChange(opt.value)}
                  className={`px-3 py-1.5 min-h-[36px] rounded text-sm font-medium transition-colors border ${
                    dimensions === opt.value
                      ? 'bg-primary text-primary-foreground hover:text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex-1 space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Noise level: {Math.round(noiseLevel * 100)}%
            </label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={noiseLevel}
              onChange={(e) => {
                setNoiseLevel(Number(e.target.value))
                setSearchResult(null)
                onInteract()
              }}
              className="w-full accent-primary"
              aria-label="Noise level"
              aria-valuemin={0}
              aria-valuemax={1}
              aria-valuenow={noiseLevel}
            />
          </div>
        </div>

        <Button
          variant="ghost"
          onClick={handleAddNoise}
          className="flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-lg border border-border hover:bg-muted transition-colors text-sm text-foreground"
        >
          <RefreshCw size={14} />
          Randomize Target
        </Button>

        <div className="glass-panel p-4 space-y-3">
          <h4 className="text-sm font-semibold text-foreground">Executed finite-grid search</h4>
          <p className="text-xs text-muted-foreground">
            Target first two coordinates:{' '}
            <span aria-label="Toy target coordinates" className="font-mono">
              <span className="whitespace-nowrap">{targetPoint.x}</span>,{' '}
              <span className="whitespace-nowrap">{targetPoint.y}</span>
            </span>
            . Every remaining coordinate is zero for both candidates and target.
          </p>
          <Button
            onClick={() => {
              setSearchResult(searchDisplayedGrid(dimensions, targetPoint))
              onInteract()
            }}
          >
            Search the 64 displayed points
          </Button>
          {searchResult ? (
            <div role="status" className="space-y-1 text-sm">
              <p>
                Candidates visited: <strong>{searchResult.visitedCandidates}</strong>
              </p>
              <p>
                Coordinate checks: <strong>{searchResult.coordinateChecks}</strong> ({dimensions}{' '}
                per candidate)
              </p>
              <p>
                Minimum squared distance (display units²):{' '}
                <strong>{searchResult.squaredDistance}</strong>
              </p>
              <p>
                Nearest displayed grid indices (row-major, 0–63):{' '}
                <strong>{searchResult.nearestIndices.join(', ')}</strong>
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Run the search for the current inputs.</p>
          )}
          <p className="text-xs text-muted-foreground">
            Dimension alone does not establish a cryptographic work factor. Here candidate count
            stays 64 and the explicit loop does 64 × dimension coordinate checks. This finite,
            zero-embedded grid gives no ML-KEM security estimate or real attack measurement.
          </p>
        </div>

        <QuantumContrastCallout
          classicalProblem="RSA: Factor N = p × q"
          classicalResult="Shor's Algorithm finds factors in polynomial time — BROKEN"
          pqcProblem="Lattice: Find closest vector in noisy high-dimensional space"
          pqcResult="No efficient quantum algorithm is known (generic quantum search still applies, so parameters allow for it) — RESISTANT"
        />
      </div>
    </MotionConfig>
  )
}

/* ------------------------------------------------------------------ */
/*  Hash-Based Visualization                                           */
/* ------------------------------------------------------------------ */

const HashBasedVisualization: React.FC<{ onInteract: () => void }> = ({ onInteract }) => {
  const [hashInput, setHashInput] = useState('Hello, PQC!')
  const [hashOutput, setHashOutput] = useState('')
  const [isHashing, setIsHashing] = useState(false)
  const [selectedLeaf, setSelectedLeaf] = useState<number | null>(null)

  // Compute SHA-256 via Web Crypto
  useEffect(() => {
    let cancelled = false
    const compute = async () => {
      setIsHashing(true)
      try {
        const data = new TextEncoder().encode(hashInput)
        const buffer = await crypto.subtle.digest('SHA-256', data)
        if (cancelled) return
        const hex = Array.from(new Uint8Array(buffer))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')
        setHashOutput(hex)
      } catch {
        if (!cancelled) setHashOutput('(hash unavailable)')
      }
      if (!cancelled) setIsHashing(false)
    }
    compute()
    return () => {
      cancelled = true
    }
  }, [hashInput])

  // Merkle tree: 8 leaves, 4 internal, 2 intermediate, 1 root
  const merkleLeaves = ['Sig 1', 'Sig 2', 'Sig 3', 'Sig 4', 'Sig 5', 'Sig 6', 'Sig 7', 'Sig 8']

  // Compute auth path for selected leaf
  const authPath = useMemo(() => {
    if (selectedLeaf === null) return new Set<string>()
    const path = new Set<string>()
    path.add(`leaf-${selectedLeaf}`)
    // Level 1: pairs (0,1), (2,3), (4,5), (6,7)
    const pair1 = Math.floor(selectedLeaf / 2)
    path.add(`node-1-${pair1}`)
    // Sibling leaf
    const siblingLeaf = selectedLeaf % 2 === 0 ? selectedLeaf + 1 : selectedLeaf - 1
    path.add(`sibling-${siblingLeaf}`)
    // Level 2: pairs (0,1), (2,3)
    const pair2 = Math.floor(pair1 / 2)
    path.add(`node-2-${pair2}`)
    // Sibling at level 1
    const siblingNode1 = pair1 % 2 === 0 ? pair1 + 1 : pair1 - 1
    path.add(`sibling-node-1-${siblingNode1}`)
    // Root
    path.add('root')
    // Sibling at level 2
    const siblingNode2 = pair2 % 2 === 0 ? pair2 + 1 : pair2 - 1
    path.add(`sibling-node-2-${siblingNode2}`)
    return path
  }, [selectedLeaf])

  const isOnPath = (id: string) => authPath.has(id)
  const isSibling = (id: string) => id.startsWith('sibling')

  const getNodeClass = (id: string) => {
    if (isOnPath(id)) {
      if (isSibling(id)) return 'border-warning bg-warning/20'
      return 'border-primary bg-primary/20'
    }
    return 'border-border bg-background'
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          A hash function is a <strong>one-way blender</strong>: any input produces a fixed-size
          output, but you cannot reverse-engineer the input from the output. Grover&apos;s Algorithm
          only provides a <strong>quadratic</strong> speedup (halving the exponent) &mdash; not the{' '}
          <strong>exponential</strong> collapse that Shor&apos;s gives against RSA.
        </p>

        {/* Live hasher */}
        <div className="glass-panel p-4 space-y-3">
          <h4 className="text-sm font-semibold text-foreground">Avalanche Effect Demo</h4>
          <p className="text-xs text-muted-foreground">
            Change even one character and the entire hash transforms:
          </p>
          <Input
            type="text"
            value={hashInput}
            onChange={(e) => {
              setHashInput(e.target.value)
              onInteract()
            }}
            className="w-full text-sm font-mono"
            placeholder="Type anything..."
          />
          <motion.div
            key={hashOutput}
            animate={isHashing ? { rotate: [0, -2, 2, -2, 0] } : {}}
            transition={{ duration: 0.3 }}
            className="p-3 rounded bg-muted/50 border border-border"
          >
            <span className="text-xs text-muted-foreground block mb-1">SHA-256 output:</span>
            <p className="font-mono text-xs text-foreground break-all leading-relaxed">
              {hashOutput}
            </p>
          </motion.div>
        </div>

        {/* Classical vs Quantum comparison */}
        <div className="glass-panel p-4 space-y-3">
          <h4 className="text-sm font-semibold text-foreground">
            Quantum Speedup: Quadratic vs Exponential
          </h4>
          <ComplexityBar
            label="Classical brute force on SHA-256"
            exponent={256}
            maxExponent={256}
            status="safe"
          />
          <ComplexityBar
            label="Quantum (Grover's) on SHA-256"
            exponent={128}
            maxExponent={256}
            status="safe"
          />
          <ComplexityBar
            label="Quantum (Shor's) on RSA-2048"
            exponent={0}
            maxExponent={256}
            status="broken"
          />
          <p className="text-xs text-muted-foreground">
            Grover&apos;s halves the exponent: 2<sup>256</sup> → 2<sup>128</sup>. Still
            astronomically hard. Shor&apos;s <em>collapses</em> RSA to polynomial time &mdash;
            that&apos;s the difference.
          </p>
        </div>

        {/* Merkle tree */}
        <div className="glass-panel p-4 space-y-3">
          <h4 className="text-sm font-semibold text-foreground">Merkle Tree Signatures</h4>
          <p className="text-xs text-muted-foreground">
            SLH-DSA uses a tree of hashes: one root can verify many signatures. Click a leaf to see
            its authentication path.
          </p>

          <div className="flex flex-col items-center gap-3 py-2 overflow-x-auto">
            {/* Root */}
            <div
              className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-colors ${getNodeClass(selectedLeaf !== null ? 'root' : '')}`}
            >
              Root
            </div>

            {/* Level 2: 2 nodes */}
            <div className="flex gap-8 sm:gap-16">
              {[0, 1].map((i) => (
                <div
                  key={`l2-${i}`}
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-medium transition-colors ${getNodeClass(isOnPath(`node-2-${i}`) ? `node-2-${i}` : isOnPath(`sibling-node-2-${i}`) ? `sibling-node-2-${i}` : '')}`}
                >
                  H
                </div>
              ))}
            </div>

            {/* Level 1: 4 nodes */}
            <div className="flex gap-4 sm:gap-8">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={`l1-${i}`}
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-medium transition-colors ${getNodeClass(isOnPath(`node-1-${i}`) ? `node-1-${i}` : isOnPath(`sibling-node-1-${i}`) ? `sibling-node-1-${i}` : '')}`}
                >
                  H
                </div>
              ))}
            </div>

            {/* Leaves */}
            <div className="flex gap-1.5 sm:gap-3">
              {merkleLeaves.map((label, i) => (
                <Button
                  variant="ghost"
                  key={i}
                  onClick={() => {
                    setSelectedLeaf(selectedLeaf === i ? null : i)
                    onInteract()
                  }}
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 flex items-center justify-center text-[9px] sm:text-[10px] font-medium transition-colors cursor-pointer hover:bg-muted/50 ${getNodeClass(isOnPath(`leaf-${i}`) ? `leaf-${i}` : isOnPath(`sibling-${i}`) ? `sibling-${i}` : '')}`}
                  aria-label={`Signature leaf ${i + 1}`}
                  aria-pressed={selectedLeaf === i}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {selectedLeaf !== null && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-muted-foreground"
            >
              <span className="inline-block w-3 h-3 rounded-full border-2 border-primary bg-primary/20 mr-1 align-middle" />{' '}
              = verification path &nbsp;
              <span className="inline-block w-3 h-3 rounded-full border-2 border-warning bg-warning/20 mr-1 align-middle" />{' '}
              = sibling hashes (provided as proof)
            </motion.div>
          )}
        </div>

        <QuantumContrastCallout
          classicalProblem="RSA: Exploit algebraic structure of modular exponentiation"
          classicalResult="Shor's provides exponential speedup — BROKEN"
          pqcProblem="Hash: Reverse a one-way function (find preimage)"
          pqcResult="Grover's provides only a quadratic speedup on preimage search — a longer hash output restores the margin"
        />
      </div>
    </MotionConfig>
  )
}

/* ------------------------------------------------------------------ */
/*  Code-Based Visualization                                           */
/* ------------------------------------------------------------------ */

function binomial(n: number, k: number): number {
  if (k > n) return 0
  if (k === 0 || k === n) return 1
  let result = 1
  for (let i = 0; i < Math.min(k, n - k); i++) {
    result = (result * (n - i)) / (i + 1)
  }
  return Math.round(result)
}

// Simple repetition code: each data bit becomes 3 bits (majority vote)
function encodeMessage(data: (0 | 1)[]): { encoded: (0 | 1)[]; parityIndices: Set<number> } {
  const encoded = encodeToyRepetition(data)
  const parityIndices = new Set(encoded.flatMap((_, index) => (index % 3 === 0 ? [] : [index])))
  return { encoded, parityIndices }
}

const CodeBasedVisualization: React.FC<{ onInteract: () => void }> = ({ onInteract }) => {
  const [originalMessage] = useState<(0 | 1)[]>([1, 0, 1, 1, 0, 0, 1, 0])
  const [isEncoded, setIsEncoded] = useState(false)
  const [encodedBits, setEncodedBits] = useState<(0 | 1)[]>([])
  const [parityIndices, setParityIndices] = useState<Set<number>>(new Set())
  const [errorCount, setErrorCount] = useState(0)
  const [errorSeed, setErrorSeed] = useState(0)

  // Encode
  const handleEncode = () => {
    const result = encodeMessage(originalMessage)
    setEncodedBits(result.encoded)
    setParityIndices(result.parityIndices)
    setIsEncoded(true)
    setErrorCount(0)
    onInteract()
  }

  // Compute error positions deterministically from seed + count
  const errorPositionsMemo = useMemo(() => {
    if (!isEncoded || errorCount === 0) return new Set<number>()
    const positions = new Set<number>()
    let attempt = 0
    while (positions.size < Math.min(errorCount, encodedBits.length) && attempt < 200) {
      const x = Math.sin((errorSeed + 1) * 9301 + attempt * 4973) * 49297
      const idx = Math.floor((x - Math.floor(x)) * encodedBits.length)
      positions.add(idx)
      attempt++
    }
    return positions
  }, [errorCount, errorSeed, isEncoded, encodedBits.length])

  const displayBits = useMemo(() => {
    if (!isEncoded) return []
    return encodedBits.map((bit, idx) => (errorPositionsMemo.has(idx) ? ((1 - bit) as 0 | 1) : bit))
  }, [encodedBits, errorPositionsMemo, isEncoded])

  const publicComparison = useMemo(
    () => (isEncoded ? compareToyCodewords(displayBits) : null),
    [isEncoded, displayBits]
  )
  const canDecode =
    !publicComparison || publicComparison.majorityMessage.join('') === originalMessage.join('')

  const combinatorialDisplay = useMemo(() => {
    if (!isEncoded) return null
    const n = encodedBits.length
    const t = errorCount
    if (t === 0) return { value: '1', label: 'No errors — trivial' }
    const val = binomial(n, t)
    return {
      value: val > 1_000_000 ? val.toExponential(1) : val.toLocaleString(),
      label: 'A count of subsets, not the number of operations required by a decoder or attack.',
    }
  }, [isEncoded, encodedBits.length, errorCount])

  return (
    <MotionConfig reducedMotion="user">
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Encode a message with redundancy, then <strong>intentionally add errors</strong>. The
          repetition decoder uses a public majority vote. Anyone can run it: this toy does not hide
          the message. Compare that actual decoder with an executed exhaustive comparison of all 256
          possible eight-bit messages. Error positions can change the answer even when the number of
          errors stays the same.
        </p>

        {/* Original message */}
        <div className="glass-panel p-4 space-y-3">
          <h4 className="text-sm font-semibold text-foreground">Original Message (8 bits)</h4>
          <div className="flex gap-1.5 sm:gap-2 flex-wrap">
            {originalMessage.map((bit, i) => (
              <div
                key={`orig-${i}`}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded border-2 border-border bg-background flex items-center justify-center text-sm font-mono font-bold text-foreground"
                aria-label={`bit ${i}: ${bit}`}
              >
                {bit}
              </div>
            ))}
          </div>

          {!isEncoded && (
            <Button
              variant="gradient"
              onClick={handleEncode}
              className="px-4 py-2 min-h-[44px] font-bold rounded-lg transition-colors text-sm"
            >
              Encode with Redundancy
            </Button>
          )}
        </div>

        {/* Encoded message */}
        <AnimatePresence>
          {isEncoded && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel p-4 space-y-3"
            >
              <h4 className="text-sm font-semibold text-foreground">
                Encoded Message ({encodedBits.length} bits)
              </h4>
              <p className="text-xs text-muted-foreground">
                Each data bit repeated 3× (majority-vote code). Parity bits shown in lighter color.
              </p>
              <div className="flex gap-1 sm:gap-1.5 flex-wrap">
                {displayBits.map((bit, i) => {
                  const isParity = parityIndices.has(i)
                  const hasError = errorPositionsMemo.has(i)
                  return (
                    <motion.div
                      key={`enc-${i}`}
                      initial={isParity ? { opacity: 0, scale: 0 } : {}}
                      animate={{
                        opacity: 1,
                        scale: 1,
                        backgroundColor: hasError ? 'hsl(var(--destructive) / 0.2)' : undefined,
                      }}
                      transition={{ duration: 0.3, delay: isParity ? i * 0.02 : 0 }}
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded border-2 flex items-center justify-center text-xs font-mono font-bold transition-colors ${
                        hasError
                          ? 'border-destructive text-destructive'
                          : isParity
                            ? 'border-secondary/50 text-secondary'
                            : 'border-border text-foreground'
                      }`}
                      aria-label={`encoded bit ${i}: ${bit}${hasError ? ' (error)' : ''}`}
                    >
                      {bit}
                    </motion.div>
                  )
                })}
              </div>

              {/* Error controls */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Inject errors: {errorCount}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={Math.min(8, encodedBits.length)}
                    step={1}
                    value={errorCount}
                    onChange={(e) => {
                      setErrorCount(Number(e.target.value))
                      setErrorSeed((s) => s + 1)
                      onInteract()
                    }}
                    className="flex-1 accent-primary"
                    aria-label="Error injection count"
                    aria-valuenow={errorCount}
                  />
                  <span
                    className={`text-sm font-bold ${canDecode ? 'text-success' : 'text-destructive'}`}
                  >
                    {errorCount === 0
                      ? 'No errors'
                      : canDecode
                        ? 'Decoder recovers'
                        : 'Decoding fails!'}
                  </span>
                </div>
              </div>

              {/* Combinatorial complexity */}
              {combinatorialDisplay && errorCount > 0 && (
                <div className="glass-panel p-3 space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Number of possible error-position subsets:{' '}
                    <span className="font-mono font-bold text-foreground">
                      C({encodedBits.length}, {errorCount}) = {combinatorialDisplay.value}
                    </span>{' '}
                    possible error patterns
                  </p>
                  <p className="text-xs text-muted-foreground italic">
                    {combinatorialDisplay.label}
                  </p>
                </div>
              )}

              {publicComparison && (
                <div
                  className="glass-panel p-3 space-y-1 text-sm"
                  aria-label="Executed public toy decoders"
                >
                  <p>
                    Exhaustive candidate messages visited:{' '}
                    <strong>{publicComparison.candidatesVisited}</strong>
                  </p>
                  <p>
                    Bit comparisons: <strong>{publicComparison.bitComparisons}</strong>
                  </p>
                  <p>
                    Nearest candidate message:{' '}
                    <strong>{publicComparison.nearestMessage.join('')}</strong>; Hamming distance{' '}
                    {publicComparison.nearestDistance}
                  </p>
                  <p>
                    Public majority-decoder output:{' '}
                    <strong>{publicComparison.majorityMessage.join('')}</strong>
                  </p>
                  <p>
                    Majority-decoder bit reads: <strong>{publicComparison.majorityBitReads}</strong>
                  </p>
                  <p>
                    {canDecode
                      ? 'The decoded message matches the original.'
                      : 'The decoded message differs from the original: too many errors occurred in a repetition group.'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Both algorithms are public and actually executed here. A combination count does
                    not establish an attack work factor; this repetition toy provides no secrecy.
                    Real code-based cryptography needs its specified code structure, parameters and
                    security analysis. No efficient quantum break is known, though generic quantum
                    search can still speed up brute-force-style attacks; this is not a security
                    claim about the toy.
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <QuantumContrastCallout
          classicalProblem="RSA: Find hidden period in modular exponentiation"
          classicalResult="Shor's exploits algebraic structure — BROKEN in polynomial time"
          pqcProblem="Codes: Decode random linear code with unknown error pattern"
          pqcResult="No efficient quantum break is known (generic quantum search still applies) — RESISTANT"
        />
      </div>
    </MotionConfig>
  )
}

/* ------------------------------------------------------------------ */
/*  Main exported component                                            */
/* ------------------------------------------------------------------ */

interface AlgorithmFamilyWorkshopProps {
  onComplete?: () => void
}

export const AlgorithmFamilyWorkshop: React.FC<AlgorithmFamilyWorkshopProps> = ({ onComplete }) => {
  const [expandedFamily, setExpandedFamily] = useState<'lattice' | 'hash' | 'code' | null>(
    'lattice'
  )
  const [completedFamilies, setCompletedFamilies] = useState<Set<string>>(new Set())

  const markFamilyInteracted = useCallback(
    (family: string) => {
      setCompletedFamilies((prev) => {
        if (prev.has(family)) return prev
        const next = new Set(prev)
        next.add(family)
        // Fire onComplete when all three done
        if (next.size === 3 && onComplete) {
          onComplete()
        }
        return next
      })
    },
    [onComplete]
  )

  const handleToggle = (family: 'lattice' | 'hash' | 'code') => {
    setExpandedFamily((prev) => (prev === family ? null : family))
  }

  return (
    <div className="space-y-5">
      <p className="text-muted-foreground leading-relaxed">
        Three families of math problems protect the post-quantum world. Each relies on a problem
        that <strong>no known quantum algorithm</strong> can efficiently solve &mdash; unlike RSA
        and ECC which Shor&apos;s Algorithm breaks completely. Explore each family below to build
        intuition for <em>why</em> they resist quantum attack.
      </p>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Progress:</span>
        {['lattice', 'hash', 'code'].map((f) => (
          <span
            key={f}
            className={`px-2 py-0.5 rounded-full border text-xs ${
              completedFamilies.has(f)
                ? 'border-success text-success bg-success/10'
                : 'border-border text-muted-foreground'
            }`}
          >
            {f === 'lattice' ? 'Lattice' : f === 'hash' ? 'Hash' : 'Code'}
            {completedFamilies.has(f) && ' ✓'}
          </span>
        ))}
      </div>

      <FamilySection
        title="Lattice-Based"
        subtitle="ML-KEM (Kyber), ML-DSA (Dilithium), FN-DSA (FALCON)"
        borderColor="border-l-primary"
        icon={Grid3X3}
        isExpanded={expandedFamily === 'lattice'}
        onToggle={() => handleToggle('lattice')}
        isCompleted={completedFamilies.has('lattice')}
      >
        <LatticeVisualization onInteract={() => markFamilyInteracted('lattice')} />
      </FamilySection>

      <FamilySection
        title="Hash-Based"
        subtitle="SLH-DSA (SPHINCS+), LMS/HSS, XMSS"
        borderColor="border-l-secondary"
        icon={Hash}
        isExpanded={expandedFamily === 'hash'}
        onToggle={() => handleToggle('hash')}
        isCompleted={completedFamilies.has('hash')}
      >
        <HashBasedVisualization onInteract={() => markFamilyInteracted('hash')} />
      </FamilySection>

      <FamilySection
        title="Code-Based"
        subtitle="Classic McEliece, HQC"
        borderColor="border-l-accent"
        icon={Binary}
        isExpanded={expandedFamily === 'code'}
        onToggle={() => handleToggle('code')}
        isCompleted={completedFamilies.has('code')}
      >
        <CodeBasedVisualization onInteract={() => markFamilyInteracted('code')} />
      </FamilySection>
    </div>
  )
}
