// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { motion, MotionConfig } from 'framer-motion'
import { ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FAMILY_LIST, type FamilyId, type MathFamily } from '../data/families'

interface FamilyMathExplainerProps {
  initialFamilyId?: FamilyId
}

export const FamilyMathExplainer: React.FC<FamilyMathExplainerProps> = ({ initialFamilyId }) => {
  const [idx, setIdx] = useState(() => {
    if (!initialFamilyId) return 0
    const found = FAMILY_LIST.findIndex((f) => f.id === initialFamilyId)
    return found >= 0 ? found : 0
  })
  const family = FAMILY_LIST[idx] // eslint-disable-line security/detect-object-injection

  return (
    <div className="space-y-6">
      {/* Family selector */}
      <div className="glass-panel p-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {FAMILY_LIST.map((f, i) => (
            <Button
              key={f.id}
              variant="ghost"
              onClick={() => setIdx(i)}
              className={`rounded-md border p-2 text-left transition-colors h-auto block ${
                i === idx
                  ? `${f.borderClass} ${f.bgClass}`
                  : 'border-border bg-card/40 hover:bg-card'
              }`}
            >
              <div className={`text-sm font-bold ${i === idx ? f.colorClass : 'text-foreground'}`}>
                {f.label}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                {f.candidateIds.join(' · ').toUpperCase()}
              </div>
            </Button>
          ))}
        </div>
      </div>

      {/* Animated visual + explanation */}
      <div className={`glass-panel p-5 space-y-4 border ${family.borderClass}`}>
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <h3 className={`text-xl font-bold ${family.colorClass}`}>{family.label}</h3>
          <span className="text-xs text-muted-foreground italic">{family.tagline}</span>
        </div>

        <LaymanPanel family={family} />

        <div className="rounded-lg border border-border bg-card/40 p-4 overflow-hidden">
          {family.id === 'mpcith' && <MpcithVisual />}
          {family.id === 'multivariate' && <MultivariateVisual />}
          {family.id === 'isogeny' && <IsogenyVisual />}
          {family.id === 'lattice' && <LatticeVisual />}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-md border border-border bg-card/40 p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">
              Hardness
            </div>
            <p className="text-xs text-foreground/85 leading-snug">{family.hardness}</p>
          </div>
          <div className="rounded-md border border-border bg-card/40 p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">
              Why kept
            </div>
            <p className="text-xs text-foreground/85 leading-snug">{family.whyKept}</p>
          </div>
          <div className="rounded-md border border-border bg-card/40 p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">
              Open concerns
            </div>
            <p className="text-xs text-foreground/85 leading-snug">{family.openConcerns}</p>
          </div>
        </div>
      </div>

      <div className="flex justify-between gap-3">
        <Button
          variant="ghost"
          onClick={() => setIdx(Math.max(0, idx - 1))}
          disabled={idx === 0}
          className="gap-2"
        >
          <ChevronLeft size={14} /> Previous family
        </Button>
        <Button
          variant="gradient"
          onClick={() => setIdx(Math.min(FAMILY_LIST.length - 1, idx + 1))}
          disabled={idx === FAMILY_LIST.length - 1}
          className="gap-2"
        >
          Next family <ChevronRight size={14} />
        </Button>
      </div>
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Plain-English mini-explainer rendered above the technical SVG. Three
 * paragraphs in the same conversational tone as curious-summary.md so a
 * non-expert reader gets the metaphor first, then the diagram makes sense.
 */
const LaymanPanel: React.FC<{ family: MathFamily }> = ({ family }) => (
  <div className="rounded-lg border border-warning/30 bg-warning/5 p-4 space-y-2">
    <div className="flex items-center gap-2">
      <Lightbulb size={16} className="text-warning shrink-0" />
      <h4 className="text-sm font-bold text-warning">In plain English</h4>
    </div>
    <p className="text-sm text-foreground/85 leading-relaxed">{family.layman.analogy}</p>
    <p className="text-sm text-foreground/85 leading-relaxed">{family.layman.whatsDifferent}</p>
    <p className="text-sm text-foreground/85 leading-relaxed">
      <span className="font-semibold text-foreground">The catch — </span>
      {family.layman.catch}
    </p>
  </div>
)

/** Inline lock glyph for "hidden / unrevealed" elements inside SVGs. */
const LockGlyph: React.FC<{ cx: number; cy: number; size?: number; tone?: string }> = ({
  cx,
  cy,
  size = 12,
  tone = 'text-status-error',
}) => (
  <g transform={`translate(${cx - size / 2}, ${cy - size / 2})`} className={tone}>
    <rect
      x={size * 0.15}
      y={size * 0.45}
      width={size * 0.7}
      height={size * 0.5}
      rx={size * 0.08}
      fill="currentColor"
      opacity={0.85}
    />
    <path
      d={`M ${size * 0.3} ${size * 0.45} V ${size * 0.27} a ${size * 0.2} ${size * 0.2} 0 0 1 ${size * 0.4} 0 V ${size * 0.45}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={size * 0.13}
    />
  </g>
)

// ── MPCitH visual ──────────────────────────────────────────────────────────
/**
 * Depicts the actual MPCitH mechanism:
 *   sk → simulate N parties locally → commit to each (C₁..C₄) → Fiat-Shamir
 *   challenge picks N-1 to open, 1 stays hidden → verifier replays opened
 *   parties → σ bundles (commitments + opened transcripts + responses).
 */
const MpcithVisual: React.FC = () => {
  const parties = [0, 1, 2, 3]
  const hiddenIdx = 3 // FS challenge "picks" this one to stay hidden
  return (
    <MotionConfig reducedMotion="user">
      <div className="space-y-3">
        <div className="text-sm font-semibold text-status-success mb-1">
          Simulate N parties locally · commit to each · Fiat-Shamir reveals N−1 · keep 1 hidden
        </div>
        <svg viewBox="0 0 600 240" className="w-full h-56">
          <defs>
            <marker
              id="arrow-mpcith"
              markerWidth={8}
              markerHeight={8}
              refX={6}
              refY={4}
              orient="auto"
            >
              <polygon points="0 0, 8 4, 0 8" className="fill-foreground/60" />
            </marker>
          </defs>

          {/* Top labels */}
          <text x={50} y={18} textAnchor="middle" className="fill-muted-foreground text-[9px]">
            public: pk, message m
          </text>

          {/* Secret key */}
          <motion.circle
            cx={50}
            cy={120}
            r={20}
            className="fill-success/30 stroke-success"
            strokeWidth={2}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.4 }}
          />
          <text
            x={50}
            y={124}
            textAnchor="middle"
            className="fill-foreground text-[10px] font-bold"
          >
            sk
          </text>

          {/* Parties (sim + commit combined per row) */}
          {parties.map((i) => {
            const y = 50 + i * 42
            return (
              <motion.g
                key={`p-${i}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1, duration: 0.4 }}
              >
                {/* arrow from sk */}
                <line
                  x1={72}
                  y1={120}
                  x2={130}
                  y2={y + 14}
                  className="stroke-success/60"
                  strokeWidth={1.5}
                />
                {/* party-sim box */}
                <rect
                  x={130}
                  y={y}
                  width={100}
                  height={28}
                  rx={4}
                  className="fill-success/10 stroke-success/60"
                  strokeWidth={1}
                />
                <text
                  x={180}
                  y={y + 18}
                  textAnchor="middle"
                  className="fill-foreground text-[10px]"
                >
                  P{i + 1} simulate
                </text>
                {/* commitment box */}
                <rect
                  x={240}
                  y={y}
                  width={50}
                  height={28}
                  rx={4}
                  className="fill-success/20 stroke-success"
                  strokeWidth={1}
                />
                <text
                  x={265}
                  y={y + 18}
                  textAnchor="middle"
                  className="fill-foreground text-[10px] font-bold"
                >
                  C{i + 1}
                </text>
              </motion.g>
            )
          })}

          {/* Fiat-Shamir challenge column */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0, duration: 0.4 }}
          >
            <line
              x1={310}
              y1={50}
              x2={310}
              y2={196}
              className="stroke-destructive/40"
              strokeWidth={1.5}
              strokeDasharray="3 3"
            />
            <text
              x={310}
              y={42}
              textAnchor="middle"
              className="fill-destructive text-[9px] font-bold"
            >
              FS challenge
            </text>
            <text x={310} y={210} textAnchor="middle" className="fill-destructive text-[9px]">
              picks 1 to hide
            </text>
          </motion.g>

          {/* Reveal / hide column */}
          {parties.map((i) => {
            const y = 50 + i * 42
            const hidden = i === hiddenIdx
            return (
              <motion.g
                key={`r-${i}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.3 + i * 0.08, duration: 0.3 }}
              >
                <rect
                  x={335}
                  y={y}
                  width={80}
                  height={28}
                  rx={4}
                  className={
                    hidden
                      ? 'fill-destructive/10 stroke-destructive'
                      : 'fill-success/15 stroke-success'
                  }
                  strokeWidth={1}
                />
                {hidden ? (
                  <>
                    <LockGlyph cx={353} cy={y + 14} size={12} />
                    <text
                      x={385}
                      y={y + 18}
                      textAnchor="middle"
                      className="fill-destructive text-[9px] font-bold"
                    >
                      HIDDEN
                    </text>
                  </>
                ) : (
                  <text
                    x={375}
                    y={y + 18}
                    textAnchor="middle"
                    className="fill-success text-[10px] font-bold"
                  >
                    reveal P{i + 1}
                  </text>
                )}
              </motion.g>
            )
          })}

          {/* Verifier */}
          <motion.g
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.9, duration: 0.4 }}
          >
            <rect
              x={440}
              y={70}
              width={100}
              height={100}
              rx={6}
              className="fill-success/5 stroke-success"
              strokeWidth={2}
            />
            <text
              x={490}
              y={100}
              textAnchor="middle"
              className="fill-foreground text-[11px] font-bold"
            >
              Verifier
            </text>
            <text x={490} y={120} textAnchor="middle" className="fill-muted-foreground text-[9px]">
              replays the
            </text>
            <text x={490} y={132} textAnchor="middle" className="fill-muted-foreground text-[9px]">
              revealed 3
            </text>
            <text
              x={490}
              y={155}
              textAnchor="middle"
              className="fill-success text-[14px] font-bold"
            >
              ✓
            </text>
          </motion.g>

          {/* Arrow to σ */}
          <motion.line
            x1={540}
            y1={120}
            x2={560}
            y2={120}
            className="stroke-foreground/60"
            strokeWidth={2}
            markerEnd="url(#arrow-mpcith)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 2.2, duration: 0.3 }}
          />

          {/* σ output (family color) */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.4, duration: 0.3 }}
          >
            <rect
              x={562}
              y={100}
              width={35}
              height={40}
              rx={4}
              className="fill-success/15 stroke-success"
              strokeWidth={2}
            />
            <text
              x={580}
              y={124}
              textAnchor="middle"
              className="fill-foreground text-[12px] font-bold"
            >
              σ
            </text>
          </motion.g>

          <text
            x={300}
            y={234}
            textAnchor="middle"
            className="fill-muted-foreground text-[10px] italic"
          >
            σ = ⟨ C₁..C₄ , opened-party transcripts , responses ⟩
          </text>
        </svg>
        <p className="text-xs text-muted-foreground italic leading-relaxed">
          Signing simulates all N parties locally and commits to each computation. The Fiat-Shamir
          challenge then chooses which N−1 to open; the unopened party hides the secret. Verifier
          replays the opened parties and checks every commitment. Security reduces to the symmetric
          primitives that drive the simulated parties (AES for FAEST, hash-based for SDitH).
        </p>
      </div>
    </MotionConfig>
  )
}

// ── Multivariate visual ────────────────────────────────────────────────────
/**
 * Drops the misleading "coloured grid" metaphor. Now shows the real picture:
 *   - Variable space F^n with the secret oil subspace as a tilted band.
 *   - Sign: pick random vinegar v → P(v, ·) is LINEAR in the oil → solve for o
 *     → σ = (v, o).
 *   - Wedge-attack annotation at the bottom.
 */
const MultivariateVisual: React.FC = () => (
  <MotionConfig reducedMotion="user">
    <div className="space-y-3">
      <div className="text-sm font-semibold text-status-warning mb-1">
        Public map P : F<sup>n</sup> → F<sup>m</sup> looks random — secret is the hidden oil
        subspace
      </div>
      <svg viewBox="0 0 600 240" className="w-full h-56">
        <defs>
          <marker id="arrow-mv" markerWidth={8} markerHeight={8} refX={6} refY={4} orient="auto">
            <polygon points="0 0, 8 4, 0 8" className="fill-warning" />
          </marker>
        </defs>

        {/* Variable space box (left) */}
        <motion.rect
          x={30}
          y={30}
          width={260}
          height={170}
          rx={6}
          className="fill-warning/5 stroke-warning/50"
          strokeWidth={1.5}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        />
        <text x={160} y={48} textAnchor="middle" className="fill-warning text-[10px] font-bold">
          variable space F<tspan dy={-2}>n</tspan>
        </text>

        {/* Axes */}
        <line x1={50} y1={180} x2={270} y2={180} className="stroke-foreground/40" strokeWidth={1} />
        <line x1={50} y1={180} x2={50} y2={70} className="stroke-foreground/40" strokeWidth={1} />
        <text x={160} y={195} textAnchor="middle" className="fill-muted-foreground text-[9px]">
          vinegar variables x₁ … x_v
        </text>
        <text
          x={40}
          y={125}
          textAnchor="middle"
          transform="rotate(-90, 40, 125)"
          className="fill-muted-foreground text-[9px]"
        >
          oil variables x_{'{v+1}'} … x_n
        </text>

        {/* Hidden oil subspace — diagonal band, status-warning */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <path
            d="M 75 165 L 260 70"
            className="stroke-warning"
            strokeWidth={4}
            strokeLinecap="round"
          />
          <path
            d="M 75 165 L 260 70"
            className="stroke-warning"
            strokeWidth={10}
            opacity={0.2}
            strokeLinecap="round"
          />
          <text x={195} y={100} className="fill-warning text-[9px] font-bold">
            oil subspace
          </text>
          <text x={195} y={112} className="fill-muted-foreground text-[8px] italic">
            (secret)
          </text>
          <LockGlyph cx={245} cy={80} size={11} tone="text-status-warning" />
        </motion.g>

        {/* Step 1: pick random v */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.4 }}
        >
          <circle
            cx={140}
            cy={180}
            r={5}
            className="fill-foreground stroke-foreground"
            strokeWidth={1}
          />
          <text
            x={140}
            y={172}
            textAnchor="middle"
            className="fill-foreground text-[9px] font-bold"
          >
            v
          </text>
          <text x={140} y={210} textAnchor="middle" className="fill-muted-foreground text-[8px]">
            random vinegar
          </text>
        </motion.g>

        {/* Step 2: linearization arrow */}
        <motion.g
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.5, duration: 0.4 }}
        >
          <line
            x1={300}
            y1={115}
            x2={345}
            y2={115}
            className="stroke-warning"
            strokeWidth={2}
            markerEnd="url(#arrow-mv)"
          />
          <text x={322} y={108} textAnchor="middle" className="fill-warning text-[9px] font-bold">
            substitute v
          </text>
          <text x={322} y={130} textAnchor="middle" className="fill-muted-foreground text-[8px]">
            → linear in oil
          </text>
        </motion.g>

        {/* Right panel: sign steps */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 0.4 }}
        >
          <rect
            x={355}
            y={45}
            width={225}
            height={140}
            rx={6}
            className="fill-card stroke-border"
            strokeWidth={1}
          />
          <text
            x={467}
            y={63}
            textAnchor="middle"
            className="fill-foreground text-[10px] font-bold"
          >
            Sign
          </text>
          <text x={365} y={84} className="fill-foreground text-[9px]">
            1. Pick random vinegar v ∈ F<tspan dy={-2}>v</tspan>
          </text>
          <text x={365} y={104} className="fill-foreground text-[9px]">
            2. P(v, ·) becomes LINEAR in oil
          </text>
          <text x={365} y={124} className="fill-foreground text-[9px]">
            3. Solve L · o = y − P(v, 0)
          </text>
          <text x={365} y={144} className="fill-warning text-[9px] font-bold">
            4. σ = (v, o)
          </text>
          {/* σ box (family color) */}
          <rect
            x={470}
            y={155}
            width={100}
            height={22}
            rx={4}
            className="fill-warning/15 stroke-warning"
            strokeWidth={2}
          />
          <text
            x={520}
            y={170}
            textAnchor="middle"
            className="fill-foreground text-[10px] font-bold"
          >
            σ — 96–838 B
          </text>
        </motion.g>

        {/* Wedge-attack annotation */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.3, duration: 0.4 }}
        >
          <rect
            x={30}
            y={210}
            width={550}
            height={24}
            rx={4}
            className="fill-destructive/5 stroke-destructive/40"
            strokeWidth={1}
          />
          <text
            x={305}
            y={226}
            textAnchor="middle"
            className="fill-destructive text-[10px] font-semibold"
          >
            ⚠ 2025 Ran wedge attack: exterior products expose the oil subspace in characteristic-2
            fields
          </text>
        </motion.g>
      </svg>
      <p className="text-xs text-muted-foreground italic leading-relaxed">
        The verifier sees only the public map P — designed to look random. The signer knows where
        the oil subspace sits inside the variable space; substituting random vinegar collapses the
        quadratic system to a linear one in the oil coordinates, which Gaussian elimination solves
        in milliseconds. Wedge attacks broke that secrecy in some characteristic-2 instances,
        driving the move to odd-characteristic fields (QR-UOV survived unscathed).
      </p>
    </div>
  </MotionConfig>
)

// ── Isogeny visual ─────────────────────────────────────────────────────────
const IsogenyVisual: React.FC = () => {
  const nodes = [
    { x: 60, y: 100, label: 'E₀' },
    { x: 150, y: 60, label: 'E₁' },
    { x: 150, y: 140, label: 'E₂' },
    { x: 240, y: 100, label: 'E₃' },
    { x: 330, y: 60, label: 'E₄' },
    { x: 330, y: 140, label: 'E₅' },
    { x: 420, y: 100, label: 'E_pub' },
  ]
  const edges: Array<[number, number]> = [
    [0, 1],
    [0, 2],
    [1, 3],
    [2, 3],
    [3, 4],
    [3, 5],
    [4, 6],
    [5, 6],
  ]
  const signaturePath = [0, 1, 3, 4, 6]
  // Lock locations along the secret walk (midpoints of secret edges)
  const lockEdgeIdxs = [0, 4] // E₀→E₁ and E₃→E₄
  return (
    <MotionConfig reducedMotion="user">
      <div className="space-y-3">
        <div className="text-sm font-semibold text-status-info mb-1">
          Knowing the isogeny φ : E₀ → E_pub is hard. The signature compactly proves you know it.
        </div>
        <svg viewBox="0 0 540 220" className="w-full h-52">
          <defs>
            <marker id="arrow-iso" markerWidth={8} markerHeight={8} refX={6} refY={4} orient="auto">
              <polygon points="0 0, 8 4, 0 8" className="fill-info" />
            </marker>
          </defs>

          {/* Toy-graph annotation */}
          <text
            x={270}
            y={16}
            textAnchor="middle"
            className="fill-muted-foreground text-[9px] italic"
          >
            toy graph shown — real supersingular isogeny graph has ~p/12 ≈ 2²⁵⁶ nodes
          </text>

          {edges.map(([a, b], i) => {
            const na = nodes[a] // eslint-disable-line security/detect-object-injection
            const nb = nodes[b] // eslint-disable-line security/detect-object-injection
            const inPath =
              signaturePath.includes(a) &&
              signaturePath.includes(b) &&
              Math.abs(signaturePath.indexOf(a) - signaturePath.indexOf(b)) === 1
            return (
              <motion.line
                key={`e-${i}`}
                x1={na.x}
                y1={na.y}
                x2={nb.x}
                y2={nb.y}
                className={inPath ? 'stroke-info' : 'stroke-border'}
                strokeWidth={inPath ? 3 : 1.2}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.3 }}
              />
            )
          })}

          {/* Lock glyphs on secret-walk edges */}
          {lockEdgeIdxs.map((i) => {
            const [a, b] = edges[i] // eslint-disable-line security/detect-object-injection
            const na = nodes[a] // eslint-disable-line security/detect-object-injection
            const nb = nodes[b] // eslint-disable-line security/detect-object-injection
            const mx = (na.x + nb.x) / 2
            const my = (na.y + nb.y) / 2
            return (
              <motion.g
                key={`lock-${i}`}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.4, duration: 0.3 }}
              >
                <circle cx={mx} cy={my} r={9} className="fill-card stroke-info" strokeWidth={1.5} />
                <LockGlyph cx={mx} cy={my} size={11} tone="text-status-info" />
              </motion.g>
            )
          })}

          {nodes.map((n, i) => {
            const inPath = signaturePath.includes(i)
            return (
              <motion.g
                key={`n-${i}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.1, duration: 0.3 }}
              >
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={17}
                  className={
                    i === 0
                      ? 'fill-info/30 stroke-info'
                      : i === nodes.length - 1
                        ? 'fill-info/40 stroke-info'
                        : inPath
                          ? 'fill-info/15 stroke-info'
                          : 'fill-card stroke-border'
                  }
                  strokeWidth={2}
                />
                <text
                  x={n.x}
                  y={n.y + 4}
                  textAnchor="middle"
                  className="fill-foreground text-[9px] font-bold"
                >
                  {n.label}
                </text>
              </motion.g>
            )
          })}

          <text x={60} y={195} textAnchor="middle" className="fill-info text-[10px] font-bold">
            start
          </text>
          <text x={420} y={195} textAnchor="middle" className="fill-info text-[10px] font-bold">
            public key
          </text>

          {/* σ box (family color) */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.7, duration: 0.3 }}
          >
            <line
              x1={448}
              y1={100}
              x2={465}
              y2={100}
              className="stroke-foreground/60"
              strokeWidth={2}
              markerEnd="url(#arrow-iso)"
            />
            <rect
              x={467}
              y={80}
              width={70}
              height={40}
              rx={4}
              className="fill-info/15 stroke-info"
              strokeWidth={2}
            />
            <text
              x={502}
              y={98}
              textAnchor="middle"
              className="fill-foreground text-[10px] font-bold"
            >
              σ (148 B)
            </text>
            <text x={502} y={112} textAnchor="middle" className="fill-muted-foreground text-[8px]">
              φ compactly
            </text>
          </motion.g>
        </svg>
        <p className="text-xs text-muted-foreground italic leading-relaxed">
          The signer knows a secret isogeny <em>φ</em> from E₀ to E_pub — equivalently, a path
          through the supersingular graph. The signature is a compact algebraic representation of
          that morphism (an ideal in a quaternion order, not a literal node list), so it stays at
          148 B even though the underlying graph has astronomic size. SQIsign avoids SIKE's pitfall
          by not revealing auxiliary torsion points to the verifier.
        </p>
      </div>
    </MotionConfig>
  )
}

// ── Lattice visual (HAWK-specific split) ────────────────────────────────────
/**
 * Visualises the actual implementation contrast between Falcon and HAWK:
 *   - Left half: lattice intuition — short vector in a coset of an integer lattice.
 *   - Right half: top sub-panel shows Falcon's float Gaussian sampler;
 *                 bottom sub-panel shows HAWK's integer Babai-style rounding.
 */
const LatticeVisual: React.FC = () => {
  const cols = 5
  const rows = 5
  return (
    <MotionConfig reducedMotion="user">
      <div className="space-y-3">
        <div className="text-sm font-semibold text-primary mb-1">
          Both schemes sample a short vector — Falcon needs floats, HAWK uses integers only
        </div>
        <svg viewBox="0 0 600 240" className="w-full h-56">
          <defs>
            <marker id="arrow-lat" markerWidth={8} markerHeight={8} refX={6} refY={4} orient="auto">
              <polygon points="0 0, 8 4, 0 8" className="fill-primary" />
            </marker>
          </defs>

          {/* LEFT half — lattice intuition */}
          <text x={150} y={18} textAnchor="middle" className="fill-primary text-[10px] font-bold">
            Lattice intuition
          </text>
          {Array.from({ length: cols * rows }).map((_, i) => {
            const cx = 50 + (i % cols) * 50
            const cy = 50 + Math.floor(i / cols) * 35
            return (
              <motion.circle
                key={`pt-${i}`}
                cx={cx}
                cy={cy}
                r={2.5}
                className="fill-foreground/30"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.01, duration: 0.2 }}
              />
            )
          })}
          {/* Target derived from the message hash */}
          <motion.circle
            cx={170}
            cy={120}
            r={9}
            className="fill-warning/30 stroke-warning"
            strokeWidth={2}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.7, duration: 0.4 }}
          />
          <text
            x={170}
            y={124}
            textAnchor="middle"
            className="fill-foreground text-[9px] font-bold"
          >
            t
          </text>
          <text x={170} y={142} textAnchor="middle" className="fill-muted-foreground text-[8px]">
            H(m)
          </text>

          {/* Short vector v */}
          <motion.line
            x1={170}
            y1={120}
            x2={100}
            y2={85}
            className="stroke-primary"
            strokeWidth={2.5}
            markerEnd="url(#arrow-lat)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 1.1, duration: 0.4 }}
          />
          <motion.circle
            cx={100}
            cy={85}
            r={5}
            className="fill-primary/30 stroke-primary"
            strokeWidth={2}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1.5, duration: 0.3 }}
          />
          <text x={100} y={75} textAnchor="middle" className="fill-primary text-[10px] font-bold">
            v
          </text>
          <text
            x={130}
            y={200}
            textAnchor="middle"
            className="fill-muted-foreground text-[9px] italic"
          >
            σ = short coset vector
          </text>
          <text x={130} y={213} textAnchor="middle" className="fill-muted-foreground text-[8px]">
            B<tspan dy={-2}>T</tspan>
            <tspan dy={2}>B = Q (public Gram)</tspan>
          </text>

          {/* Divider */}
          <line
            x1={290}
            y1={30}
            x2={290}
            y2={220}
            className="stroke-border"
            strokeWidth={1}
            strokeDasharray="3 3"
          />

          {/* RIGHT half — top sub-panel: Falcon (Gaussian / float) */}
          <text x={440} y={42} textAnchor="middle" className="fill-warning text-[10px] font-bold">
            Falcon — float Gaussian sampling
          </text>
          <motion.path
            d="M 310 110 Q 350 110, 380 70 T 450 70 Q 510 70, 530 110 L 560 110"
            fill="none"
            className="stroke-warning"
            strokeWidth={2}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          />
          <motion.path
            d="M 310 110 Q 350 110, 380 70 T 450 70 Q 510 70, 530 110 L 560 110 L 560 115 L 310 115 Z"
            className="fill-warning/15"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0, duration: 0.4 }}
          />
          {/* Float sample tick */}
          <line x1={435} y1={70} x2={435} y2={110} className="stroke-warning" strokeWidth={1.5} />
          <text x={435} y={62} textAnchor="middle" className="fill-warning text-[8px] font-mono">
            3.14159…
          </text>
          <text x={435} y={128} textAnchor="middle" className="fill-muted-foreground text-[8px]">
            float — constant-time hard
          </text>

          {/* RIGHT half — bottom sub-panel: HAWK (integer / discrete) */}
          <text x={440} y={158} textAnchor="middle" className="fill-primary text-[10px] font-bold">
            HAWK — integer Babai rounding
          </text>
          {/* Integer lattice tick row */}
          <line x1={310} y1={195} x2={560} y2={195} className="stroke-border" strokeWidth={1} />
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
            const x = 320 + i * 32
            return (
              <g key={`tick-${i}`}>
                <line
                  x1={x}
                  y1={190}
                  x2={x}
                  y2={200}
                  className="stroke-foreground/40"
                  strokeWidth={1}
                />
                <text
                  x={x}
                  y={213}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[8px] font-mono"
                >
                  {i - 3}
                </text>
              </g>
            )
          })}
          {/* Continuous target above ticks */}
          <motion.circle
            cx={444}
            cy={183}
            r={3}
            className="fill-warning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4, duration: 0.3 }}
          />
          <text x={444} y={178} textAnchor="middle" className="fill-warning text-[8px] font-mono">
            t
          </text>
          {/* Rounded integer choice */}
          <motion.circle
            cx={448}
            cy={195}
            r={5}
            className="fill-primary stroke-primary"
            strokeWidth={2}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1.7, duration: 0.3 }}
          />
          <motion.path
            d="M 444 184 L 448 192"
            className="stroke-primary"
            strokeWidth={1.5}
            markerEnd="url(#arrow-lat)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 1.5, duration: 0.3 }}
          />
          <text x={502} y={195} textAnchor="middle" className="fill-primary text-[8px] font-mono">
            round → 1
          </text>
          <text x={435} y={233} textAnchor="middle" className="fill-muted-foreground text-[8px]">
            all integer arithmetic — constant-time easy
          </text>
        </svg>
        <p className="text-xs text-muted-foreground italic leading-relaxed">
          Both schemes solve the same problem — produce a short vector in a coset defined by a hash
          of the message. Falcon (FN-DSA) samples from a continuous Gaussian distribution and rounds
          to the lattice, which needs floating-point arithmetic that's notoriously hard to make
          constant-time. HAWK reformulates the problem on a rank-2 module lattice with a Gram matrix
          as the public key, and uses integer-only Babai-style rounding — the same security level at
          555 B with a much friendlier implementation profile for constrained hardware.
        </p>
      </div>
    </MotionConfig>
  )
}
