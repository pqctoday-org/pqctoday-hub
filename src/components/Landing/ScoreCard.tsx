// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Flame, GraduationCap, Info, Sparkles } from 'lucide-react'
import { Button } from '../ui/button'
import { ScoringModal } from './ScoringModal'
import { useAwarenessScore, BELT_RANKS, type BeltRank } from '@/hooks/useAwarenessScore'
import { usePersonaStore } from '@/store/usePersonaStore'
import { PERSONAS, type PersonaId } from '@/data/learningPersonas'
import { AchievementBadgeGrid } from './AchievementBadgeGrid'

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

// ── Graduate CTA — shown when Curious users hit Orange/Green belt ────────────

const GRADUATE_PERSONAS: { id: PersonaId; pitch: string }[] = [
  { id: 'executive', pitch: 'Risk governance & compliance' },
  { id: 'developer', pitch: 'Hands-on protocol integration' },
  { id: 'architect', pitch: 'Infrastructure & key management' },
  { id: 'ops', pitch: 'Deploy & operate PQC at scale' },
  { id: 'researcher', pitch: 'Comprehensive deep dive' },
]

function GraduateCTA() {
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  const setPersona = usePersonaStore((s) => s.setPersona)
  const { belt } = useAwarenessScore()

  const showGraduate =
    selectedPersona === 'curious' &&
    (belt.name === 'Orange Belt' || belt.name === 'Green Belt' || belt.name === 'Blue Belt')

  if (!showGraduate) return null

  return (
    <div className="mt-4 p-4 glass-panel border-primary/20 bg-primary/5 rounded-xl space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles size={16} className="text-primary shrink-0" />
        <p className="text-sm font-semibold text-foreground">Ready to specialize?</p>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        You&apos;ve built a solid foundation. Choose a role-specific path to unlock deeper modules,
        more artifacts, and continue your belt progression.
      </p>
      <div className="flex flex-wrap gap-1.5">
        {GRADUATE_PERSONAS.map(({ id, pitch }) => (
          <button
            key={id}
            onClick={() => setPersona(id)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors text-left group"
          >
            <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">
              {/* eslint-disable-next-line security/detect-object-injection */}
              {PERSONAS[id].label}
            </span>
            <span className="text-[10px] text-muted-foreground hidden sm:inline">{pitch}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── ScoreCard ────────────────────────────────────────────────────────────────

export function ScoreCard({ embedded = false }: { embedded?: boolean }) {
  const result = useAwarenessScore()
  const [showScoring, setShowScoring] = useState(false)
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  // eslint-disable-next-line security/detect-object-injection
  const personaLabel = selectedPersona ? PERSONAS[selectedPersona]?.label : null
  const personaModuleCount = selectedPersona
    ? // eslint-disable-next-line security/detect-object-injection
      PERSONAS[selectedPersona]?.pathItems.filter((item) => item.type === 'module').length
    : null

  const { hasStarted, score, belt, nextBelt, pointsToNextBelt, thresholdGates, streak } = result

  const scoringModal = (
    <ScoringModal
      isOpen={showScoring}
      onClose={() => setShowScoring(false)}
      totalSteps={result.totalPersonaSteps}
      totalQuestions={result.totalPersonaQuestions}
    />
  )

  // ── Teaser state for new users ──────────────────────────────────────────────
  if (!hasStarted) {
    const teaserContent = (
      <>
        <div
          className={`flex flex-col sm:flex-row items-center gap-6 ${embedded ? '' : 'glass-panel p-6'}`}
        >
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
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              <p className="text-xs font-mono uppercase tracking-widest text-primary">
                Learning Journey
                {personaLabel && (
                  <span className="ml-2 normal-case tracking-normal text-secondary font-medium">
                    {personaLabel} path
                    {personaModuleCount ? ` (${personaModuleCount} modules)` : ''}
                  </span>
                )}
              </p>
              <span className="-m-2 p-2 block">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowScoring(true)}
                  aria-label="How scoring works"
                  className="h-5 w-5"
                >
                  <Info size={13} />
                </Button>
              </span>
            </div>
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
        {scoringModal}
      </>
    )

    if (embedded) return teaserContent

    return (
      <motion.section
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        aria-labelledby="scorecard-heading"
      >
        {teaserContent}
      </motion.section>
    )
  }

  // ── Active scorecard (compact) ─────────────────────────────────────────────
  const activeContent = (
    <>
      <div className={embedded ? '' : 'glass-panel p-6'}>
        {/* ── Header row ─────────────────────────────────────────────────── */}
        <div className="flex items-center gap-4">
          <BeltSwatch belt={belt} size="md" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-0.5">
              Learning Journey
              {personaLabel && (
                <span className="ml-2 normal-case tracking-normal text-secondary font-medium">
                  {personaLabel} path{personaModuleCount ? ` (${personaModuleCount} modules)` : ''}
                </span>
              )}
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
              <span className="-m-2 p-2 block">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowScoring(true)}
                  aria-label="How scoring works"
                  className="h-5 w-5"
                >
                  <Info size={14} />
                </Button>
              </span>
              <StreakBadge streak={streak.current} />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 italic">{belt.tagline}</p>
          </div>

          {/* Next belt hint */}
          {nextBelt && (
            <div className="text-right shrink-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                {pointsToNextBelt} pts to
              </p>
              <p className="text-[10px] sm:text-xs font-medium text-foreground">{nextBelt.name}</p>
            </div>
          )}
        </div>

        {/* Belt ladder + progress toward next belt */}
        <div className="mt-3 flex items-center gap-3">
          <BeltLadder currentBelt={belt} />
          <div className="flex-1">
            <BeltProgressBar score={score} belt={belt} nextBelt={nextBelt} />
          </div>
        </div>

        {/* Achievement badges */}
        <AchievementBadgeGrid />

        {/* Threshold gates checklist + CTA */}
        <div className="mt-4 flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            {thresholdGates.length > 0 && (
              <>
                <p className="text-xs font-medium text-foreground">Next belt unlock:</p>
                {thresholdGates.map((gate, i) => (
                  <p key={i} className="text-xs text-muted-foreground leading-relaxed">
                    {gate.message}
                    {gate.hint && (
                      <span className="text-muted-foreground/60"> — {gate.hint}</span>
                    )}
                  </p>
                ))}
              </>
            )}
          </div>
          <Link to="/learn" className="shrink-0 mt-0.5">
            <Button variant="outline" size="sm">
              Continue Learning
              <ArrowRight size={14} className="ml-1.5" />
            </Button>
          </Link>
        </div>

        {/* Graduate CTA for Curious users at Orange/Green belt */}
        <GraduateCTA />
      </div>
      {scoringModal}
    </>
  )

  if (embedded) return activeContent

  return (
    <motion.section
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      aria-labelledby="scorecard-heading"
    >
      {activeContent}
    </motion.section>
  )
}
