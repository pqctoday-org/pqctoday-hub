// SPDX-License-Identifier: GPL-3.0-only
import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Map, Compass, Sparkles } from 'lucide-react'
import { useJourneyMap } from '@/hooks/useJourneyMap'
import { useAwarenessScore } from '@/hooks/useAwarenessScore'
import { useHistoryStore } from '@/store/useHistoryStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import { useRightPanelStore } from '@/store/useRightPanelStore'
import { PERSONAS } from '@/data/learningPersonas'
import { AchievementBadgeGrid } from '@/components/Landing/AchievementBadgeGrid'
import { JourneyPhaseRow } from './JourneyPhaseRow'
import { JourneyMilestoneRow } from './JourneyMilestoneRow'
import { HistoryEventRow } from './HistoryEventRow'
import type { HistoryEventType } from '@/types/HistoryTypes'

const RECENT_EVENT_TYPES = new Set<HistoryEventType>([
  'module_started',
  'module_completed',
  'artifact_key',
  'artifact_cert',
  'quiz_session',
  'assessment_completed',
  'belt_earned',
])

// ── Compact Belt Header ──────────────────────────────────────────────────────

function BeltHeader() {
  const { hasStarted, score, belt, nextBelt, pointsToNextBelt } = useAwarenessScore()
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  const selectedRegion = usePersonaStore((s) => s.selectedRegion)
  const selectedIndustries = usePersonaStore((s) => s.selectedIndustries)
  const close = useRightPanelStore((s) => s.close)

  // eslint-disable-next-line security/detect-object-injection
  const personaLabel = selectedPersona ? PERSONAS[selectedPersona].label : null
  const regionLabel =
    selectedRegion && selectedRegion !== 'global' ? selectedRegion.toUpperCase() : null
  const industryLabel = selectedIndustries.length > 0 ? selectedIndustries[0] : null

  const progressPct =
    hasStarted && nextBelt && nextBelt.minScore > belt.minScore
      ? Math.min(100, ((score - belt.minScore) / (nextBelt.minScore - belt.minScore)) * 100)
      : hasStarted
        ? 100
        : 0

  return (
    <div className="space-y-2">
      {/* Row 1: Belt + Score + Persona context */}
      <div className="flex items-center gap-2 flex-wrap">
        <div
          className="w-5 h-5 rounded-full border border-border shrink-0"
          style={{ backgroundColor: hasStarted ? belt.color : '#F5F5F5' }}
          title={hasStarted ? belt.name : 'White Belt'}
        />
        <span className="text-xs font-semibold text-foreground">
          {hasStarted ? belt.name : 'White Belt'}
        </span>
        <span className="text-[10px] text-muted-foreground tabular-nums">{score}/100</span>
        <span className="text-muted-foreground/30 text-[10px]">|</span>
        {personaLabel && (
          <span className="text-[10px] text-primary font-medium truncate max-w-[120px]">
            {personaLabel}
          </span>
        )}
        {regionLabel && (
          <span className="text-[10px] text-muted-foreground bg-muted/40 rounded px-1 py-px">
            {regionLabel}
          </span>
        )}
        {industryLabel && (
          <span className="text-[10px] text-muted-foreground bg-muted/40 rounded px-1 py-px truncate max-w-[120px]">
            {industryLabel}
          </span>
        )}
      </div>

      {/* Row 2: Progress bar toward next belt */}
      {hasStarted && nextBelt && (
        <div>
          <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
            <span>
              {pointsToNextBelt} pts to {nextBelt.name}
            </span>
          </div>
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%`, backgroundColor: belt.color }}
            />
          </div>
        </div>
      )}

      {/* Subtle graduation hint for Curious users at Orange+ */}
      {selectedPersona === 'curious' &&
        hasStarted &&
        (belt.name === 'Orange Belt' || belt.name === 'Green Belt' || belt.name === 'Blue Belt') && (
          <Link
            to="/"
            onClick={close}
            className="flex items-center gap-1 text-[10px] text-primary hover:underline mt-1"
          >
            <Sparkles size={10} />
            Ready to specialize? Pick a role path
          </Link>
        )}
    </div>
  )
}

// ── No Persona Prompt ────────────────────────────────────────────────────────

function NoPersonaPrompt() {
  const close = useRightPanelStore((s) => s.close)

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4">
      <div className="p-3 rounded-full bg-muted/30">
        <Map size={32} className="text-muted-foreground" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1">No journey map yet</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Select a persona on the home page to get a personalized learning journey tailored to your
          role.
        </p>
      </div>
      <Link
        to="/"
        onClick={close}
        className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
      >
        <Compass size={12} />
        Choose your persona
      </Link>
    </div>
  )
}

// ── Recent Activity (compact) ────────────────────────────────────────────────

function RecentActivity() {
  const events = useHistoryStore((s) => s.events)

  const recentEvents = useMemo(() => {
    return [...events]
      .filter((e) => RECENT_EVENT_TYPES.has(e.type))
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5)
  }, [events])

  if (recentEvents.length === 0) return null

  return (
    <div>
      <h4 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">
        Recent Activity
      </h4>
      <div className="space-y-0.5">
        {recentEvents.map((event) => (
          <HistoryEventRow key={event.id} event={event} />
        ))}
      </div>
    </div>
  )
}

// ── Off the Beaten Path ──────────────────────────────────────────────────────

function OffPathSection() {
  const { outsidePath } = useJourneyMap()
  const close = useRightPanelStore((s) => s.close)

  if (outsidePath.length === 0) return null

  return (
    <div>
      <h4 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">
        Off the Beaten Path
      </h4>
      <div className="space-y-0.5">
        {outsidePath.map((item) => (
          <Link
            key={item.id}
            to={item.route}
            onClick={close}
            className="flex items-center gap-2 py-1 px-2 -mx-1 rounded hover:bg-muted/30 transition-colors group"
          >
            <span
              className={`text-xs flex-1 min-w-0 truncate ${
                item.status === 'completed' ? 'text-muted-foreground' : 'text-foreground'
              } group-hover:text-foreground transition-colors`}
            >
              {item.label}
              {item.track && (
                <span className="text-[10px] text-muted-foreground/60 ml-1">({item.track})</span>
              )}
            </span>
            {item.stepProgress && (
              <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
                {item.stepProgress.done}/{item.stepProgress.total}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}

// ── Main Panel ───────────────────────────────────────────────────────────────

export const JourneyMapPanel: React.FC = () => {
  const { phases, currentPhaseIndex, overall, hasPersona } = useJourneyMap()

  if (!hasPersona) {
    return <NoPersonaPrompt />
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header: Belt + Overall Progress */}
      <div className="px-4 py-3 border-b border-border space-y-2.5 shrink-0">
        <BeltHeader />
        <div>
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
            <span>Journey Progress</span>
            <span className="tabular-nums">
              {overall.done}/{overall.total} steps · {overall.percent}%
            </span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${overall.percent}%` }}
            />
          </div>
        </div>
        <AchievementBadgeGrid />
      </div>

      {/* Scrollable Journey Map */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {phases.map((phase, idx) =>
          phase.type === 'milestone' ? (
            <JourneyMilestoneRow key={phase.id} phase={phase} />
          ) : (
            <JourneyPhaseRow key={phase.id} phase={phase} isCurrent={idx === currentPhaseIndex} />
          )
        )}

        {/* Divider + Off-Path + Recent Activity */}
        <div className="pt-3 space-y-4">
          <OffPathSection />
          <RecentActivity />
        </div>
      </div>
    </div>
  )
}
