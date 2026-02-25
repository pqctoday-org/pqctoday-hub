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
  Info,
  Cloud,
  CloudOff,
  Upload,
  Download,
  Loader2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '../ui/button'
import { ScoringModal } from './ScoringModal'
import { useCloudSyncStore } from '@/store/useCloudSyncStore'
import { UnifiedStorageService } from '@/services/storage/UnifiedStorageService'
import { GoogleDriveService } from '@/services/storage/GoogleDriveService'
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

// ── CloudSyncSection ─────────────────────────────────────────────────────────

function CloudSyncSection() {
  const { enabled, lastSyncedAt, setEnabled, recordSync, disconnect } = useCloudSyncStore()
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isGoogleConfigured = GoogleDriveService.isConfigured()
  const isAuthenticated = enabled && GoogleDriveService.isAuthenticated()

  const formatSyncTime = (iso: string | null) => {
    if (!iso) return null
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins} min ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  const handleToggle = async () => {
    if (!isGoogleConfigured) return

    if (enabled) {
      GoogleDriveService.disconnect()
      disconnect()
      setError(null)
      return
    }

    try {
      setSyncing(true)
      setError(null)
      await GoogleDriveService.authenticate()
      setEnabled(true)
      toast.success('Connected to Google Drive')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setSyncing(false)
    }
  }

  const handleSave = async () => {
    try {
      setSyncing(true)
      setError(null)
      const snapshot = UnifiedStorageService.exportSnapshot('google-drive')
      await GoogleDriveService.saveSnapshot(snapshot)
      recordSync('upload')
      toast.success('Progress saved to Google Drive')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Save failed'
      setError(msg)
      toast.error(msg)
    } finally {
      setSyncing(false)
    }
  }

  const handleLoad = async () => {
    try {
      setSyncing(true)
      setError(null)
      const result = await GoogleDriveService.loadSnapshot()
      if (!result) {
        toast('No cloud backup found. Save your progress first.', { icon: 'ℹ️' })
        return
      }
      UnifiedStorageService.restoreSnapshot(result.snapshot)
      recordSync('download')
      toast.success('Progress loaded from Google Drive')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Load failed'
      setError(msg)
      toast.error(msg)
    } finally {
      setSyncing(false)
    }
  }

  const handleReAuth = async () => {
    try {
      setSyncing(true)
      setError(null)
      await GoogleDriveService.authenticate()
      toast.success('Signed in again')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setSyncing(false)
    }
  }

  // Manual file import handler (fallback when Google is not configured)
  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const loadingToast = toast.loading('Restoring progress...')
    try {
      const snapshot = await UnifiedStorageService.importSnapshot(file)
      UnifiedStorageService.restoreSnapshot(snapshot)
      toast.success('Progress restored from backup!', { id: loadingToast })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to restore', { id: loadingToast })
    }
    e.target.value = ''
  }

  // Status line (Google Drive mode only)
  let statusText = 'Saved to browser only'
  if (error) statusText = error
  else if (syncing) statusText = 'Syncing...'
  else if (enabled && !isAuthenticated) statusText = 'Session expired'
  else if (enabled && lastSyncedAt) statusText = `Last synced: ${formatSyncTime(lastSyncedAt)}`
  else if (enabled) statusText = 'Connected — no cloud backup yet'

  return (
    <div className="pt-3 mt-3 border-t border-border">
      {isGoogleConfigured ? (
        <>
          {/* Google Drive toggle row */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              {enabled ? (
                <Cloud size={14} className="text-primary" />
              ) : (
                <CloudOff size={14} className="text-muted-foreground" />
              )}
              <span className="text-xs font-medium text-foreground">Cloud Sync</span>
              <button
                onClick={handleToggle}
                disabled={syncing}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  enabled ? 'bg-primary' : 'bg-muted'
                }`}
                role="switch"
                aria-checked={enabled}
                aria-label="Toggle cloud sync"
              >
                <span
                  className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                    enabled ? 'translate-x-4.5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
            <span className={`text-xs ${error ? 'text-status-error' : 'text-muted-foreground'}`}>
              {statusText}
            </span>
          </div>

          {/* Google Drive actions */}
          {enabled && (
            <div className="flex items-center gap-2 mt-2">
              {isAuthenticated ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSave}
                    disabled={syncing}
                    className="text-xs h-7"
                  >
                    {syncing ? (
                      <Loader2 size={12} className="mr-1 animate-spin" />
                    ) : (
                      <Upload size={12} className="mr-1" />
                    )}
                    Save to Drive
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLoad}
                    disabled={syncing}
                    className="text-xs h-7"
                  >
                    <Download size={12} className="mr-1" />
                    Load from Drive
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReAuth}
                  disabled={syncing}
                  className="text-xs h-7"
                >
                  {syncing ? (
                    <Loader2 size={12} className="mr-1 animate-spin" />
                  ) : (
                    <Cloud size={12} className="mr-1" />
                  )}
                  Sign in again
                </Button>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Manual backup (no Google Drive configured) */}
          <div className="flex items-center gap-2 mb-2">
            <Download size={14} className="text-muted-foreground" />
            <span className="text-xs font-medium text-foreground">Backup Progress</span>
            <span className="text-xs text-muted-foreground">· saved to browser only</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => UnifiedStorageService.downloadSnapshot()}
              className="text-xs h-7"
            >
              <Download size={12} className="mr-1" />
              Export Backup
            </Button>
            <label className="cursor-pointer">
              <span className="inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-md text-xs font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-7 px-3">
                <Upload size={12} />
                Import Backup
              </span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
                aria-label="Import backup file"
              />
            </label>
          </div>
        </>
      )}
    </div>
  )
}

// ── ScoreCard ────────────────────────────────────────────────────────────────

export function ScoreCard() {
  const result = useAwarenessScore()
  const [isOpen, setIsOpen] = useState(result.hasStarted)
  const [showScoring, setShowScoring] = useState(false)

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
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              <p className="text-xs font-mono uppercase tracking-widest text-primary">
                Learning Journey
              </p>
              <button
                onClick={() => setShowScoring(true)}
                className="p-0.5 rounded text-muted-foreground hover:text-primary transition-colors"
                aria-label="How scoring works"
              >
                <Info size={13} />
              </button>
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
        <ScoringModal
          isOpen={showScoring}
          onClose={() => setShowScoring(false)}
          totalSteps={result.totalPersonaSteps}
          totalQuestions={result.totalPersonaQuestions}
        />
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
              <button
                onClick={() => setShowScoring(true)}
                className="p-0.5 rounded text-muted-foreground hover:text-primary transition-colors"
                aria-label="How scoring works"
              >
                <Info size={14} />
              </button>
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

                {/* ── Cloud Sync ─────────────────────────────────────── */}
                <CloudSyncSection />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ScoringModal
        isOpen={showScoring}
        onClose={() => setShowScoring(false)}
        totalSteps={result.totalPersonaSteps}
        totalQuestions={result.totalPersonaQuestions}
      />
    </motion.section>
  )
}
