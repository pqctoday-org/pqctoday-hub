/* eslint-disable security/detect-object-injection */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Flame,
  BookOpen,
  Zap,
  Clock,
  Brain,
  GraduationCap,
} from 'lucide-react'
import { Button } from '../ui/button'
import {
  useAwarenessScore,
  BELT_RANKS,
  type BeltRank,
  type DimensionScore,
  type TrackProgress,
} from '@/hooks/useAwarenessScore'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

// ── BeltSwatch ──────────────────────────────────────────────────────────────

interface BeltSwatchProps {
  belt: BeltRank
  size?: 'sm' | 'md' | 'lg'
}

function BeltSwatch({ belt, size = 'md' }: BeltSwatchProps) {
  const dims = { sm: 'w-8 h-3', md: 'w-12 h-4', lg: 'w-20 h-6' }
  const isWhite = belt.color === '#F5F5F5'
  return (
    <div
      role="img"
      aria-label={belt.name}
      className={`${dims[size]} rounded-sm shrink-0`}
      style={{
        backgroundColor: belt.color,
        border: isWhite ? '1px solid #D1D5DB' : 'none',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      }}
    />
  )
}

// ── StreakBadge ─────────────────────────────────────────────────────────────

function StreakBadge({ streak }: { streak: number }) {
  if (streak < 2) return null
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-foreground border border-border rounded-full px-2 py-0.5">
      <Flame size={11} className="text-primary" />
      {streak}d streak
    </span>
  )
}

// ── DimensionBar ────────────────────────────────────────────────────────────

const DIMENSION_ICONS = {
  Knowledge: Brain,
  Breadth: BookOpen,
  Practice: Zap,
  'Time & Consistency': Clock,
}

interface DimensionBarProps {
  dim: DimensionScore
  delay: number
}

function DimensionBar({ dim, delay }: DimensionBarProps) {
  const Icon = DIMENSION_ICONS[dim.label as keyof typeof DIMENSION_ICONS] ?? BookOpen
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Icon size={13} className="text-muted-foreground shrink-0" />
          <span className="text-xs font-medium text-foreground truncate">{dim.label}</span>
          <span className="text-xs text-muted-foreground shrink-0">
            ({Math.round(dim.weight * 100)}%)
          </span>
        </div>
        <span
          className="text-xs font-mono font-semibold text-foreground shrink-0"
          aria-label={`${dim.label} score: ${dim.raw}%`}
        >
          {dim.raw}
        </span>
      </div>
      <div
        className="w-full h-1.5 rounded-full overflow-hidden bg-muted/30"
        role="progressbar"
        aria-valuenow={dim.raw}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${dim.label}: ${dim.raw}%`}
      >
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${dim.raw}%` }}
          transition={{ duration: 0.6, ease: 'easeOut', delay }}
        />
      </div>
      <p className="text-xs text-muted-foreground">{dim.detail}</p>
    </div>
  )
}

// ── TrackPill ───────────────────────────────────────────────────────────────

function TrackPill({ tp, delay }: { tp: TrackProgress; delay: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-1">
        <span className="text-xs font-medium text-foreground truncate">{tp.track}</span>
        <span className="text-xs text-muted-foreground shrink-0">
          {tp.completedModules}/{tp.totalModules}
        </span>
      </div>
      <div
        className="w-full h-1 rounded-full overflow-hidden bg-muted/30"
        role="progressbar"
        aria-valuenow={tp.percentComplete}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${tp.track}: ${tp.percentComplete}%`}
      >
        <motion.div
          className="h-full rounded-full bg-primary/70"
          initial={{ width: 0 }}
          animate={{ width: `${tp.percentComplete}%` }}
          transition={{ duration: 0.5, ease: 'easeOut', delay }}
        />
      </div>
    </div>
  )
}

// ── Belt progress bar (within current belt) ──────────────────────────────────

function BeltProgressBar({
  score,
  belt,
  nextBelt,
}: {
  score: number
  belt: BeltRank
  nextBelt: BeltRank | null
}) {
  if (!nextBelt) return null
  const range = nextBelt.minScore - belt.minScore
  const progress = range > 0 ? Math.min(100, ((score - belt.minScore) / range) * 100) : 100
  return (
    <div
      className="w-full h-1 rounded-full overflow-hidden bg-muted/20 mt-2"
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Progress toward ${nextBelt.name}`}
    >
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: belt.color === '#F5F5F5' ? '#9CA3AF' : belt.color }}
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 }}
      />
    </div>
  )
}

// ── Belt rank ladder (mini) ──────────────────────────────────────────────────

function BeltLadder({ currentBelt }: { currentBelt: BeltRank }) {
  return (
    <div className="flex items-center gap-1" aria-label="Belt progression">
      {BELT_RANKS.map((belt, i) => {
        const isEarned = BELT_RANKS.indexOf(currentBelt) >= i
        const isCurrent = belt.name === currentBelt.name
        return (
          <div
            key={belt.name}
            title={belt.name}
            className={`rounded-sm transition-all ${isCurrent ? 'h-3.5 w-5' : 'h-2 w-3'}`}
            style={{
              backgroundColor: isEarned ? belt.color : undefined,
              border: isEarned
                ? belt.color === '#F5F5F5'
                  ? '1px solid #D1D5DB'
                  : 'none'
                : '1px solid rgba(156,163,175,0.3)',
              opacity: isEarned ? 1 : 0.35,
            }}
          />
        )
      })}
    </div>
  )
}

// ── ScoreCard ────────────────────────────────────────────────────────────────

export function ScoreCard() {
  const result = useAwarenessScore()
  const [isOpen, setIsOpen] = useState(result.hasStarted)

  const {
    hasStarted,
    score,
    belt,
    nextBelt,
    pointsToNextBelt,
    cappedByThreshold,
    breakdown,
    trackProgress,
    streak,
  } = result

  // ── Teaser state for new users ──────────────────────────────────────────────
  if (!hasStarted) {
    return (
      <motion.section
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        aria-labelledby="scorecard-heading"
      >
        <div className="glass-panel p-6 flex flex-col sm:flex-row items-center gap-6">
          <div className="flex flex-col items-center gap-2 shrink-0">
            <div className="flex gap-1.5 items-end">
              {BELT_RANKS.map((b) => (
                <div
                  key={b.name}
                  title={b.name}
                  className="w-3 rounded-sm"
                  style={{
                    height: `${8 + BELT_RANKS.indexOf(b) * 2}px`,
                    backgroundColor: b.color,
                    border: b.color === '#F5F5F5' ? '1px solid #D1D5DB' : 'none',
                    opacity: 0.6,
                  }}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground font-mono">White → Black</span>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <p className="text-xs font-mono uppercase tracking-widest text-primary mb-1">
              Learning Journey
            </p>
            <h2 id="scorecard-heading" className="text-lg font-bold mb-1.5">
              Earn your first belt
            </h2>
            <p className="text-sm text-muted-foreground mb-4 max-w-md">
              Complete modules, take the quiz, and generate crypto artifacts to build your Composite
              Awareness Score — and advance through judo belt ranks.
            </p>
            <Link to="/learn">
              <Button variant="gradient" size="sm">
                <GraduationCap size={14} className="mr-1.5" />
                Begin the Journey
                <ArrowRight size={14} className="ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </motion.section>
    )
  }

  // ── Active scorecard ────────────────────────────────────────────────────────
  return (
    <motion.section
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      aria-labelledby="scorecard-heading"
    >
      <div className="glass-panel p-6">
        {/* ── Header row ─────────────────────────────────────────────────── */}
        <div className="flex items-center gap-4">
          <BeltSwatch belt={belt} size="md" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-0.5">
              Learning Journey
            </p>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span
                className="text-2xl font-bold text-gradient"
                aria-label={`Awareness score: ${score} out of 100`}
              >
                {score}
              </span>
              <span className="text-sm text-muted-foreground">/ 100</span>
              <span className="text-sm font-semibold text-foreground" id="scorecard-heading">
                {belt.name}
              </span>
              <StreakBadge streak={streak.current} />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 italic">{belt.tagline}</p>
          </div>

          {/* Next belt hint */}
          {nextBelt && (
            <div className="text-right shrink-0 hidden sm:block">
              <p className="text-xs text-muted-foreground">{pointsToNextBelt} pts to</p>
              <p className="text-xs font-medium text-foreground">{nextBelt.name}</p>
            </div>
          )}

          {/* Collapse toggle */}
          <button
            aria-expanded={isOpen}
            aria-controls="scorecard-body"
            onClick={() => setIsOpen((v) => !v)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>

        {/* Belt ladder + progress toward next belt */}
        <div className="mt-3 flex items-center gap-3">
          <BeltLadder currentBelt={belt} />
          <div className="flex-1">
            <BeltProgressBar score={score} belt={belt} nextBelt={nextBelt} />
          </div>
        </div>

        {/* ── Expandable body ─────────────────────────────────────────────── */}
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              id="scorecard-body"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="mt-6 space-y-6">
                {/* Threshold cap hint */}
                {cappedByThreshold && (
                  <div className="rounded-lg border border-border bg-muted/10 px-3 py-2">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Next belt unlock: </span>
                      {cappedByThreshold}
                    </p>
                  </div>
                )}

                {/* ── Dimension breakdown ──────────────────────────────── */}
                <div>
                  <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
                    Score Breakdown
                  </p>
                  <div className="space-y-4">
                    <DimensionBar dim={breakdown.knowledge} delay={0.05} />
                    <DimensionBar dim={breakdown.breadth} delay={0.1} />
                    <DimensionBar dim={breakdown.practice} delay={0.15} />
                    <DimensionBar dim={breakdown.timeConsistency} delay={0.2} />
                  </div>
                </div>

                {/* ── Track progress ───────────────────────────────────── */}
                <div>
                  <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
                    Learning Tracks
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {trackProgress.map((tp, i) => (
                      <TrackPill key={tp.track} tp={tp} delay={0.05 * i} />
                    ))}
                  </div>
                </div>

                {/* ── Footer ──────────────────────────────────────────── */}
                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <div className="flex items-center gap-3 flex-wrap">
                    {result.totalMinutes > 0 && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock size={11} />
                        {Math.round(result.totalMinutes)} min
                      </span>
                    )}
                    {result.artifactCount > 0 && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Zap size={11} />
                        {result.artifactCount} artifact{result.artifactCount !== 1 ? 's' : ''}
                      </span>
                    )}
                    {streak.totalSessions > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {streak.totalSessions} session{streak.totalSessions !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <Link to="/learn">
                    <Button variant="outline" size="sm">
                      Continue Learning
                      <ArrowRight size={14} className="ml-1.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  )
}
